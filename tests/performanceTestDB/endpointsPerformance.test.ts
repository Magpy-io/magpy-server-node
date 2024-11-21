import '@tests/helpers/loadEnvFile';
import { mockModules } from '@tests/helpers/mockModules';
mockModules();

import { describe, expect, it } from '@jest/globals';
import { GetPhotos, GetPhotosById, GetPhotosByMediaId } from '@src/api/export';
import { initServer, stopServer } from '@src/server/server';
import {
  addNPhotosToDb,
  defaultPhoto,
  expectToBeOk,
  generateId,
  getDataFromRet,
} from '@tests/helpers/functions';
import * as sac from '@tests/helpers/setupAndCleanup';
import { Express } from 'express';
import { Perf } from '@tests/helpers/Perf';

describe('Test endpoints performance', () => {
  let app: Express;

  beforeAll(async () => {
    app = await initServer();
    await sac.beforeEach(app);
    await addNPhotosToDb(10000);
  });

  afterAll(async () => {
    await sac.afterEach();
    await stopServer();
  });

  it("Test 'getPhotos' endpoint performance", async () => {
    const perf = new Perf();

    perf.start();
    const ret = await GetPhotos.Post({
      number: 1000,
      offset: 9000,
      photoType: 'data',
    });

    const elapsed = perf.end();

    expectToBeOk(ret);
    expect(ret.warning).toBe(false);
    const data = getDataFromRet(ret);

    expect(data.number).toBe(1000);
    expect(data.endReached).toBe(true);
    expect(data.photos.length).toBe(1000);

    console.log('getPhotos elapsed: ', elapsed);
    expect(elapsed).toBeLessThan(200);
  });

  it("Test 'getPhotosById' endpoint performance", async () => {
    const perf = new Perf();

    const retGetPhotos = await GetPhotos.Post({
      number: 1000,
      offset: 9000,
      photoType: 'data',
    });

    if (!retGetPhotos.ok) {
      throw new Error('Expected ok response');
    }

    const ids = retGetPhotos.data.photos.map(photo => photo.id);
    ids.push(generateId());

    perf.start();
    const ret = await GetPhotosById.Post({
      ids,
      photoType: 'data',
    });

    const elapsed = perf.end();

    expectToBeOk(ret);
    expect(ret.warning).toBe(false);
    const data = getDataFromRet(ret);

    expect(data.number).toBe(1001);
    expect(data.photos.length).toBe(1001);

    const allExist = data.photos.every((entry, index) => {
      if (index == data.photos.length - 1) {
        return true;
      }
      return entry.exists;
    });
    expect(allExist).toBe(true);
    expect(data.photos[data.photos.length - 1].exists).toBe(false);

    console.log('getPhotosById elapsed: ', elapsed);
    expect(elapsed).toBeLessThan(200);
  });

  it("Test 'getPhotosByMediaId' endpoint performance", async () => {
    const perf = new Perf();

    const retGetPhotos = await GetPhotos.Post({
      number: 1000,
      offset: 9000,
      photoType: 'data',
    });

    if (!retGetPhotos.ok) {
      throw new Error('Expected ok response');
    }

    const photosData = retGetPhotos.data.photos.map(photo => {
      return { mediaId: photo.meta.mediaIds[0].mediaId };
    });
    photosData.push({ mediaId: 'newMediaIdNotExists' });

    perf.start();
    const ret = await GetPhotosByMediaId.Post({
      photosData,
      deviceUniqueId: defaultPhoto.deviceUniqueId,
      photoType: 'data',
    });

    const elapsed = perf.end();

    expectToBeOk(ret);
    expect(ret.warning).toBe(false);
    const data = getDataFromRet(ret);

    expect(data.number).toBe(1001);
    expect(data.photos.length).toBe(1001);

    const allExist = data.photos.every((entry, index) => {
      if (index == data.photos.length - 1) {
        return true;
      }
      return entry.exists;
    });
    expect(allExist).toBe(true);
    expect(data.photos[data.photos.length - 1].exists).toBe(false);

    console.log('getPhotosByMediaId elapsed: ', elapsed);
    expect(elapsed).toBeLessThan(200);
  });
});
