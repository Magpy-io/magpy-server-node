import '@tests/helpers/loadEnvFile';
import { mockModules } from '@tests/helpers/mockModules';
mockModules();

import { describe, expect, it } from '@jest/globals';
import { UpdatePhotoMediaId } from '@src/api/export';
import { countDevicesInDB } from '@src/db/sequelizeDb';
import { initServer, stopServer } from '@src/server/server';
import {
  addPhoto,
  defaultPhoto,
  defaultPhotoSecondMediaId,
  deletePhotoFromDisk,
  expectErrorCodeToBe,
  expectToBeOk,
  expectToNotBeOk,
  generateId,
  getPhotoById,
  getPhotoFromDb,
  testPhotoMetaAndId,
  testPhotoMetaAndIdWithAdditionalMediaIds,
  testWarning,
} from '@tests/helpers/functions';
import * as sac from '@tests/helpers/setupAndCleanup';
import { Express } from 'express';

describe("Test 'updatePhotoMediaId' endpoint", () => {
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

  it('Should change the mediaId of an existing photo', async () => {
    const addedPhotoData = await addPhoto();

    const ret = await UpdatePhotoMediaId.Post({
      id: addedPhotoData.id,
      mediaId: 'newMediaId',
      deviceUniqueId: defaultPhoto.deviceUniqueId,
    });

    expectToBeOk(ret);
    expect(ret.warning).toBe(false);

    const photo = await getPhotoById(addedPhotoData.id);

    if (!photo) {
      throw new Error();
    }

    testPhotoMetaAndId(photo, { mediaId: 'newMediaId' });
  });

  it('Should return error ID_NOT_FOUND when request id not in db', async () => {
    const ret = await UpdatePhotoMediaId.Post({
      id: generateId(),
      mediaId: 'newMediaId',
      deviceUniqueId: defaultPhoto.deviceUniqueId,
    });

    expectToNotBeOk(ret);
    expectErrorCodeToBe(ret, 'ID_NOT_FOUND');
  });

  it('Should return ok when id is in db but compressed photo is missing from disk', async () => {
    const addedPhotoData = await addPhoto();

    const photo = await getPhotoFromDb(addedPhotoData.id);
    await deletePhotoFromDisk(photo, 'compressed');

    const ret = await UpdatePhotoMediaId.Post({
      id: addedPhotoData.id,
      mediaId: 'newMediaId',
      deviceUniqueId: defaultPhoto.deviceUniqueId,
    });

    expectToBeOk(ret);
    expect(ret.warning).toBe(false);

    const photoServer = await getPhotoById(addedPhotoData.id);

    if (!photoServer) {
      throw new Error();
    }

    testPhotoMetaAndId(photoServer, { mediaId: 'newMediaId' });
  });

  it('Should change the mediaId of an existing photo if new mediaId is for new device', async () => {
    const addedPhotoData = await addPhoto();

    const ret = await UpdatePhotoMediaId.Post({
      id: addedPhotoData.id,
      mediaId: defaultPhotoSecondMediaId.mediaId,
      deviceUniqueId: defaultPhotoSecondMediaId.deviceUniqueId,
    });

    expectToBeOk(ret);

    const photo = await getPhotoById(addedPhotoData.id);

    if (!photo) {
      throw new Error();
    }

    testPhotoMetaAndIdWithAdditionalMediaIds(photo, [defaultPhotoSecondMediaId]);
  });

  it('Should change the mediaId of an existing photo and not create a new device if the device exists already', async () => {
    expect(await countDevicesInDB()).toBe(0);

    const addedPhotoData = await addPhoto();

    expect(await countDevicesInDB()).toBe(1);

    await addPhoto({
      deviceUniqueId: defaultPhotoSecondMediaId.deviceUniqueId,
    });

    expect(await countDevicesInDB()).toBe(2);

    const ret = await UpdatePhotoMediaId.Post({
      id: addedPhotoData.id,
      mediaId: defaultPhotoSecondMediaId.mediaId,
      deviceUniqueId: defaultPhotoSecondMediaId.deviceUniqueId,
    });

    const photo = await getPhotoById(addedPhotoData.id);

    if (!photo) {
      throw new Error();
    }
    expect(await countDevicesInDB()).toBe(2);
    testPhotoMetaAndIdWithAdditionalMediaIds(photo, [defaultPhotoSecondMediaId]);
  });
});
