import "@tests/helpers/loadEnvFile";
import { mockModules } from "@tests/helpers/mockModules";
mockModules();

import { describe, expect, it } from "@jest/globals";

import { Express } from "express";
import * as exportedTypes from "@src/api/export/exportedTypes";

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

  it("Should add 1 photo when called", async () => {
    const ret = await exportedTypes.AddPhotoPost(defaultPhoto);

    expectToBeOk(ret);
    expect(ret.warning).toBe(false);

    const data = getDataFromRet(ret);
    testPhotoMetaAndId(data.photo);
    await testPhotosExistInDbAndDisk(data.photo);

    const getPhoto = await getPhotoById(data.photo.id, "original");
    expect(getPhoto).toBeTruthy();
    testPhotoOriginal(getPhoto, { id: data.photo.id });
  });
});
