import "@tests/helpers/loadEnvFile";
import { mockModules } from "@tests/helpers/mockModules";
mockModules();

import { describe, expect, it } from "@jest/globals";

import { Express } from "express";
import { AddPhoto } from "@src/api/export/exportedTypes";

import * as sac from "@tests/helpers/setupAndCleanup";

import { initServer, stopServer } from "@src/server/server";

import {
  testPhotoMetaAndId,
  getPhotoById,
  defaultPhoto,
  testPhotosExistInDbAndDisk,
  testPhotoOriginal,
  getDataFromRet,
  expectToBeOk,
} from "@tests/helpers/functions";

describe("Test 'addPhoto' endpoint", () => {
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

  it.each([{ times: 1 }, { times: 2 }, { times: 3 }])(
    "Should add $times photos when called $times times with same photo",
    async (testData) => {
      for (let i = 0; i < testData.times; i++) {
        const ret = await AddPhoto.Post(defaultPhoto);

        expectToBeOk(ret);
        expect(ret.warning).toBe(false);

        const data = getDataFromRet(ret);
        testPhotoMetaAndId(data.photo);
        await testPhotosExistInDbAndDisk(data.photo);

        const getPhoto = await getPhotoById(data.photo.id, "original");
        expect(getPhoto).toBeTruthy();
        testPhotoOriginal(getPhoto, { id: data.photo.id });
      }
    }
  );

  it("Should add 2 photos and create 2 devices when called twice with diferent deviceUniqueIds", async () => {
    await AddPhoto.Post(defaultPhoto);

    const ret = await AddPhoto.Post({
      ...defaultPhoto,
      deviceUniqueId: "newDeviceUniqueId",
    });

    expectToBeOk(ret);
    expect(ret.warning).toBe(false);

    const data = getDataFromRet(ret);
    testPhotoMetaAndId(data.photo, { deviceUniqueId: "newDeviceUniqueId" });
    await testPhotosExistInDbAndDisk(data.photo);

    const getPhoto = await getPhotoById(data.photo.id, "original");
    expect(getPhoto).toBeTruthy();
    testPhotoOriginal(getPhoto, {
      id: data.photo.id,
      deviceUniqueId: "newDeviceUniqueId",
    });
  });
});
