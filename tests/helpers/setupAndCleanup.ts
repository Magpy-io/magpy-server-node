import { Express } from "express";

import { volumeReset } from "@tests/helpers/mockFsVolumeManager";
import { clearFilesWaiting } from "@src/server/server";
import { openAndInitDB, clearDB } from "@src/db/sequelizeDb";
import {
  LoadConfigFile,
  ClearServerConfigData,
} from "@src/modules/serverDataManager";
import { setupServerUserToken } from "@tests/helpers/functions";

export async function beforeEachNoUserTokenSetup(app: Express) {
  await volumeReset();
  await ClearServerConfigData();
  await LoadConfigFile();
  await openAndInitDB();
}

export async function beforeEach(app: Express) {
  await volumeReset();
  await ClearServerConfigData();
  await LoadConfigFile();
  await openAndInitDB();
  await setupServerUserToken(app);
}

export async function afterEach() {
  await clearDB();
  await clearFilesWaiting();
}
