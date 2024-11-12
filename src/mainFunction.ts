import './modules/initNodeEnv';

import { InitModules } from './config/configModules';
import { openAndInitDB } from './db/sequelizeDb';
import { startServerDiscovery } from './server/serverDiscovery';
import { initServer, setupShutdownManager } from './server/server';
import { setupOpenInterfaceEvent } from './modules/LaunchWebBrowserInterface';

import packageJson from '../package.json';
import { Logger } from './modules/Logger';

export async function main() {
  Logger.info('Running Magpy Server v' + packageJson.version);
  try {
    await InitModules();
    await openAndInitDB();
    await initServer();
    setupShutdownManager();
    await startServerDiscovery();
    setupOpenInterfaceEvent();
  } catch (e) {
    Logger.error('Error starting app', e);
  }
}
