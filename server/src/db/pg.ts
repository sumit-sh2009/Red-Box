import fs from 'fs';
import path from 'path';
import pg from 'pg';

const { Pool } = pg;

let pool: pg.Pool | null = null;
let initialized = false;

export function pgEnabled(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function getPool(): pg.Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL!;
    const useSsl =
      process.env.PGSSLMODE === 'require' ||
      process.env.POSTGRES_SSL === 'true' ||
      (process.env.NODE_ENV === 'production' && !connectionString.includes('localhost'));

    pool = new Pool({
      connectionString,
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
      max: process.env.VERCEL ? 1 : 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
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
