import '@tests/helpers/loadEnvFile';
import { mockModules } from '@tests/helpers/mockModules';
mockModules();

import { describe, expect, it } from '@jest/globals';

import { Express } from 'express';
import { GetTokenLocal, UnclaimServer } from '@src/api/export';

import * as mockValues from '@src/modules/BackendQueries/__mocks__/mockValues';

import { initServer, stopServer } from '@src/server/server';

import * as sac from '@tests/helpers/setupAndCleanup';
import {
  defaultPassword,
  defaultUsername,
  expectErrorCodeToBe,
  expectToBeOk,
  expectToNotBeOk,
  setupServerClaimed,
  setupServerClaimedLocally,
  testReturnedToken,
} from '@tests/helpers/functions';

describe("Test 'claimServerLocal' endpoint", () => {
  let app: Express;

  beforeAll(async () => {
    app = await initServer();
  });

  afterAll(async () => {
    stopServer();
  });

  beforeEach(async () => {
    await sac.beforeEachNoUserTokenRequestedLocal(app);
  });

  afterEach(async () => {
    await sac.afterEach();
  });

  it('Should return a valid token when asking a locally claimed server', async () => {
    const ret = await GetTokenLocal.Post({
      username:defaultUsername,
      password:defaultPassword
    });

    expectToBeOk(ret);
    expect(ret.warning).toBe(false);

    testReturnedToken();
  });

  it('Should return SERVER_NOT_CLAIMED when asking a remotly claimed server', async () => {

    await UnclaimServer.Post();

    await setupServerClaimed();

    const ret = await GetTokenLocal.Post({      
      username:defaultUsername,
      password:defaultPassword
    });

    expectToNotBeOk(ret);
    expectErrorCodeToBe(ret,'SERVER_NOT_CLAIMED');
  });

  it('Should return error SERVER_NOT_CLAIMED when requesting a server not claimed', async () => {
    await UnclaimServer.Post();

    const ret = await GetTokenLocal.Post({
      username:defaultUsername,
      password:defaultPassword
    });

    expectToNotBeOk(ret);
    expectErrorCodeToBe(ret, 'SERVER_NOT_CLAIMED');
  });

  it('Should return error INVALID_CREDENTIALS when requesting a server with a wrong username', async () => {
    const ret = await GetTokenLocal.Post({
      username: 'wrong_username',
      password:defaultPassword
    });

    expectToNotBeOk(ret);
    expectErrorCodeToBe(ret, 'INVALID_CREDENTIALS');
  });

  it('Should return error INVALID_CREDENTIALS when requesting a server with a wrong password', async () => {
    const ret = await GetTokenLocal.Post({
      username: defaultUsername,
      password:'wrong_password'
    });

    expectToNotBeOk(ret);
    expectErrorCodeToBe(ret, 'INVALID_CREDENTIALS');
  });
});
