// IMPORTS
import dotenv from 'dotenv';

import { clearDbFile, clearImagesDisk } from '../src/modules/diskManager';
import { LoadConfigFile } from '../src/modules/serverDataManager';

dotenv.config();

async function ResetServer() {
  await LoadConfigFile();
  await clearDbFile();
  console.log('database cleared');
  await clearImagesDisk();
  console.log('storage directory cleared.');
}

ResetServer().catch(err => {
  console.log(err);
});
