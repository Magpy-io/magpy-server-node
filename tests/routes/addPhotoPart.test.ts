import '@tests/helpers/loadEnvFile';
import { mockModules } from '@tests/helpers/mockModules';
mockModules();

import { describe, expect, it } from '@jest/globals';

import { Express } from 'express';
import { AddPhotoInit, AddPhotoPart, GetNumberPhotos } from '@src/api/export';

import { initServer, stopServer } from '@src/server/server';

import * as sac from '@tests/helpers/setupAndCleanup';

import {
  defaultPhoto,
  testPhotoMetaAndId,
  getPhotoById,
  waitForPhotoTransferToFinish,
  testPhotosExistInDbAndDisk,
  getDataFromRet,
  expectErrorCodeToBe,
  generateId,
  testPhotoOriginal,
  expectToBeOk,
  expectToNotBeOk,
  addPhoto,
  getPhotoFromDb,
  deletePhotoFromDisk,
} from '@tests/helpers/functions';
import * as imageBase64Parts from '@tests/helpers/imageBase64Parts';
import FilesWaiting from '@src/modules/waitingFiles';
import { PhotoTypes } from '@src/api/Types';

describe("Test 'addPhotoPart' endpoint", () => {
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

  it('Should add the photo after sending all the parts of a photo', async () => {
    const { image64: _, ...photo } = defaultPhoto;

    const requestPhoto = { ...photo, image64Len: imageBase64Parts.photoLen };

    const retInit = await AddPhotoInit.Post(requestPhoto);

    if (!retInit.ok) {
      throw 'Error starting photo transfer';
    }

    const dataInit = getDataFromRet(retInit);
    if (dataInit.photoExistsBefore) {
      throw new Error('Unexpected value.');
    }

    const id = dataInit.id;
    expect(FilesWaiting.size).toBe(1);

    let ret = await AddPhotoPart.Post({
      id: id,
      partNumber: 0,
      partSize: imageBase64Parts.photoLenPart1,
      photoPart: imageBase64Parts.photoImage64Part1,
    });

    expectToBeOk(ret);
    expect(ret.warning).toBe(false);

    let data = getDataFromRet(ret);
    expect(data.done).toBe(false);
    expect(data.lenWaiting).toBe(imageBase64Parts.photoLen);
    expect(data.lenReceived).toBe(imageBase64Parts.photoLenPart1);

    ret = await AddPhotoPart.Post({
      id: id,
      partNumber: 1,
      partSize: imageBase64Parts.photoLenPart2,
      photoPart: imageBase64Parts.photoImage64Part2,
    });

    expectToBeOk(ret);
    expect(ret.warning).toBe(false);

    data = getDataFromRet(ret);
    expect(data.done).toBe(false);
    expect(data.lenWaiting).toBe(imageBase64Parts.photoLen);
    expect(data.lenReceived).toBe(
      imageBase64Parts.photoLenPart1 + imageBase64Parts.photoLenPart2,
    );

    ret = await AddPhotoPart.Post({
      id: id,
      partNumber: 2,
      partSize: imageBase64Parts.photoLenPart3,
      photoPart: imageBase64Parts.photoImage64Part3,
    });

    expectToBeOk(ret);
    expect(ret.warning).toBe(false);

    data = getDataFromRet(ret);
    expectToBeOk(ret);
    expect(data.lenWaiting).toBe(imageBase64Parts.photoLen);
    expect(data.lenReceived).toBe(imageBase64Parts.photoLen);

    expect(data.done).toBe(true);
    if (!data.done) {
      throw new Error();
    }

    expect(data.photoExistsBefore).toBe(false);

    testPhotoMetaAndId(data.photo);
    await testPhotosExistInDbAndDisk(data.photo);

    const getPhoto = await getPhotoById(data.photo.id, 'original');
    expect(getPhoto).toBeTruthy();
    testPhotoOriginal(getPhoto, { id: data.photo.id });

    expect(FilesWaiting.size).toBe(0);
  });

  it('Should return error PHOTO_TRANSFER_NOT_FOUND if no transfer was started and sended part', async () => {
    const ret = await AddPhotoPart.Post({
      id: generateId(),
      partNumber: 0,
      partSize: imageBase64Parts.photoLenPart1,
      photoPart: imageBase64Parts.photoImage64Part1,
    });

    expectToNotBeOk(ret);
    expectErrorCodeToBe(ret, 'PHOTO_TRANSFER_NOT_FOUND');
  });

  it('Should return error PHOTO_TRANSFER_NOT_FOUND if started transfer and sended part too late', async () => {
    const { image64: _, ...photo } = defaultPhoto;

    const requestPhoto = { ...photo, image64Len: imageBase64Parts.photoLen };

    const retInit = await AddPhotoInit.Post(requestPhoto);

    if (!retInit.ok) {
      throw 'Error starting photo transfer';
    }

    expect(FilesWaiting.size).toBe(1);

    const dataInit = getDataFromRet(retInit);
    if (dataInit.photoExistsBefore) {
      throw new Error('Unexpected value.');
    }

    const id = dataInit.id;

    await waitForPhotoTransferToFinish();

    expect(FilesWaiting.size).toBe(0);

    const ret = await AddPhotoPart.Post({
      id: id,
      partNumber: 0,
      partSize: imageBase64Parts.photoLenPart1,
      photoPart: imageBase64Parts.photoImage64Part1,
    });

    expectToNotBeOk(ret);
    expectErrorCodeToBe(ret, 'PHOTO_TRANSFER_NOT_FOUND');

    const getPhoto = await getPhotoById(id, 'data');
    expect(getPhoto).toBeFalsy();
  });

  it('Should return error PHOTO_SIZE_EXCEEDED if sended more data in parts than needed', async () => {
    const { image64: _, ...photo } = defaultPhoto;

    const requestPhoto = { ...photo, image64Len: imageBase64Parts.photoLen };

    const retInit = await AddPhotoInit.Post(requestPhoto);

    if (!retInit.ok) {
      throw 'Error starting photo transfer';
    }

    expect(FilesWaiting.size).toBe(1);

    const dataInit = getDataFromRet(retInit);
    if (dataInit.photoExistsBefore) {
      throw new Error('Unexpected value.');
    }

    const id = dataInit.id;

    let ret = await AddPhotoPart.Post({
      id: id,
      partNumber: 0,
      partSize: imageBase64Parts.photoLenPart1,
      photoPart: imageBase64Parts.photoImage64Part1,
    });

    expectToBeOk(ret);

    ret = await AddPhotoPart.Post({
      id: id,
      partNumber: 1,
      partSize: imageBase64Parts.photoLenPart1,
      photoPart: imageBase64Parts.photoImage64Part1,
    });

    expectToBeOk(ret);

    ret = await AddPhotoPart.Post({
      id: id,
      partNumber: 2,
      partSize: imageBase64Parts.photoLenPart1,
      photoPart: imageBase64Parts.photoImage64Part1,
    });

    expectToNotBeOk(ret);
    expectErrorCodeToBe(ret, 'PHOTO_SIZE_EXCEEDED');

    expect(FilesWaiting.size).toBe(0);
  });

  it('Should return error BAD_REQUEST if partSize not equal to photoPart length', async () => {
    const { image64: _, ...photo } = defaultPhoto;

    const requestPhoto = { ...photo, image64Len: imageBase64Parts.photoLen };

    const retInit = await AddPhotoInit.Post(requestPhoto);

    if (!retInit.ok) {
      throw 'Error starting photo transfer';
    }

    const dataInit = getDataFromRet(retInit);
    if (dataInit.photoExistsBefore) {
      throw new Error('Unexpected value.');
    }

    const id = dataInit.id;

    const ret = await AddPhotoPart.Post({
      id: id,
      partNumber: 0,
      partSize: imageBase64Parts.photoLenPart1 + 1,
      photoPart: imageBase64Parts.photoImage64Part1,
    });

    expectToNotBeOk(ret);
    expectErrorCodeToBe(ret, 'BAD_REQUEST');
  });

  it('Should return error MISSING_PARTS if added all parts but a number is missing', async () => {
    const { image64: _, ...photo } = defaultPhoto;

    const requestPhoto = { ...photo, image64Len: imageBase64Parts.photoLen };

    const retInit = await AddPhotoInit.Post(requestPhoto);

    if (!retInit.ok) {
      throw 'Error starting photo transfer';
    }

    const dataInit = getDataFromRet(retInit);
    if (dataInit.photoExistsBefore) {
      throw new Error('Unexpected value.');
    }

    const id = dataInit.id;

    expect(FilesWaiting.size).toBe(1);

    let ret = await AddPhotoPart.Post({
      id: id,
      partNumber: 0,
      partSize: imageBase64Parts.photoLenPart1,
      photoPart: imageBase64Parts.photoImage64Part1,
    });

    expectToBeOk(ret);

    ret = await AddPhotoPart.Post({
      id: id,
      partNumber: 1,
      partSize: imageBase64Parts.photoLenPart2,
      photoPart: imageBase64Parts.photoImage64Part2,
    });

    expectToBeOk(ret);

    ret = await AddPhotoPart.Post({
      id: id,
      partNumber: 3,
      partSize: imageBase64Parts.photoLenPart3,
      photoPart: imageBase64Parts.photoImage64Part3,
    });

    expectToNotBeOk(ret);
    expectErrorCodeToBe(ret, 'MISSING_PARTS');

    const getPhoto = await getPhotoById(id, 'original');
    expect(getPhoto).toBeFalsy();

    expect(FilesWaiting.size).toBe(0);
  });

  it('Should return photoExistsBefore true and not add photo if tried to add same mediaId and deviceUniqueId twice', async () => {
    const { image64: _, ...photo } = defaultPhoto;

    const requestPhoto = { ...photo, image64Len: imageBase64Parts.photoLen };

    const retInit = await AddPhotoInit.Post(requestPhoto);

    if (!retInit.ok) {
      throw 'Error starting photo transfer';
    }

    const dataInit = getDataFromRet(retInit);

    if (dataInit.photoExistsBefore) {
      throw new Error('Unexpected value.');
    }

    const id = dataInit.id;
    expect(FilesWaiting.size).toBe(1);

    let ret = await AddPhotoPart.Post({
      id: id,
      partNumber: 0,
      partSize: imageBase64Parts.photoLenPart1,
      photoPart: imageBase64Parts.photoImage64Part1,
    });
    expectToBeOk(ret);

    ret = await AddPhotoPart.Post({
      id: id,
      partNumber: 1,
      partSize: imageBase64Parts.photoLenPart2,
      photoPart: imageBase64Parts.photoImage64Part2,
    });

    expectToBeOk(ret);

    await addPhoto();

    ret = await AddPhotoPart.Post({
      id: id,
      partNumber: 2,
      partSize: imageBase64Parts.photoLenPart3,
      photoPart: imageBase64Parts.photoImage64Part3,
    });

    expectToBeOk(ret);
    const data = getDataFromRet(ret);

    expect(data.done).toBe(true);
    if (!data.done) {
      throw new Error();
    }

    expect(data.photoExistsBefore).toBe(true);
    if (!data.photoExistsBefore) {
      throw new Error('Unexpected value.');
    }

    testPhotoMetaAndId(data.photo);

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
    'Should return photoExistsBefore true and not add photo if mediaId exists but $photoType is missing on disk',
    async testData => {
      const { image64: _, ...photo } = defaultPhoto;

      const requestPhoto = {
        ...photo,
        name: 'imageNewName.jpg',
        image64Len: imageBase64Parts.photoLen,
      };

      const retInit = await AddPhotoInit.Post(requestPhoto);

      if (!retInit.ok) {
        throw 'Error starting photo transfer';
      }

      const dataInit = getDataFromRet(retInit);
      if (dataInit.photoExistsBefore) {
        throw new Error('Unexpected value.');
      }

      const id = dataInit.id;
      expect(FilesWaiting.size).toBe(1);

      let ret = await AddPhotoPart.Post({
        id: id,
        partNumber: 0,
        partSize: imageBase64Parts.photoLenPart1,
        photoPart: imageBase64Parts.photoImage64Part1,
      });
      expectToBeOk(ret);

      ret = await AddPhotoPart.Post({
        id: id,
        partNumber: 1,
        partSize: imageBase64Parts.photoLenPart2,
        photoPart: imageBase64Parts.photoImage64Part2,
      });

      expectToBeOk(ret);

      const addedPhotoData = await addPhoto();

      const photoDb = await getPhotoFromDb(addedPhotoData.id);
      await deletePhotoFromDisk(photoDb, testData.photoType);

      ret = await AddPhotoPart.Post({
        id: id,
        partNumber: 2,
        partSize: imageBase64Parts.photoLenPart3,
        photoPart: imageBase64Parts.photoImage64Part3,
      });

      expectToBeOk(ret);

      const data = getDataFromRet(ret);
      expect(data.done).toBe(true);

      if (!data.done) {
        throw new Error('Photo transfer should be done');
      }

      expect(ret.warning).toBe(false);
      testPhotoMetaAndId(data.photo);
      expect(data.photoExistsBefore).toBe(true);

      const getPhoto = await getPhotoById(data.photo.id, 'data');
      expect(getPhoto).toBeTruthy();

      if (!getPhoto) {
        throw new Error('getPhoto should not be null');
      }

      testPhotoMetaAndId(getPhoto, {
        id: data.photo.id,
      });
    },
  );
});
