import '@tests/helpers/loadEnvFile';
import { mockModules } from '@tests/helpers/mockModules';
mockModules();

import { describe, expect, it } from '@jest/globals';

import { Express } from 'express';
import { UpdateServerName } from '@src/api/export';

import { initServer, stopServer } from '@src/server/server';
import * as sac from '@tests/helpers/setupAndCleanup';

import { GetServerName } from '@src/modules/serverDataManager';
import { expectErrorCodeToBe, expectToBeOk, expectToNotBeOk } from '@tests/helpers/functions';

describe("Test 'updateServerName' endpoint", () => {
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

  it.each([
    { name: 'newName' },
    { name: 'newName with spaces' },
    { name: 'newName with special chars _ -' },
  ])('Should return ok when changing the server name to $name', async testData => {
    const ret = await UpdateServerName.Post({
      name: testData.name,
    });

    expectToBeOk(ret);
    expect(ret.warning).toBe(false);

    const serverName = GetServerName();

    expect(serverName).toBe(testData.name);
  });

  it.each([
    { name: 'ab' },
    {
      name: '12345678901234567890123456789012345678901234567890123456789012345678901',
    },
    { name: 'abc!' },
  ])('Should return error INVALID_NAME when using the name : $name', async testData => {
    const serverNameBefore = GetServerName();
    const ret = await UpdateServerName.Post({
      name: testData.name,
    });

    expectToNotBeOk(ret);
    expectErrorCodeToBe(ret, 'INVALID_NAME');

    const serverName = GetServerName();

    expect(serverName).toBe(serverNameBefore);
  });
});
