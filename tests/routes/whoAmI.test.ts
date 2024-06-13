import '@tests/helpers/loadEnvFile';
import { mockModules } from '@tests/helpers/mockModules';
mockModules();

import { describe, expect, it } from '@jest/globals';

import { Express } from 'express';
import { WhoAmI } from '@src/api/export';

import { initServer, stopServer } from '@src/server/server';
import * as sac from '@tests/helpers/setupAndCleanup';

import * as mockValues from '@src/modules/BackendQueries/__mocks__/mockValues';
import { expectToBeOk, getDataFromRet, setupServerClaimed, setupServerClaimedLocally, setupServerLocalUserToken, setupServerUserToken } from '@tests/helpers/functions';

describe("Test 'whoAmI' endpoint", () => {
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

  it('Should ok if valid user token and server claimed remotly', async () => {
    await setupServerClaimed();
    await setupServerUserToken()
    const ret = await WhoAmI.Post();

    expectToBeOk(ret);
    expect(ret.warning).toBe(false);

    const data = getDataFromRet(ret);

    expect(data.user.id).toBeDefined()
  });

  it('Should ok if valid user token and server claimed locally', async () => {
    await setupServerClaimedLocally();
    await setupServerLocalUserToken()
    const ret = await WhoAmI.Post();

    expectToBeOk(ret);
    expect(ret.warning).toBe(false);

    const data = getDataFromRet(ret);

    expect(data.user.id).toBeDefined()
  });
});
