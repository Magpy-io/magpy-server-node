import { InitModules } from './config/configModules';
import { openAndInitDB } from './db/sequelizeDb';
import { startServerDiscovery } from './server/serverDiscovery';
import { initServer, setupShutdownManager } from './server/server';
import { setupOpenInterfaceEvent } from './modules/LaunchWebBrowserInterface';

import packageJson from '../package.json';

export async function main() {
  console.log('Running Magpy V' + packageJson.version);
  await InitModules();
  await openAndInitDB();
  await initServer();
  setupShutdownManager();
  await startServerDiscovery();
  setupOpenInterfaceEvent();
}
