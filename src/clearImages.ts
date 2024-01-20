// IMPORTS
import dotenv from 'dotenv';

import { ClearModulesKeepServerConfig, InitModules } from './config/configModules';
import { clearDbFile, clearImagesDisk } from './modules/diskManager';

dotenv.config();

async function ResetServer() {
  await InitModules();
  await clearDbFile();
  console.log('database cleared');
  await clearImagesDisk();
  console.log('storage directory cleared.');
  await ClearModulesKeepServerConfig();
}

ResetServer().catch(err => {
  console.log(err);
});
