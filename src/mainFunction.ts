import { InitModules } from './config/configModules';
import { openAndInitDB } from './db/sequelizeDb';
import { startServerDiscovery } from './server/serverDiscovery';
import { initServer } from './server/server';

import packageJson from '../package.json';

export async function main() {
  console.log('Running Magpy V' + packageJson.version);
  await InitModules();
  await openAndInitDB();
  await initServer();
  await startServerDiscovery();
}
