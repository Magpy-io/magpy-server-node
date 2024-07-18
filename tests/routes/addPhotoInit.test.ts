import '@tests/helpers/loadEnvFile';
import { mockModules } from '@tests/helpers/mockModules';
mockModules();

import { describe, expect, it } from '@jest/globals';

import { Express } from 'express';
import { AddPhotoInit, GetNumberPhotos } from '@src/api/export';
import { validate } from 'uuid';

import { initServer, stopServer } from '@src/server/server';

import * as sac from '@tests/helpers/setupAndCleanup';

import {
  defaultPhoto,
  waitForPhotoTransferToFinish,
  getDataFromRet,
  expectToBeOk,
  addPhoto,
  expectToNotBeOk,
  expectErrorCodeToBe,
} from '@tests/helpers/functions';
import * as imageBase64Parts from '@tests/helpers/imageBase64Parts';
import FilesWaiting from '@src/modules/waitingFiles';

describe("Test 'addPhotoInit' endpoint", () => {
  let app: Express;

  beforeAll(async () => {
    app = await initServer();
  });

  afterAll(async () => {
    stopServer();
  });

  beforeEach(async () => {
    await sac.beforeEach(app);
  });

  afterEach(async () => {
    await sac.afterEach();
  });

  it('Should return the id of the photo being added', async () => {
    const { image64: _, ...photo } = defaultPhoto;
    const requestPhoto = { ...photo, image64Len: imageBase64Parts.photoLen };

    const ret = await AddPhotoInit.Post(requestPhoto);

    expectToBeOk(ret);
    expect(ret.warning).toBe(false);

    const data = getDataFromRet(ret);

    const validId = validate(data.id);
    expect(validId).toBe(true);

    expect(FilesWaiting.size).toBe(1);

    await waitForPhotoTransferToFinish();

    expect(FilesWaiting.size).toBe(0);
  });

  it('Should return error PHOTO_EXISTS if tried to add same mediaId and deviceUniqueId twice', async () => {
    await addPhoto();

    const { image64: _, ...photo } = defaultPhoto;
    const requestPhoto = { ...photo, image64Len: imageBase64Parts.photoLen };

    const ret = await AddPhotoInit.Post(requestPhoto);

    expectToNotBeOk(ret);
    expectErrorCodeToBe(ret, 'PHOTO_EXISTS');
  });
});
