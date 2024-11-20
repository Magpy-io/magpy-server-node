import '@tests/helpers/loadEnvFile';
import { mockModules } from '@tests/helpers/mockModules';
mockModules();

import { describe, expect, it } from '@jest/globals';
import { GetPhotos } from '@src/api/export';
import { initServer, stopServer } from '@src/server/server';
import { addNPhotosToDb, expectToBeOk, getDataFromRet } from '@tests/helpers/functions';
import * as sac from '@tests/helpers/setupAndCleanup';
import { Express } from 'express';
import { Perf } from '@tests/helpers/Perf';

describe("Test 'getPhotos' endpoint", () => {
  let app: Express;

  beforeAll(async () => {
    app = await initServer();
  });

  afterAll(async () => {
    await stopServer();
  });

  beforeEach(async () => {
    await sac.beforeEach(app);
  });

  afterEach(async () => {
    await sac.afterEach();
  });

  it('Get photos request performance', async () => {
    await addNPhotosToDb(10000);

    const perf = new Perf();

    perf.start();
    const ret = await GetPhotos.Post({
      number: 1000,
      offset: 9000,
      photoType: 'data',
    });

    const elapsed = perf.end();

    console.log(elapsed);

    expectToBeOk(ret);
    expect(ret.warning).toBe(false);
    const data = getDataFromRet(ret);

    expect(data.number).toBe(1000);
    expect(data.endReached).toBe(true);
    expect(data.photos.length).toBe(1000);
  });
});
