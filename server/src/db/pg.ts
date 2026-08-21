import fs from 'fs';
import path from 'path';
import pg from 'pg';

const { Pool } = pg;

let pool: pg.Pool | null = null;
let initialized = false;
let disabledReason: string | null = null;

function isLoopbackUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname === 'localhost' || u.hostname === '127.0.0.1' || u.hostname === '::1';
  } catch {
    return /localhost|127\.0\.0\.1/.test(url);
  }
}

/** Vercel Postgres sets POSTGRES_URL; .env.example uses DATABASE_URL pointing at local Docker. */
export function resolveDatabaseUrl(): string | null {
  const candidates = [
    process.env.POSTGRES_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.DATABASE_URL,
  ];

  for (const raw of candidates) {
    const url = raw?.trim();
    if (!url) continue;
    if (process.env.VERCEL && isLoopbackUrl(url)) {
      continue;
    }
    return url;
  }

  return null;
}

export function disablePg(reason: string): void {
  disabledReason = reason;
  console.warn('PostgreSQL disabled:', reason);
}

export function pgEnabled(): boolean {
  if (disabledReason) return false;
  return Boolean(resolveDatabaseUrl());
}

export function getPool(): pg.Pool {
  if (!pool) {
    const connectionString = resolveDatabaseUrl();
    if (!connectionString) {
      throw new Error('No Postgres connection string');
    }
    const useSsl =
      process.env.PGSSLMODE === 'require' ||
      process.env.POSTGRES_SSL === 'true' ||
      (process.env.VERCEL === '1' && !isLoopbackUrl(connectionString)) ||
      (process.env.NODE_ENV === 'production' && !isLoopbackUrl(connectionString));

    pool = new Pool({
      connectionString,
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
      max: process.env.VERCEL ? 1 : 10,
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: process.env.VERCEL ? 3000 : 10000,
    });
  }
  return pool;
}

function schemaPath(): string {
  const candidates = [
    path.resolve(process.cwd(), 'server/sql/schema.sql'),
    path.resolve(process.cwd(), 'sql/schema.sql'),
  ];
  const found = candidates.find((p) => fs.existsSync(p));
  if (!found) throw new Error('schema.sql not found');
  return found;
}

export async function initPg(): Promise<void> {
  if (!pgEnabled() || initialized) return;

  const sql = fs.readFileSync(schemaPath(), 'utf-8');
  await getPool().query(sql);
  initialized = true;
  console.log('PostgreSQL schema ready');
}

export async function pgQuery<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<pg.QueryResult<T>> {
  await initPg();
  return getPool().query<T>(text, params);
}

export function iso(d: Date | string): string {
  return d instanceof Date ? d.toISOString() : new Date(d).toISOString();
}
