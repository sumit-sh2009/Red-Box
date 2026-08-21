import { initPg, pgQuery } from './pg.js';
import * as dbPg from './databasePg.js';
import * as civicPg from './civicPg.js';
import { initialUsers } from './seed.js';
import { seedCivicData } from './seedCivic.js';

export async function seedPgDatabase(): Promise<void> {
  await initPg();

  const { rows } = await pgQuery<{ c: number }>('SELECT COUNT(*)::int AS c FROM users');
  if (rows[0]?.c > 0) {
    await civicPg.seedIfEmpty(() => seedCivicData('user_citizen_demo'));
    return;
  }

  for (const user of initialUsers) {
    await dbPg.createUser(user);
  }

  await dbPg.seedSocialIfEmpty();
  await civicPg.seedIfEmpty(() => seedCivicData('user_citizen_demo'));
}
