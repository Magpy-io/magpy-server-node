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
  defaultPhotoSecondPath,
  deletePhotoFromDisk,
  expectErrorCodeToBe,
  expectToBeOk,
  expectToNotBeOk,
  getPhotoById,
  getPhotoFromDb,
  testPhotoMetaAndId,
  testPhotoMetaAndIdWithAdditionalPaths,
  testWarning,
} from "@tests/helpers/functions";
import { countDevicesInDB } from "@src/db/sequelizeDb";

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

  it("Should change the path of an existing photo", async () => {
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

  it("Should change the path of an existing photo if new path is for new device", async () => {
    const addedPhotoData = await addPhoto();

    const ret = await exportedTypes.UpdatePhotoPathPost({
      id: addedPhotoData.id,
      path: defaultPhotoSecondPath.path,
      deviceUniqueId: defaultPhotoSecondPath.deviceUniqueId,
    });

    expectToBeOk(ret);

    const photo = await getPhotoById(addedPhotoData.id);

    if (!photo) {
      throw new Error();
    }

    testPhotoMetaAndIdWithAdditionalPaths(photo, [defaultPhotoSecondPath]);
  });

  it("Should change the path of an existing photo and not create a new device if the device exists already", async () => {
    expect(await countDevicesInDB()).toBe(0);

    const addedPhotoData = await addPhoto();

    expect(await countDevicesInDB()).toBe(1);

    await addPhoto({
      deviceUniqueId: defaultPhotoSecondPath.deviceUniqueId,
    });

    expect(await countDevicesInDB()).toBe(2);

    const ret = await exportedTypes.UpdatePhotoPathPost({
      id: addedPhotoData.id,
      path: defaultPhotoSecondPath.path,
      deviceUniqueId: defaultPhotoSecondPath.deviceUniqueId,
    });

    const photo = await getPhotoById(addedPhotoData.id);

    if (!photo) {
      throw new Error();
    }
    expect(await countDevicesInDB()).toBe(2);
    testPhotoMetaAndIdWithAdditionalPaths(photo, [defaultPhotoSecondPath]);
  });
});
