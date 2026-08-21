import fs from 'fs';
import path from 'path';

/** Writable data directory — /tmp on Vercel serverless, server/data locally. */
export function resolveDataDir(): string {
  if (process.env.DATA_DIR) {
    return path.resolve(process.env.DATA_DIR);
  }

  if (process.env.VERCEL) {
    return path.join('/tmp', 'red-box-data');
  }

  const serverData = path.resolve(process.cwd(), 'server/data');
  if (fs.existsSync(serverData)) return serverData;

  const legacyData = path.resolve(process.cwd(), 'data');
  if (fs.existsSync(legacyData)) return legacyData;

  const cwdData = path.resolve(process.cwd(), 'data');
  return cwdData;
}

export function resolveConfigPath(filename: string): string | null {
  const candidates = [
    path.resolve(process.cwd(), 'config', filename),
    path.resolve(process.cwd(), '../config', filename),
  ];
  return candidates.find((p) => fs.existsSync(p)) ?? null;
}

/** Copy bundled seed JSON into writable data dir on cold start (serverless). */
export function ensureSeedDataFile(dataDir: string, filename: string): void {
  if (!process.env.VERCEL) return;

  const dest = path.join(dataDir, filename);
  if (fs.existsSync(dest)) return;

  const seeds = [
    path.resolve(process.cwd(), 'server/data', filename),
    path.resolve(process.cwd(), 'data', filename),
  ];

  const seed = seeds.find((p) => fs.existsSync(p));
  if (!seed) return;

  fs.mkdirSync(dataDir, { recursive: true });
  fs.copyFileSync(seed, dest);
}
