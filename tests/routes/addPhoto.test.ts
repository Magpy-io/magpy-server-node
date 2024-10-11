import '@tests/helpers/loadEnvFile';
import { mockModules } from '@tests/helpers/mockModules';
mockModules();

import { describe, expect, it } from '@jest/globals';

import { Express } from 'express';
import { AddPhoto, GetNumberPhotos } from '@src/api/export';

import * as sac from '@tests/helpers/setupAndCleanup';

import { initServer, stopServer } from '@src/server/server';

import {
  testPhotoMetaAndId,
  getPhotoById,
  defaultPhoto,
  testPhotosExistInDbAndDisk,
  testPhotoOriginal,
  getDataFromRet,
  expectToBeOk,
  expectToNotBeOk,
  expectErrorCodeToBe,
  addPhoto,
  deletePhotoFromDisk,
  getPhotoFromDb,
  testWarning,
} from '@tests/helpers/functions';
import { PhotoTypes } from '@src/api/Types';

describe("Test 'addPhoto' endpoint", () => {
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

  it.each([{ times: 1 }, { times: 2 }, { times: 3 }])(
    'Should add $times photos when called $times times with $times photos with different mediaIds',
    async testData => {
      for (let i = 0; i < testData.times; i++) {
        const ret = await AddPhoto.Post({
          ...defaultPhoto,
          mediaId: 'mediaId' + i,
        });

        expectToBeOk(ret);
        expect(ret.warning).toBe(false);

        const data = getDataFromRet(ret);
        testPhotoMetaAndId(data.photo, { mediaId: 'mediaId' + i });
        expect(data.photoExistsBefore).toBe(false);

        await testPhotosExistInDbAndDisk(data.photo);

        const getPhoto = await getPhotoById(data.photo.id, 'original');
        expect(getPhoto).toBeTruthy();
        testPhotoOriginal(getPhoto, {
          id: data.photo.id,
          mediaId: 'mediaId' + i,
        });
      }

      const retNumberPhotos = await GetNumberPhotos.Post();

      if (!retNumberPhotos.ok) {
        throw new Error('could not get number photos');
      }

      expect(retNumberPhotos.data.number).toBe(testData.times);
    },
  );

  it('Should add 2 photos and create 2 devices when called twice with diferent deviceUniqueIds', async () => {
    await AddPhoto.Post(defaultPhoto);

    const ret = await AddPhoto.Post({
      ...defaultPhoto,
      deviceUniqueId: 'newDeviceUniqueId',
    });

    expectToBeOk(ret);
    expect(ret.warning).toBe(false);

    const data = getDataFromRet(ret);
    testPhotoMetaAndId(data.photo, { deviceUniqueId: 'newDeviceUniqueId' });
    expect(data.photoExistsBefore).toBe(false);

    await testPhotosExistInDbAndDisk(data.photo);

    const getPhoto = await getPhotoById(data.photo.id, 'original');
    expect(getPhoto).toBeTruthy();
    testPhotoOriginal(getPhoto, {
      id: data.photo.id,
      deviceUniqueId: 'newDeviceUniqueId',
    });
  });

  it('Should return photoExistsBefore true and not add photo if tried to add same mediaId and deviceUniqueId twice', async () => {
    const ret1 = await AddPhoto.Post(defaultPhoto);

    const ret2 = await AddPhoto.Post(defaultPhoto);

    expectToBeOk(ret1);
    const data1 = getDataFromRet(ret1);
    testPhotoMetaAndId(data1.photo);
    expect(data1.photoExistsBefore).toBe(false);

    expectToBeOk(ret2);
    const data2 = getDataFromRet(ret2);
    testPhotoMetaAndId(data2.photo);
    expect(data2.photoExistsBefore).toBe(true);

    const retNumberPhotos = await GetNumberPhotos.Post();

    if (!retNumberPhotos.ok) {
      throw new Error('could not get number photos');
    }

    expect(retNumberPhotos.data.number).toBe(1);
  });

  const testDataArray: Array<{ photoType: PhotoTypes }> = [
    { photoType: 'thumbnail' },
    { photoType: 'compressed' },
    { photoType: 'original' },
  ];

  it.each(testDataArray)(
    'Should add 1 photo when called with an existing photo in db but $photoType missing on disk, and generate a warning',
    async testData => {
      const addedPhotoData = await addPhoto();

      const photo = await getPhotoFromDb(addedPhotoData.id);
      await deletePhotoFromDisk(photo, testData.photoType);

      const ret = await AddPhoto.Post({ ...defaultPhoto, name: 'imageNewName.jpg' });

      expectToBeOk(ret);

      const data = getDataFromRet(ret);
      testPhotoMetaAndId(data.photo, { name: 'imageNewName.jpg' });
      await testPhotosExistInDbAndDisk(data.photo);

      const getPhoto = await getPhotoById(data.photo.id, 'data');
      expect(getPhoto).toBeTruthy();

      if (!getPhoto) {
        throw new Error('getPhoto should not be null');
      }

      testPhotoMetaAndId(getPhoto, {
        id: data.photo.id,
        name: 'imageNewName.jpg',
      });
    },
  );
});
