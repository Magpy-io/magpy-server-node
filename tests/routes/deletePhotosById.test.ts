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
  checkPhotoExists,
  testPhotoNotInDbNorDisk,
  getPhotoFromDb,
  generateId,
  deletePhotoFromDisk,
  getDataFromRet,
  expectToBeOk,
} from "@tests/helpers/functions";
import { getAllClientPathsByImageIdFromDB } from "@src/db/sequelizeDb";

describe("Test 'deletePhotosById' endpoint", () => {
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

  it.each([{ n: 0 }, { n: 1 }, { n: 2 }])(
    "Should delete and return $n ids when removing $n ids after adding $n photos",
    async (p: { n: number }) => {
      const addedPhotosData = await addNPhotos(p.n);
      const ids = addedPhotosData.map((e) => e.id);

      const photos = await Promise.all(ids.map((id) => getPhotoFromDb(id)));

      const ret = await exportedTypes.DeletePhotosByIdPost({
        ids: ids,
      });

      expectToBeOk(ret);
      expect(ret.warning).toBe(false);
      const data = getDataFromRet(ret);

      expect(data).toHaveProperty("deletedIds");
      expect(data.deletedIds).toEqual(ids);

      for (let i = 0; i < p.n; i++) {
        const photoExists = await checkPhotoExists(ids[i]);
        expect(photoExists).toBe(false);
      }

      for (let photo of photos) {
        await testPhotoNotInDbNorDisk(photo);
      }
    }
  );

  it.each([{ n: 0 }, { n: 1 }, { n: 2 }])(
    "Should return empty ids array when deleting $n ids that does not exist",
    async (p: { n: number }) => {
      const ids = Array(p.n)
        .fill("")
        .map(() => generateId());

      const ret = await exportedTypes.DeletePhotosByIdPost({
        ids: ids,
      });

      expectToBeOk(ret);
      const data = getDataFromRet(ret);
      expect(data).toHaveProperty("deletedIds");
      expect(data.deletedIds).toEqual([]);
    }
  );

  it("Should delete and return a single id when removing 2 ids, 1 exists and the other does not", async () => {
    const addedPhotoData = await addPhoto();
    const ids = [addedPhotoData.id, generateId()];

    const ret = await exportedTypes.DeletePhotosByIdPost({
      ids: ids,
    });

    expectToBeOk(ret);
    const data = getDataFromRet(ret);
    expect(data).toHaveProperty("deletedIds");
    expect(data.deletedIds).toEqual([addedPhotoData.id]);

    const photoExists = await checkPhotoExists(addedPhotoData.id);
    expect(photoExists).toBe(false);
  });

  it("Should only delete 1 photo when adding 2 photos and asking the removal of one of them", async () => {
    const addedPhotosData = await addNPhotos(2);

    const ids = [addedPhotosData[0].id];

    const ret = await exportedTypes.DeletePhotosByIdPost({
      ids: ids,
    });
    expectToBeOk(ret);
    const data = getDataFromRet(ret);
    expect(data).toHaveProperty("deletedIds");
    expect(data.deletedIds).toEqual([addedPhotosData[0].id]);

    const photo1Exists = await checkPhotoExists(addedPhotosData[0].id);
    expect(photo1Exists).toBe(false);

    const photo2Exists = await checkPhotoExists(addedPhotosData[1].id);
    expect(photo2Exists).toBe(true);
  });

  it("Should delete and return the id of the delete photo even if the photo is not on the disk", async () => {
    const addedPhotoData = await addPhoto();
    const id = addedPhotoData.id;

    const photo = await getPhotoFromDb(id);

    await deletePhotoFromDisk(photo, "thumbnail");

    const ret = await exportedTypes.DeletePhotosByIdPost({
      ids: [id],
    });

    expectToBeOk(ret);
    const data = getDataFromRet(ret);
    expect(data).toHaveProperty("deletedIds");
    expect(data.deletedIds).toEqual([id]);

    const photoExists = await checkPhotoExists(id);
    expect(photoExists).toBe(false);

    await testPhotoNotInDbNorDisk(photo);
  });

  it("Should delete all clientPaths associated with photo when deleted", async () => {
    const addedPhotoData = await addPhoto();

    await exportedTypes.DeletePhotosByIdPost({
      ids: [addedPhotoData.id],
    });

    const clientPaths = await getAllClientPathsByImageIdFromDB(
      addedPhotoData.id
    );
    expect(clientPaths.length).toBe(0);
  });
});
