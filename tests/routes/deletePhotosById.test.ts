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
  checkPhotoExists,
  testPhotoNotInDbNorDisk,
  getPhotoFromDb,
  deletePhotoFromDisk,
} from "@tests/helpers/functions";
import { serverTokenHeader } from "@tests/helpers/functions";

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
      const addedPhotosData = await addNPhotos(app, p.n);
      const ids = addedPhotosData.map((e) => e.id);

      const photos = await Promise.all(ids.map((id) => getPhotoFromDb(id)));

      const ret = await request(app)
        .post("/deletePhotosById")
        .set(serverTokenHeader())
        .send({
          ids: ids,
        });

      expect(ret.statusCode).toBe(200);
      expect(ret.body.ok).toBe(true);
      expect(ret.body.warning).toBe(false);
      expect(ret.body).toHaveProperty("data");
      expect(ret.body.data).toHaveProperty("deletedIds");
      expect(ret.body.data.deletedIds).toEqual(ids);

      for (let i = 0; i < p.n; i++) {
        const photoExists = await checkPhotoExists(app, ids[i]);
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
        .map((_, i) => "id" + i.toString());

      const ret = await request(app)
        .post("/deletePhotosById")
        .set(serverTokenHeader())
        .send({
          ids: ids,
        });

      expect(ret.statusCode).toBe(200);
      expect(ret.body.ok).toBe(true);
      expect(ret.body).toHaveProperty("data");
      expect(ret.body.data).toHaveProperty("deletedIds");
      expect(ret.body.data.deletedIds).toEqual([]);
    }
  );

  it("Should delete and return a single id when removing 2 ids, 1 exists and the other does not", async () => {
    const addedPhotoData = await addPhoto(app);
    const ids = [addedPhotoData.id, "id2"];

    const ret = await request(app)
      .post("/deletePhotosById")
      .set(serverTokenHeader())
      .send({
        ids: ids,
      });

    expect(ret.statusCode).toBe(200);
    expect(ret.body.ok).toBe(true);
    expect(ret.body).toHaveProperty("data");
    expect(ret.body.data).toHaveProperty("deletedIds");
    expect(ret.body.data.deletedIds).toEqual([addedPhotoData.id]);

    const photoExists = await checkPhotoExists(app, addedPhotoData.id);
    expect(photoExists).toBe(false);
  });

  it("Should only delete 1 photo when adding 2 photos and asking the removal of one of them", async () => {
    const addedPhotosData = await addNPhotos(app, 2);

    const ids = [addedPhotosData[0].id];

    const ret = await request(app)
      .post("/deletePhotosById")
      .set(serverTokenHeader())
      .send({
        ids: ids,
      });

    expect(ret.statusCode).toBe(200);
    expect(ret.body.ok).toBe(true);
    expect(ret.body).toHaveProperty("data");
    expect(ret.body.data).toHaveProperty("deletedIds");
    expect(ret.body.data.deletedIds).toEqual([addedPhotosData[0].id]);

    const photo1Exists = await checkPhotoExists(app, addedPhotosData[0].id);
    expect(photo1Exists).toBe(false);

    const photo2Exists = await checkPhotoExists(app, addedPhotosData[1].id);
    expect(photo2Exists).toBe(true);
  });

  it("Should delete and return the id of the delete photo even if the photo is not on the disk", async () => {
    const addedPhotoData = await addPhoto(app);
    const id = addedPhotoData.id;

    const photo = await getPhotoFromDb(id);

    await deletePhotoFromDisk(photo, "thumbnail");

    const ret = await request(app)
      .post("/deletePhotosById")
      .set(serverTokenHeader())
      .send({
        ids: [id],
      });

    expect(ret.statusCode).toBe(200);
    expect(ret.body.ok).toBe(true);
    expect(ret.body).toHaveProperty("data");
    expect(ret.body.data).toHaveProperty("deletedIds");
    expect(ret.body.data.deletedIds).toEqual([id]);

    const photoExists = await checkPhotoExists(app, id);
    expect(photoExists).toBe(false);

    await testPhotoNotInDbNorDisk(photo);
  });
});
