import "@tests/helpers/loadEnvFile";
import { mockModules } from "@tests/helpers/mockModules";
mockModules();

import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { Express } from "express";

import { initServer, stopServer } from "@src/server/server";

import * as sac from "@tests/helpers/setupAndCleanup";

import {
  addNPhotos,
  addPhoto,
  testPhotoOriginal,
  testPhotoCompressed,
  testPhotoThumbnail,
  testPhotoData,
  deletePhotoFromDisk,
  getPhotoFromDb,
  testPhotosExistInDbAndDisk,
  testPhotoNotInDbNorDisk,
  getUserId,
} from "@tests/helpers/functions";
import * as dbFunction from "@src/db/sequelizeDb";
import { pathExists } from "@src/modules/diskManager";

import {
  AddWarningPhotosDeleted,
  checkPhotoExistsAndDeleteMissing,
} from "@src/modules/functions";
import {
  GetLastWarningForUser,
  HasWarningForUser,
} from "@src/modules/warningsManager";
import { PhotoTypes } from "@src/api/export/exportedTypes";

describe("Test 'checkPhotoExistsAndDeleteMissing' function", () => {
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

  it("Should return true if photo exists in db and disk", async () => {
    const addedPhotoData = await addPhoto(app);

    const ret = await checkPhotoExistsAndDeleteMissing({
      id: addedPhotoData.id,
    });

    expect(ret.exists).toBe(true);
    expect(ret.warning).toBe(false);

    const dbPhoto = await getPhotoFromDb(addedPhotoData.id);
    await testPhotosExistInDbAndDisk(dbPhoto);
  });

  it("Should return false if photo does not exist in db nor disk", async () => {
    const ret = await checkPhotoExistsAndDeleteMissing({
      id: "id",
    });

    expect(ret.exists).toBe(false);
    expect(ret.warning).toBe(false);
  });

  const testDataArray: Array<{ photoType: PhotoTypes }> = [
    { photoType: "thumbnail" },
    { photoType: "compressed" },
    { photoType: "original" },
  ];
  it.each(testDataArray)(
    "Should return false if photo exists in db but $photoType is missing from disk, delete other photo variations while keeping original, and return the photo deleted.",
    async (testData) => {
      const addedPhotoData = await addPhoto(app);

      const dbPhoto = await getPhotoFromDb(addedPhotoData.id);
      await deletePhotoFromDisk(dbPhoto, testData.photoType);

      const ret = await checkPhotoExistsAndDeleteMissing({
        id: addedPhotoData.id,
      });

      expect(ret.exists).toBe(false);
      expect(ret.deleted).toEqual(dbPhoto);
      expect(ret.warning).toBe(true);

      const photoExistsInDb = await dbFunction.getPhotoByIdFromDB(dbPhoto.id);

      expect(photoExistsInDb).toBeFalsy();

      const originalExists = await pathExists(dbPhoto.serverPath);
      const compressedExists = await pathExists(dbPhoto.serverCompressedPath);
      const thumbnailExists = await pathExists(dbPhoto.serverThumbnailPath);

      expect(originalExists).toBe(testData.photoType != "original");
      expect(compressedExists).toBe(false);
      expect(thumbnailExists).toBe(false);
    }
  );
});

describe('Test "SaveWarningPhotosDeleted" function', () => {
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

  it("Should generate a warning when deleting a photo in db but not on disk", async () => {
    const addedPhotoData = await addPhoto(app);

    const dbPhoto = await getPhotoFromDb(addedPhotoData.id);
    await deletePhotoFromDisk(dbPhoto, "compressed");

    const ret = await checkPhotoExistsAndDeleteMissing({
      id: addedPhotoData.id,
    });

    const warningThrown = ret.warning;

    if (warningThrown) {
      AddWarningPhotosDeleted(ret.deleted ? [ret.deleted] : [], getUserId());
    }

    expect(warningThrown).toBe(true);
    expect(HasWarningForUser(getUserId())).toBe(true);

    const warning = GetLastWarningForUser(getUserId());
    expect(warning).toBeTruthy();

    if (!warning) {
      throw new Error("warning should be defined");
    }

    expect(warning.code).toBe("PHOTOS_NOT_ON_DISK_DELETED");
    expect(warning.data).toHaveProperty("photosDeleted");
    expect(warning.data.photosDeleted.length).toBe(1);

    expect(warning.data.photosDeleted[0].id).toBe(dbPhoto.id);
  });
});
