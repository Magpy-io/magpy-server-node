import { Express } from 'express';

import { volumeReset } from '@tests/helpers/mockFsVolumeManager';
import { openAndInitDB, clearDB } from '@src/db/sequelizeDb';
import { InitModules, ClearModules } from '@src/config/configModules';
import { setupServerUserToken, setupServerClaimed, setupServerLocalUserToken, setupServerClaimedLocally } from '@tests/helpers/functions';
import { setupAxiosMock } from '@tests/__mocks__/axiosMockHelper';

export async function beforeEachNotClaimed(app: Express) {
  await volumeReset();
  await InitModules();
  setupAxiosMock(app);
  await openAndInitDB();
}

export async function beforeEachNoUserTokenRequested(app: Express) {
  await volumeReset();
  await InitModules();
  setupAxiosMock(app);
  await openAndInitDB();
  await setupServerClaimed();
}

export async function beforeEachNoUserTokenRequestedLocal(app: Express) {
  await volumeReset();
  await InitModules();
  setupAxiosMock(app);
  await openAndInitDB();
  await setupServerClaimedLocally();
}

export async function beforeEach(app: Express) {
  await volumeReset();
  await InitModules();
  setupAxiosMock(app);
  await openAndInitDB();
  await setupServerClaimed();
  await setupServerUserToken();
}

export async function beforeEachLocalClaim(app: Express) {
  await volumeReset();
  await InitModules();
  setupAxiosMock(app);
  await openAndInitDB();
  await setupServerClaimedLocally();
  await setupServerLocalUserToken();
}

export async function afterEach() {
  await clearDB();
  await ClearModules();
}
