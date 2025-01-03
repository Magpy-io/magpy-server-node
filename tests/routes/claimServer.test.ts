import '@tests/helpers/loadEnvFile';
import { mockModules } from '@tests/helpers/mockModules';
mockModules();

import { describe, expect, it } from '@jest/globals';

import { Express } from 'express';
import { ClaimServer } from '@src/api/export';

import * as mockValues from '@src/modules/BackendQueries/__mocks__/mockValues';

import * as mockValuesGetIp from '@src/modules/__mocks__/NetworkManagerMockValues';

import { initServer, stopServer } from '@src/server/server';
import * as sac from '@tests/helpers/setupAndCleanup';
import {
  expectToBeOk,
  expectToNotBeOk,
  expectErrorCodeToBe,
  setupServerClaimed,
  setupServerClaimedLocally,
} from '@tests/helpers/functions';

describe("Test 'claimServer' endpoint", () => {
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

  it('Should return ok when claiming a non claimed server', async () => {
    const ret = await ClaimServer.Post({
      userToken: mockValues.validUserToken,
    });

    expectToBeOk(ret);
    expect(ret.warning).toBe(false);
  });

  it('Should return error AUTHORIZATION_BACKEND_FAILED when trying to claim a server with a non valid token', async () => {
    const ret = await ClaimServer.Post({
      userToken: mockValues.invalidUserToken,
    });

    expectToNotBeOk(ret);
    expectErrorCodeToBe(ret, 'AUTHORIZATION_BACKEND_FAILED');
  });

  it('Should return error AUTHORIZATION_BACKEND_EXPIRED when trying to claim a server with an expired token', async () => {
    const ret = await ClaimServer.Post({
      userToken: mockValues.expiredUserToken,
    });
    expectToNotBeOk(ret);
    expectErrorCodeToBe(ret, 'AUTHORIZATION_BACKEND_EXPIRED');
  });

  it('Should return error SERVER_ALREADY_CLAIMED when claiming a server already claimed remotly', async () => {
    await setupServerClaimed();

    const ret = await ClaimServer.Post({
      userToken: mockValues.validUserToken,
    });
    expectToNotBeOk(ret);
    expectErrorCodeToBe(ret, 'SERVER_ALREADY_CLAIMED');
  });

  it('Should return error SERVER_ALREADY_CLAIMED when claiming a server already claimed locally', async () => {
    await setupServerClaimedLocally();

    const ret = await ClaimServer.Post({
      userToken: mockValues.validUserToken,
    });
    expectToNotBeOk(ret);
    expectErrorCodeToBe(ret, 'SERVER_ALREADY_CLAIMED');
  });

  it('Should return error BACKEND_SERVER_UNREACHABLE when claiming a server but backend unreachable', async () => {
    mockValues.failNextRequestServerUnreachable();

    const ret = await ClaimServer.Post({
      userToken: mockValues.validUserToken,
    });
    expectToNotBeOk(ret);
    expectErrorCodeToBe(ret, 'BACKEND_SERVER_UNREACHABLE');
  });

  it('Should return error SERVER_ERROR when claiming a server but receiving unexpected error from backend', async () => {
    mockValues.failNextRequest();

    const ret = await ClaimServer.Post({
      userToken: mockValues.validUserToken,
    });
    expectToNotBeOk(ret);
    expectErrorCodeToBe(ret, 'SERVER_ERROR');
  });

  it('Should return error SERVER_ERROR when claiming a server but could not retrieve my own ip address', async () => {
    mockValuesGetIp.failNextRequest();

    const ret = await ClaimServer.Post({
      userToken: mockValues.validUserToken,
    });
    expectToNotBeOk(ret);
    expectErrorCodeToBe(ret, 'SERVER_ERROR');
  });
});
