import '@tests/helpers/loadEnvFile';
import { mockModules } from '@tests/helpers/mockModules';
mockModules();

import { describe, expect, it } from '@jest/globals';
import { GetPhotosById } from '@src/api/export';
import { PhotoTypes } from '@src/api/export/Types';
import { initServer, stopServer } from '@src/server/server';
import {
  addNPhotos,
  addPhoto,
  addPhotoWithMultipleMediaIds,
  defaultPhotoSecondMediaId,
  deletePhotoFromDisk,
  expectToBeOk,
  generateId,
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

describe("Test 'getPhotosById' endpoint", () => {
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
    'Should return $n photos all existing after adding $n photos and requesting $n photo ids',
    async testData => {
      const addedPhotosData = await addNPhotos(testData.n);

      const ids = addedPhotosData.map(e => e.id);

      const ret = await GetPhotosById.Post({
        ids: ids,
        photoType: 'data',
      });

      expectToBeOk(ret);
      expect(ret.warning).toBe(false);
      const data = getDataFromRet(ret);

      expect(data.number).toBe(testData.n);
      expect(data.photos.length).toBe(testData.n);

      for (let i = 0; i < testData.n; i++) {
        expect(data.photos[i].id).toBe(ids[i]);
        expect(data.photos[i].exists).toBe(true);
      }
    },
  );

  it.each([{ n: 0 }, { n: 1 }, { n: 2 }])(
    'Should return $n photos all not existing after adding no photos and requesting $n photo ids',
    async testData => {
      const ids = Array(testData.n)
        .fill('')
        .map(() => generateId());

      const ret = await GetPhotosById.Post({
        ids: ids,
        photoType: 'data',
      });

      expectToBeOk(ret);
      const data = getDataFromRet(ret);

      expect(data.number).toBe(testData.n);
      expect(data.photos.length).toBe(testData.n);

      for (let i = 0; i < testData.n; i++) {
        expect(data.photos[i].id).toBe(ids[i]);
        expect(data.photos[i].exists).toBe(false);
      }
    },
  );

  it('Should return 2 photos, the first exists and the second does not, after adding 1 photo and requesting 2', async () => {
    const photoAddedData = await addPhoto();

    const ids = [photoAddedData.id, generateId()];

    const ret = await GetPhotosById.Post({
      ids: ids,
      photoType: 'data',
    });

    expectToBeOk(ret);
    const data = getDataFromRet(ret);

    expect(data.number).toBe(2);
    expect(data.photos.length).toBe(2);

    expect(data.photos[0].id).toBe(ids[0]);
    expect(data.photos[0].exists).toBe(true);

    expect(data.photos[1].id).toBe(ids[1]);
    expect(data.photos[1].exists).toBe(false);
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

      const ret = await GetPhotosById.Post({
        ids: [photoAddedData.id],
        photoType: testData.photoType,
      });

      expectToBeOk(ret);
      const data = getDataFromRet(ret);

      expect(data.number).toBe(1);
      expect(data.photos.length).toBe(1);

      expect(data.photos[0].id).toBe(photoAddedData.id);
      expect(data.photos[0].exists).toBe(true);

      if (!data.photos[0].exists) {
        throw new Error();
      }

      testData.testFunction(data.photos[0].photo, {
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
    'Should return image64 empty and a warning if a photo exists on db but its $photoType is not on disk',
    async testData => {
      const addedPhotoData = await addPhoto();

      const photo = await getPhotoFromDb(addedPhotoData.id);
      await deletePhotoFromDisk(photo, testData.photoType);

      const ret = await GetPhotosById.Post({
        ids: [addedPhotoData.id],
        photoType: testData.photoType,
      });

      expectToBeOk(ret);
      expect(ret.warning).toBe(true);
      const data = getDataFromRet(ret);

      expect(data.number).toBe(1);
      expect(data.photos.length).toBe(1);

      expect(data.photos[0].id).toBe(addedPhotoData.id);
      expect(data.photos[0].exists).toBe(true);

      if (!data.photos[0].exists) {
        throw new Error('Photo should exist');
      }

      testPhotoData(data.photos[0].photo);
      expect(data.photos[0].photo.image64).toBe('');

      testWarning(photo);
    },
  );

  it('Should return a photo with multiple mediaIds when requested photo has multiple mediaIds', async () => {
    const addedPhotoData = await addPhotoWithMultipleMediaIds();

    const ret = await GetPhotosById.Post({
      ids: [addedPhotoData.id],
      photoType: 'data',
    });

    expectToBeOk(ret);
    expect(ret.warning).toBe(false);
    const data = getDataFromRet(ret);

    expect(data.photos[0].exists).toBe(true);
    expect(data.photos[0].id).toBe(addedPhotoData.id);

    if (!data.photos[0].exists) {
      throw new Error();
    }

    testPhotoMetaAndIdWithAdditionalMediaIds(data.photos[0].photo, [
      defaultPhotoSecondMediaId,
    ]);
  });
});
