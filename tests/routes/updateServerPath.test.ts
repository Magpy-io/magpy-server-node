import '@tests/helpers/loadEnvFile';
import { mockModules } from '@tests/helpers/mockModules';
mockModules();

import { describe, expect, it } from '@jest/globals';

import { Express } from 'express';
import { UpdateServerPath } from '@src/api/export';

import { createFolder } from '@src/modules/diskManager';

import { GetPathFromRoot } from '@tests/helpers/mockFsVolumeManager';
import { initServer, stopServer } from '@src/server/server';

import * as sac from '@tests/helpers/setupAndCleanup';

import { GetStorageFolderPath } from '@src/modules/serverDataManager';
import { expectErrorCodeToBe, expectToBeOk, expectToNotBeOk } from '@tests/helpers/functions';

describe("Test 'updateServerPath' endpoint", () => {
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

  it('Should return ok when changing the server path to a valid one', async () => {
    const photosPath = GetPathFromRoot('/pathToPhotos');

    await createFolder(photosPath);
    const ret = await UpdateServerPath.Post({ path: photosPath });

    expectToBeOk(ret);
    expect(ret.warning).toBe(false);

    const serverName = GetStorageFolderPath();

    expect(serverName).toBe(photosPath);
  });

  it('Should return error PATH_FOLDER_DOES_NOT_EXIST when using a folder that does not exist', async () => {
    const serverPathBefore = GetStorageFolderPath();

    const ret = await UpdateServerPath.Post({
      path: GetPathFromRoot('/nonExistingPath'),
    });

    expectToNotBeOk(ret);
    expectErrorCodeToBe(ret, 'PATH_FOLDER_DOES_NOT_EXIST');

    const serverPath = GetStorageFolderPath();

    expect(serverPath).toBe(serverPathBefore);
  });
});
