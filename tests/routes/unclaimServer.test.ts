import '@tests/helpers/loadEnvFile';
import { mockModules } from '@tests/helpers/mockModules';
mockModules();

import { describe, expect, it } from '@jest/globals';

import { Express } from 'express';
import { UnclaimServer } from '@src/api/export';

import { initServer, stopServer } from '@src/server/server';

import * as sac from '@tests/helpers/setupAndCleanup';

import {
  GetServerCredentials,
  GetServerLocalClaimInfo,
  GetServerToken,
  IsServerClaimedLocal,
  IsServerClaimedRemote,
} from '@src/modules/serverDataManager';
import { expectToBeOk, setupServerClaimed, setupServerClaimedLocally } from '@tests/helpers/functions';

describe("Test 'unclaimServer' endpoint", () => {
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

  it('Should return ok if unclaiming a remotly claimed server', async () => {
    await setupServerClaimed()
    const ret = await UnclaimServer.Post();

    expectToBeOk(ret);
    expect(ret.warning).toBe(false);

    const serverCredentials = GetServerCredentials();
    const serverToken = GetServerToken();

    expect(IsServerClaimedRemote()).toBe(false);
    expect(serverCredentials?.serverId).toBeFalsy();
    expect(serverCredentials?.serverKey).toBeFalsy();
    expect(serverToken).toBeFalsy();
  });

  it('Should return ok if unclaiming a locally claimed server', async () => {
    await setupServerClaimedLocally()
    const ret = await UnclaimServer.Post();

    expectToBeOk(ret);
    expect(ret.warning).toBe(false);

    const serverCredentials = GetServerLocalClaimInfo();

    expect(IsServerClaimedLocal()).toBe(false);
    expect(serverCredentials).toBeFalsy();
  });
});
