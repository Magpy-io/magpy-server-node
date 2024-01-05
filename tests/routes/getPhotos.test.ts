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
} from "@tests/helpers/functions";
import { serverTokenHeader } from "@tests/helpers/functions";
import { PhotoTypes } from "@src/types/photoType";

describe("Test 'getPhotos' endpoint", () => {
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
    "Should return number = $n after adding $n photos",
    async (p: { n: number }) => {
      await addNPhotos(app, p.n);

      const ret = await request(app)
        .post("/getPhotos")
        .set(serverTokenHeader())
        .send({
          number: 10,
          offset: 0,
          photoType: "data",
        });

      expect(ret.statusCode).toBe(200);
      expect(ret.body.ok).toBe(true);
      expect(ret.body).toHaveProperty("data");
      expect(ret.body.data.number).toBe(p.n);
      expect(ret.body.data.endReached).toBe(true);
      expect(ret.body.data.photos.length).toBe(p.n);
    }
  );

  it.each([
    { n: 0, r: 0, endReached: false },
    { n: 1, r: 1, endReached: false },
    { n: 2, r: 2, endReached: true },
    { n: 3, r: 2, endReached: true },
  ])(
    "Should return endReached=$endReached and number=$r after adding 2 photos and asking for $n",
    async (p: { n: number; r: number; endReached: boolean }) => {
      await addNPhotos(app, 2);

      const ret = await request(app)
        .post("/getPhotos")
        .set(serverTokenHeader())
        .send({
          number: p.n,
          offset: 0,
          photoType: "data",
        });

      expect(ret.statusCode).toBe(200);
      expect(ret.body.ok).toBe(true);
      expect(ret.body).toHaveProperty("data");
      expect(ret.body.data.number).toBe(p.r);
      expect(ret.body.data.endReached).toBe(p.endReached);
    }
  );

  it("Should return endReached=true and number=1 after adding 2 photos and asking for 1 with offset=1", async () => {
    await addNPhotos(app, 2);

    const ret = await request(app)
      .post("/getPhotos")
      .set(serverTokenHeader())
      .send({
        number: 1,
        offset: 1,
        photoType: "data",
      });

    expect(ret.statusCode).toBe(200);
    expect(ret.body.ok).toBe(true);
    expect(ret.body).toHaveProperty("data");
    expect(ret.body.data.number).toBe(1);
    expect(ret.body.data.endReached).toBe(true);
  });

  it.each([
    { photoType: "original", testFunction: testPhotoOriginal },
    { photoType: "compressed", testFunction: testPhotoCompressed },
    { photoType: "thumbnail", testFunction: testPhotoThumbnail },
    { photoType: "data", testFunction: testPhotoData },
  ])(
    "Should return the image added in the quality $photoType",
    async (testData) => {
      const photoAddedData = await addPhoto(app);

      const ret = await request(app)
        .post("/getPhotos")
        .set(serverTokenHeader())
        .send({
          number: 1,
          offset: 0,
          photoType: testData.photoType,
        });

      expect(ret.statusCode).toBe(200);
      expect(ret.body.ok).toBe(true);
      expect(ret.body).toHaveProperty("data");
      expect(ret.body.data.number).toBe(1);
      expect(ret.body.data.photos.length).toBe(1);
      expect(ret.body.data.endReached).toBe(true);
      testData.testFunction(ret.body.data.photos[0], {
        path: photoAddedData.path,
        id: photoAddedData.id,
      });
    }
  );

  it.each([
    { photoType: "thumbnail" },
    { photoType: "compressed" },
    { photoType: "original" },
  ] as Array<{ photoType: PhotoTypes }>)(
    "Should return no photos if a photo exists on db but its $photoType is not on disk",
    async (testData: { photoType: PhotoTypes }) => {
      const addedPhotoData = await addPhoto(app);

      const photo = await getPhotoFromDb(addedPhotoData.id);
      await deletePhotoFromDisk(photo, testData.photoType);

      const ret = await request(app)
        .post("/getPhotos")
        .set(serverTokenHeader())
        .send({
          number: 1,
          offset: 0,
          photoType: "data",
        });

      expect(ret.statusCode).toBe(200);
      expect(ret.body.ok).toBe(true);
      expect(ret.body).toHaveProperty("data");
      expect(ret.body.data.number).toBe(0);
      expect(ret.body.data.endReached).toBe(true);
    }
  );
});
