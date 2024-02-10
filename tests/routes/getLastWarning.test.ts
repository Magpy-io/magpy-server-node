import '@tests/helpers/loadEnvFile';
import { mockModules } from '@tests/helpers/mockModules';
mockModules();

import { describe, expect, it } from '@jest/globals';
import { GetLastWarning } from '@src/api/export';
import { WarningPhotosNotOnDiskDeletedType } from '@src/api/export/Types/WarningTypes';
import { SetLastWarningForUser } from '@src/modules/warningsManager';
import { initServer, stopServer } from '@src/server/server';
import { expectToBeOk, getDataFromRet, getUserId } from '@tests/helpers/functions';

import * as sac from '@tests/helpers/setupAndCleanup';
import { Express } from 'express';

describe("Test 'getLastWarning' endpoint", () => {
  let app: Express;

  beforeAll(async () => {
    app = await initServer();
  });

  afterAll(async () => {
    stopServer();
  });

  beforeEach(async () => {
    await sac.beforeEach(app);
  });

  afterEach(async () => {
    await sac.afterEach();
  });

  it('Should return null when no warnings are stored', async () => {
    const ret = await GetLastWarning.Post();

    expectToBeOk(ret);
    expect(ret.warning).toBe(false);
    const data = getDataFromRet(ret);

    expect(data).toHaveProperty('warning');
    expect(data.warning).toBeNull();
  });

  it('Should return the warning when a warning is stored', async () => {
    const photoMissing = {
      id: '',
      meta: {
        name: '',
        fileSize: 0,
        width: 0,
        height: 0,
        date: '',
        syncDate: '',
        serverPath: '',
        mediaIds: [],
      },
      image64: '',
    };
    const warning: WarningPhotosNotOnDiskDeletedType = {
      code: 'PHOTOS_NOT_ON_DISK_DELETED',
      data: {
        photosDeleted: [photoMissing],
      },
    };
    SetLastWarningForUser(getUserId(), warning);

    const ret = await GetLastWarning.Post();
    expectToBeOk(ret);
    expect(ret.warning).toBe(false);
    const data = getDataFromRet(ret);

    expect(data).toHaveProperty('warning');
    expect(data.warning).toEqual(warning);
  });
});
