import { Express } from "express";
import { volumeReset } from "@tests/helpers/mockFsVolumeManager";
import { openAndInitDB, clearDB } from "@src/db/sequelizeDb";
import { InitModules, ClearModules } from "@src/config/configModules";
import { setupServerUserToken } from "@tests/helpers/functions";

export async function beforeEachNoUserTokenSetup(app: Express) {
  await volumeReset();
  await InitModules();
  await openAndInitDB();
}

export async function beforeEach(app: Express) {
  await volumeReset();
  await InitModules();
  await openAndInitDB();
  await setupServerUserToken(app);
}

export async function afterEach() {
  await clearDB();
  await ClearModules();
}
