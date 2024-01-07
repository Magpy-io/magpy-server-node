import { SetPath } from "@src/modules/backendImportedQueries";
import * as config from "@src/config/config";

import { LoadConfigFile } from "@src/modules/serverDataManager";
import { clearFilesWaiting } from "@src/server/server";
import { ClearAllWarnings } from "@src/modules/warningsManager";
import { ClearServerDataFile } from "@src/modules/serverDataManager/serverDataFileManager";

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
