import { InitModules } from './config/configModules';
import { openAndInitDB } from './db/sequelizeDb';
import { startMdns } from './server/mdnsSetup';
import { initServer } from './server/server';

export async function main() {
  await InitModules();
  await openAndInitDB();
  await initServer();
  startMdns();
}
