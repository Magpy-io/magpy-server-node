import '@tests/helpers/loadEnvFile';
import { mockModules } from '@tests/helpers/mockModules';
mockModules();

import { describe, expect, it } from '@jest/globals';
import { GetPhotos } from '@src/api/export';
import { PhotoTypes } from '@src/api/export/Types';
import { initServer, stopServer } from '@src/server/server';
import {
  addNPhotos,
  addPhoto,
  addPhotoWithMultipleMediaIds,
  defaultPhotoSecondMediaId,
  deletePhotoFromDisk,
  expectToBeOk,
  getDataFromRet,
  getPhotoFromDb,
  testPhotoCompressed,
  testPhotoData,
  testPhotoMetaAndIdWithAdditionalMediaIds,
  testPhotoOriginal,
  testPhotoThumbnail,
  testWarning,
} from '@tests/helpers/functions';
import * as sac from '@tests/helpers/setupAndCleanup';
import { Express } from 'express';

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

  it.each([{ n: 0 }, { n: 1 }, { n: 2 }])(
    'Should return number = $n after adding $n photos',
    async (p: { n: number }) => {
      await addNPhotos(p.n);

      const ret = await GetPhotos.Post({
        number: p.n,
        offset: 0,
        photoType: 'data',
      });

      expectToBeOk(ret);
      expect(ret.warning).toBe(false);
      const data = getDataFromRet(ret);

      expect(data.number).toBe(p.n);
      expect(data.endReached).toBe(true);
      expect(data.photos.length).toBe(p.n);
    },
  );

  it.each([
    { n: 0, r: 0, endReached: false },
    { n: 1, r: 1, endReached: false },
    { n: 2, r: 2, endReached: true },
    { n: 3, r: 2, endReached: true },
  ])(
    'Should return endReached=$endReached and number=$r after adding 2 photos and asking for $n',
    async (p: { n: number; r: number; endReached: boolean }) => {
      await addNPhotos(2);

      const ret = await GetPhotos.Post({
        number: p.n,
        offset: 0,
        photoType: 'data',
      });

      expectToBeOk(ret);
      const data = getDataFromRet(ret);

      expect(data.number).toBe(p.r);
      expect(data.endReached).toBe(p.endReached);
    },
  );

  it('Should return endReached=true and number=1 after adding 2 photos and asking for 1 with offset=1', async () => {
    await addNPhotos(2);

    const ret = await GetPhotos.Post({
      number: 1,
      offset: 1,
      photoType: 'data',
    });

    expectToBeOk(ret);
    const data = getDataFromRet(ret);

    expect(data.number).toBe(1);
    expect(data.endReached).toBe(true);
  });

  const testDataArrayPhotoTypeTestFunction: Array<{
    photoType: PhotoTypes;
    testFunction: (...args: any[]) => any;
  }> = [
    { photoType: 'original', testFunction: testPhotoOriginal },
    { photoType: 'compressed', testFunction: testPhotoCompressed },
    { photoType: 'thumbnail', testFunction: testPhotoThumbnail },
    { photoType: 'data', testFunction: testPhotoData },
  ];

  it.each(testDataArrayPhotoTypeTestFunction)(
    'Should return the image added in the quality $photoType',
    async testData => {
      const photoAddedData = await addPhoto();

      const ret = await GetPhotos.Post({
        number: 1,
        offset: 0,
        photoType: testData.photoType,
      });

      expectToBeOk(ret);
      const data = getDataFromRet(ret);

      expect(data.number).toBe(1);
      expect(data.photos.length).toBe(1);
      expect(data.endReached).toBe(true);

      testData.testFunction(data.photos[0], {
        mediaId: photoAddedData.mediaId,
        id: photoAddedData.id,
      });
    },
  );

  const testDataArrayPhotoType: Array<{ photoType: PhotoTypes }> = [
    { photoType: 'thumbnail' },
    { photoType: 'compressed' },
    { photoType: 'original' },
  ];

  it.each(testDataArrayPhotoType)(
    'Should return empty image64 and a warning if a photo exists on db but its $photoType is not on disk',
    async (testData: { photoType: PhotoTypes }) => {
      const addedPhotoData = await addPhoto();

      const photo = await getPhotoFromDb(addedPhotoData.id);
      await deletePhotoFromDisk(photo, testData.photoType);

      const ret = await GetPhotos.Post({
        number: 1,
        offset: 0,
        photoType: testData.photoType,
      });

      expectToBeOk(ret);
      expect(ret.warning).toBe(true);
      const data = getDataFromRet(ret);

      expect(data.number).toBe(1);
      expect(data.endReached).toBe(true);

      testPhotoData(data.photos[0]);
      expect(data.photos[0].image64).toBe('');

      testWarning(photo);
    },
  );

  it('Should return a photo with multiple mediaIds when requested photo has multiple mediaIds', async () => {
    await addPhotoWithMultipleMediaIds();

    const ret = await GetPhotos.Post({
      number: 1,
      offset: 0,
      photoType: 'data',
    });

    expectToBeOk(ret);
    expect(ret.warning).toBe(false);
    const data = getDataFromRet(ret);

    expect(data.photos.length).toBe(1);

    testPhotoMetaAndIdWithAdditionalMediaIds(data.photos[0], [defaultPhotoSecondMediaId]);
  });
});
