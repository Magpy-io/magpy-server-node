import '@tests/helpers/loadEnvFile';
import { mockModules } from '@tests/helpers/mockModules';
mockModules();

import { describe, expect, it } from '@jest/globals';

import { Express } from 'express';
import { ClaimServerLocal } from '@src/api/export';

import * as mockValues from '@src/modules/BackendQueries/__mocks__/mockValues';

import * as mockValuesGetIp from '@src/modules/__mocks__/NetworkManagerMockValues';

import { initServer, stopServer } from '@src/server/server';
import { SaveServerCredentials, SaveServerToken } from '@src/modules/serverDataManager';
import * as sac from '@tests/helpers/setupAndCleanup';
import { expectToBeOk, expectToNotBeOk, expectErrorCodeToBe, defaultUsername, defaultPassword, setupServerClaimed, setupServerClaimedLocally } from '@tests/helpers/functions';

describe("Test 'claimServerLocal' endpoint", () => {
  let app: Express;

  beforeAll(async () => {
    app = await initServer();
  });

  afterAll(async () => {
    stopServer();
  });

  beforeEach(async () => {
    await sac.beforeEachNotClaimed(app);
  });

  afterEach(async () => {
    await sac.afterEach();
  });

  it('Should return ok when claiming a non claimed server', async () => {
    const ret = await ClaimServerLocal.Post({
      username:defaultUsername,
      password:defaultPassword,
    });

    expectToBeOk(ret);
    expect(ret.warning).toBe(false);
  });

  it('Should return error SERVER_ALREADY_CLAIMED when claiming a server already claimed remotly', async () => {
    await setupServerClaimed()

    const ret = await ClaimServerLocal.Post({
      username:defaultUsername,
      password:defaultPassword,
    });
    expectToNotBeOk(ret);
    expectErrorCodeToBe(ret, 'SERVER_ALREADY_CLAIMED');
  });

  it('Should return error SERVER_ALREADY_CLAIMED when claiming a server already claimed locally', async () => {
    await setupServerClaimedLocally();

    const ret = await ClaimServerLocal.Post({
      username:defaultUsername,
      password:defaultPassword,
    });
    expectToNotBeOk(ret);
    expectErrorCodeToBe(ret, 'SERVER_ALREADY_CLAIMED');
  });

});
