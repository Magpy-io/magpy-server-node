import '@tests/helpers/loadEnvFile';
import { mockModules } from '@tests/helpers/mockModules';
mockModules();

import { describe, expect, it } from '@jest/globals';

import { Express } from 'express';
import { GetServerInfo, UnclaimServer } from '@src/api/export';

import { initServer, stopServer } from '@src/server/server';
import * as sac from '@tests/helpers/setupAndCleanup';
import * as mockValues from '@src/modules/BackendQueries/__mocks__/mockValues';

import {
  GetServerName,
  GetStorageFolderPath,
  SaveStorageFolderPath,
  SaveServerName,
} from '@src/modules/serverDataManager';
import {
  defaultUsername,
  expectToBeOk,
  getDataFromRet,
  setupServerClaimed,
  setupServerClaimedLocally,
} from '@tests/helpers/functions';

describe("Test 'getServerInfo' endpoint", () => {
  let app: Express;

  beforeAll(async () => {
    app = await initServer();
  });

  afterAll(async () => {
    await stopServer();
  });

  beforeEach(async () => {
    await sac.beforeEachNotClaimed(app);
  });

  afterEach(async () => {
    await sac.afterEach();
  });

  it('Should return the default server info when claimed remotly', async () => {
    await setupServerClaimed();

    const ret = await GetServerInfo.Post();

    expectToBeOk(ret);
    expect(ret.warning).toBe(false);

    const data = getDataFromRet(ret);

    const serverName = GetServerName();
    const serverPath = GetStorageFolderPath();

    expect(data.storagePath).toBe(serverPath);
    expect(data.serverName).toBe(serverName);

    expect(data.owner).toBeTruthy();
    if (!data.owner) {
      throw new Error('owner not found');
    }

    expect(data.owner.name).toBe(mockValues.validUserName);
    expect(data.owner.email).toBe(mockValues.validUserEmail);

    expect(data.ownerLocal).toBeNull();
  });

  it('Should return the default server info when claimed locally', async () => {
    await setupServerClaimedLocally();

    const ret = await GetServerInfo.Post();

    expectToBeOk(ret);
    expect(ret.warning).toBe(false);

    const data = getDataFromRet(ret);

    const serverName = GetServerName();
    const serverPath = GetStorageFolderPath();

    expect(data.storagePath).toBe(serverPath);
    expect(data.serverName).toBe(serverName);

    expect(data.ownerLocal).toBeTruthy();
    if (!data.ownerLocal) {
      throw new Error('ownerLocal not found');
    }

    expect(data.ownerLocal.name).toBe(defaultUsername);

    expect(data.owner).toBeNull();
  });

  it('Should return the updated server info when changed', async () => {
    await SaveStorageFolderPath('newPath');
    await SaveServerName('newName');

    const ret = await GetServerInfo.Post();

    expectToBeOk(ret);
    const data = getDataFromRet(ret);

    expect(data.storagePath).toBe('newPath');
    expect(data.serverName).toBe('newName');
  });

  it('Should return owner null and ownerLocal null for an unclaimed server', async () => {
    const ret = await GetServerInfo.Post();

    expectToBeOk(ret);
    const data = getDataFromRet(ret);
    expect(data.owner).toBeNull();
    expect(data.ownerLocal).toBeNull();
  });
});
