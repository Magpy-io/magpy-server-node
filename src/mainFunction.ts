import { InitModules } from './config/configModules';
import { openAndInitDB } from './db/sequelizeDb';
import { startServerDiscovery } from './server/serverDiscovery';
import { initServer, setupShutdownManager } from './server/server';
import { setupOpenInterfaceEvent } from './modules/LaunchWebBrowserInterface';

import packageJson from '../package.json';
import { setupExceptionsHandler } from './modules/ErrorHandler';

export async function main() {
  console.log('Running Magpy Server v' + packageJson.version);
  setupExceptionsHandler();
  await InitModules();
  await openAndInitDB();
  await initServer();
  setupShutdownManager();
  await startServerDiscovery();
  setupOpenInterfaceEvent();
}
