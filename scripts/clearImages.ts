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
}

ResetServer()
  .then(() => {
    console.log('storage directory cleared.');
  })
  .catch(err => {
    console.log('Error while clearing storage directory');
    console.log(err);
  });
