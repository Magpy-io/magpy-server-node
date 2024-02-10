import { describe, expect, it } from '@jest/globals';
import { GetPhotoPartById } from '@src/api/export';
import { PhotoTypes } from '@src/api/export/Types';
import { initServer, stopServer } from '@src/server/server';
import {
  addPhoto,
  addPhotoWithMultipleMediaIds,
  defaultPhoto,
  defaultPhotoSecondMediaId,
  deletePhotoFromDisk,
  expectErrorCodeToBe,
  expectToBeOk,
  expectToNotBeOk,
  generateId,
  getDataFromRet,
  getPhotoFromDb,
  testPhotoMetaAndId,
  testPhotoMetaAndIdWithAdditionalMediaIds,
  testWarning,
} from '@tests/helpers/functions';
import '@tests/helpers/loadEnvFile';
import { mockModules } from '@tests/helpers/mockModules';
import * as sac from '@tests/helpers/setupAndCleanup';
import { Express } from 'express';

mockModules();

describe("Test 'getPhotoPartById' endpoint", () => {
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

  it('Should return all parts of a photo and combine to match the original photo added', async () => {
    const addedPhotoData = await addPhoto();

    const ret = await GetPhotoPartById.Post({
      id: addedPhotoData.id,
      part: 0,
    });

    expectToBeOk(ret);
    expect(ret.warning).toBe(false);

    const data = getDataFromRet(ret);
    expect(data.part).toBe(0);
    testPhotoMetaAndId(data.photo, { id: addedPhotoData.id });

    const totalNumberOfParts = data.totalNbOfParts;
    const parts = [];
    parts.push(data.photo.image64);

    for (let i = 1; i < totalNumberOfParts; i++) {
      const reti = await GetPhotoPartById.Post({
        id: addedPhotoData.id,
        part: i,
      });

      expectToBeOk(reti);
      const datai = getDataFromRet(reti);
      expect(datai.part).toBe(i);
      testPhotoMetaAndId(datai.photo, { id: addedPhotoData.id });
      parts.push(datai.photo.image64);
    }

    const partsCombined = parts.reduce((a, b) => a + b);

    expect(partsCombined).toBe(defaultPhoto.image64);
  });

  it('Should return ID_NOT_FOUND error if requesting a photo that does not exist', async () => {
    const ret = await GetPhotoPartById.Post({
      id: generateId(),
      part: 0,
    });

    expectToNotBeOk(ret);
    expectErrorCodeToBe(ret, 'ID_NOT_FOUND');
  });

  it.each([{ n: -1 }, { n: 1000 }])(
    'Should return INVALID_PART_NUMBER error if requesting a part number out of range ($n)',
    async testParameter => {
      const addedPhotoData = await addPhoto();

      const ret = await GetPhotoPartById.Post({
        id: addedPhotoData.id,
        part: testParameter.n,
      });

      expectToNotBeOk(ret);
      expectErrorCodeToBe(ret, 'INVALID_PART_NUMBER');
    },
  );

  const testDataArray: Array<{ photoType: PhotoTypes }> = [
    { photoType: 'thumbnail' },
    { photoType: 'compressed' },
    { photoType: 'original' },
  ];

  it.each(testDataArray)(
    'Should return ID_NOT_FOUND error and generate a warning if requesting a photo that exists in db but $photoType is not on disk',
    async (testData: { photoType: PhotoTypes }) => {
      const addedPhotoData = await addPhoto();

      const photo = await getPhotoFromDb(addedPhotoData.id);
      await deletePhotoFromDisk(photo, testData.photoType);

      const ret = await GetPhotoPartById.Post({
        id: addedPhotoData.id,
        part: 0,
      });

      expectToNotBeOk(ret);
      expectErrorCodeToBe(ret, 'ID_NOT_FOUND');
      expect(ret.warning).toBe(true);

      testWarning(photo);
    },
  );

  it('Should return a photo with multiple media ids when requested photo has multiple mediaIds', async () => {
    const addedPhotoData = await addPhotoWithMultipleMediaIds();

    const ret = await GetPhotoPartById.Post({
      id: addedPhotoData.id,
      part: 0,
    });

    expectToBeOk(ret);
    expect(ret.warning).toBe(false);
    const data = getDataFromRet(ret);

    testPhotoMetaAndIdWithAdditionalMediaIds(data.photo, [defaultPhotoSecondMediaId]);
  });
});
