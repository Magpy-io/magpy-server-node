import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { Express } from "express";

import { initServer, stopServer } from "@src/server/server";
import { initDB } from "@src/db/databaseFunctions";
import { clearDB } from "@src/db/databaseFunctions";
import { clearImagesDisk } from "@src/modules/diskManager";
import {
  addNPhotos,
  addPhoto,
  testPhotoOriginal,
  testPhotoCompressed,
  testPhotoThumbnail,
  testPhotoData,
} from "@tests/helpers/functions";

describe("Test 'getPhotos' endpoint", () => {
  let app: Express;

  beforeAll(async () => {
    app = await initServer();
  });

  afterAll(async () => {
    stopServer();
    await clearDB();
    await clearImagesDisk();
  });

  beforeEach(async () => {
    await initDB();
  });

  afterEach(async () => {
    await clearDB();
    await clearImagesDisk();
  });

  it.each([{ n: 0 }, { n: 1 }, { n: 2 }])(
    "Should return number = $n after adding $n photos",
    async (p: { n: number }) => {
      await addNPhotos(app, p.n);

      const ret = await request(app).post("/getPhotos").send({
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

      const ret = await request(app).post("/getPhotos").send({
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

    const ret = await request(app).post("/getPhotos").send({
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
    "Should return the 2 images added in the quality $photoType",
    async (testData) => {
      await addPhoto(app, "path1/image1.jpg");
      await addPhoto(app, "path1/image2.jpg");

      const ret = await request(app).post("/getPhotos").send({
        number: 2,
        offset: 0,
        photoType: testData.photoType,
      });

      expect(ret.statusCode).toBe(200);
      expect(ret.body.ok).toBe(true);
      expect(ret.body).toHaveProperty("data");
      expect(ret.body.data.number).toBe(2);
      expect(ret.body.data.photos.length).toBe(2);
      expect(ret.body.data.endReached).toBe(true);
      testData.testFunction(ret.body.data.photos[0], "path1/image1.jpg");
      testData.testFunction(ret.body.data.photos[1], "path1/image2.jpg");
    }
  );
});
