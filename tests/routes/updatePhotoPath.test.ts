import "@tests/helpers/loadEnvFile";
import { mockModules } from "@tests/helpers/mockModules";
mockModules();

import { describe, expect, it } from "@jest/globals";

import { Express } from "express";
import * as exportedTypes from "@src/api/export/exportedTypes";

import { initServer, stopServer } from "@src/server/server";

import * as sac from "@tests/helpers/setupAndCleanup";

import {
  addNPhotos,
  addPhoto,
  defaultPhoto,
  deletePhotoFromDisk,
  expectErrorCodeToBe,
  expectToBeOk,
  expectToNotBeOk,
  getPhotoById,
  getPhotoFromDb,
  testPhotoMetaAndId,
  testWarning,
} from "@tests/helpers/functions";

describe("Test 'updatePhotoPath' endpoint", () => {
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

  it("Should change the path of photo after adding the photo", async () => {
    const addedPhotoData = await addPhoto();

    const ret = await exportedTypes.UpdatePhotoPathPost({
      id: addedPhotoData.id,
      path: "newPath",
      deviceUniqueId: defaultPhoto.deviceUniqueId,
    });

    expectToBeOk(ret);
    expect(ret.warning).toBe(false);

    const photo = await getPhotoById(addedPhotoData.id);

    if (!photo) {
      throw new Error();
    }

    testPhotoMetaAndId(photo, { path: "newPath" });
  });

  it("Should return error ID_NOT_FOUND when request id not in db", async () => {
    const ret = await exportedTypes.UpdatePhotoPathPost({
      id: "id",
      path: "newPath",
      deviceUniqueId: defaultPhoto.deviceUniqueId,
    });

    expectToNotBeOk(ret);
    expectErrorCodeToBe(ret, "ID_NOT_FOUND");
  });

  it("Should return error ID_NOT_FOUND when id is in db but compressed photo is missing from disk", async () => {
    const addedPhotoData = await addPhoto();

    const photo = await getPhotoFromDb(addedPhotoData.id);
    await deletePhotoFromDisk(photo, "compressed");

    const ret = await exportedTypes.UpdatePhotoPathPost({
      id: addedPhotoData.id,
      path: addedPhotoData.path,
      deviceUniqueId: defaultPhoto.deviceUniqueId,
    });

    expectToNotBeOk(ret);
    expect(ret.warning).toBe(true);
    expectErrorCodeToBe(ret, "ID_NOT_FOUND");

    testWarning(photo);
  });
});
