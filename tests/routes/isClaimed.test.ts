import '@tests/helpers/loadEnvFile';
import { mockModules } from '@tests/helpers/mockModules';
mockModules();

import { describe, expect, it } from '@jest/globals';

import { Express } from 'express';
import { IsClaimed } from '@src/api/export';

import { initServer, stopServer } from '@src/server/server';
import * as sac from '@tests/helpers/setupAndCleanup';

import {
  expectToBeOk,
  getDataFromRet,
  setupServerClaimed,
  setupServerClaimedLocally,
  setupServerLocalUserToken,
  setupServerUserToken,
} from '@tests/helpers/functions';

describe("Test 'isClaimed' endpoint", () => {
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

  it('Should return claimed None when server is not claimed', async () => {
    const ret = await IsClaimed.Post();

    expectToBeOk(ret);
    expect(ret.warning).toBe(false);

    const data = getDataFromRet(ret);

    expect(data.claimed).toBe('None');
  });

  it('Should return claimed Remotly when server is claimed remotly', async () => {
    await setupServerClaimed();
    const ret = await IsClaimed.Post();

    expectToBeOk(ret);
    expect(ret.warning).toBe(false);

    const data = getDataFromRet(ret);

    expect(data.claimed).toBe('Remotely');
  });

  it('Should return claimed Locally when server is claimed locally', async () => {
    await setupServerClaimedLocally();
    const ret = await IsClaimed.Post();

    expectToBeOk(ret);
    expect(ret.warning).toBe(false);

    const data = getDataFromRet(ret);

    expect(data.claimed).toBe('Locally');
  });
});
