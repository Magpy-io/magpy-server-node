import { SetupStdinEvents } from '../modules/StdinEvents/';
import { SetPath } from '../modules/BackendQueries';
import { LoadConfigFile } from '../modules/serverDataManager';
import { ClearServerDataFile } from '../modules/serverDataManager/serverDataFileManager';
import { ClearAllWarnings } from '../modules/warningsManager';
import { clearFilesWaiting } from '../server/server';
import * as config from './config';
import { createPhotosDir } from '../modules/diskManager';

export async function InitModules() {
  SetPath(config.backend_host + ':' + config.backend_port);
  await LoadConfigFile();
  await clearFilesWaiting();
  ClearAllWarnings();
  SetupStdinEvents();
  await createPhotosDir();
}

export async function ClearModules() {
  SetPath('');
  await ClearServerDataFile();
  await clearFilesWaiting();
  ClearAllWarnings();
}

export async function ClearModulesKeepServerConfig() {
  SetPath('');
  await clearFilesWaiting();
  ClearAllWarnings();
}
