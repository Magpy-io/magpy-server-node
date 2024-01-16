import { SetPath } from "../modules/BackendQueries";
import * as config from "./config";

import { LoadConfigFile } from "../modules/serverDataManager";
import { clearFilesWaiting } from "../server/server";
import { ClearAllWarnings } from "../modules/warningsManager";
import { ClearServerDataFile } from "../modules/serverDataManager/serverDataFileManager";

export async function InitModules() {
  SetPath(config.backend_host + ":" + config.backend_port);
  await LoadConfigFile();
  await clearFilesWaiting();
  ClearAllWarnings();
}

export async function ClearModules() {
  SetPath("");
  await ClearServerDataFile();
  await clearFilesWaiting();
  ClearAllWarnings();
}

export async function ClearModulesKeepServerConfig() {
  SetPath("");
  await clearFilesWaiting();
  ClearAllWarnings();
}
