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
} from "@tests/helpers/functions";
import * as dbFunction from "@src/db/sequelizeDb";
import { pathExists } from "@src/modules/diskManager";
import { PhotoTypes } from "@src/types/photoType";
import { checkPhotoExistsAndDeleteMissing } from "@src/modules/functions";

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

    const dbPhoto = await getPhotoFromDb(addedPhotoData.id);
    await testPhotosExistInDbAndDisk(dbPhoto);
  });

  it("Should return false if photo does not exist in db nor disk", async () => {
    const ret = await checkPhotoExistsAndDeleteMissing({
      id: "id",
    });

    expect(ret.exists).toBe(false);
  });

  const testDataArray: Array<{ photoType: PhotoTypes }> = [
    { photoType: "thumbnail" },
    { photoType: "compressed" },
    { photoType: "original" },
  ];
  it.each(testDataArray)(
    "Should return false if photo exists in db but $photoType is missing from disk, and delete other photo variations while keeping original",
    async (testData) => {
      const addedPhotoData = await addPhoto(app);

      const dbPhoto = await getPhotoFromDb(addedPhotoData.id);
      await deletePhotoFromDisk(dbPhoto, testData.photoType);

      const ret = await checkPhotoExistsAndDeleteMissing({
        id: addedPhotoData.id,
      });

      expect(ret.exists).toBe(false);

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
