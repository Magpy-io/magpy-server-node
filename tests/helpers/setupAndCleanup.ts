import { Express } from "express";

import { volumeReset } from "@tests/helpers/mockFsVolumeManager";
import { clearFilesWaiting } from "@src/server/server";
import { openAndInitDB, clearDB } from "@src/db/sequelizeDb";
import { setupServerUserToken } from "@tests/helpers/functions";

export async function beforeEachGetTokenTest(app: Express) {
  await openAndInitDB();
  await volumeReset();
}

export async function beforeEach(app: Express) {
  await openAndInitDB();
  await volumeReset();
  await setupServerUserToken(app);
}

export async function afterEach() {
  await clearDB();
  await clearFilesWaiting();
}
