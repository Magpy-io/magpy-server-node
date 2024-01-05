import "@tests/helpers/loadEnvFile";
import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { Express } from "express";

import { mockModules } from "@tests/helpers/mockModules";
mockModules();

import { volumeReset } from "@tests/helpers/mockFsVolumeManager";
import { initServer, stopServer, clearFilesWaiting } from "@src/server/server";
import { openAndInitDB } from "@src/db/sequelizeDb";
import { clearDB } from "@src/db/sequelizeDb";
import {
  addNPhotos,
  addPhoto,
  testPhotoOriginal,
  testPhotoCompressed,
  testPhotoThumbnail,
  testPhotoData,
} from "@tests/helpers/functions";
import {
  setupServerUserToken,
  serverTokenHeader,
} from "@tests/helpers/functions";

describe("Test 'getPhotosByPath' endpoint", () => {
  let app: Express;

  beforeAll(async () => {
    app = await initServer();
  });

  afterAll(async () => {
    stopServer();
  });

  beforeEach(async () => {
    await openAndInitDB();
    await volumeReset();
    await setupServerUserToken(app);
  });

  afterEach(async () => {
    await clearDB();
    await clearFilesWaiting();
  });

  it.each([{ n: 0 }, { n: 1 }, { n: 2 }])(
    "Should return $n photos all existing after adding $n photos and requesting $n photo paths",
    async (testData: { n: number }) => {
      const addedPhotosData = await addNPhotos(app, testData.n);

      const paths = addedPhotosData.map((e) => e.path);

      const ret = await request(app)
        .post("/getPhotosByPath")
        .set(serverTokenHeader())
        .send({
          paths: paths,
          photoType: "data",
        });

      expect(ret.statusCode).toBe(200);
      expect(ret.body.ok).toBe(true);
      expect(ret.body).toHaveProperty("data");
      expect(ret.body.data.number).toBe(testData.n);
      expect(ret.body.data.photos.length).toBe(testData.n);

      for (let i = 0; i < testData.n; i++) {
        expect(ret.body.data.photos[i].path).toBe(paths[i]);
        expect(ret.body.data.photos[i].exists).toBe(true);
      }
    }
  );

  it.each([{ n: 0 }, { n: 1 }, { n: 2 }])(
    "Should return $n photos all not existing after adding no photos and requesting $n photo paths",
    async (testData: { n: number }) => {
      const paths = Array(testData.n)
        .fill("")
        .map((_, i) => "path" + i.toString());

      const ret = await request(app)
        .post("/getPhotosByPath")
        .set(serverTokenHeader())
        .send({
          paths: paths,
          photoType: "data",
        });

      expect(ret.statusCode).toBe(200);
      expect(ret.body.ok).toBe(true);
      expect(ret.body).toHaveProperty("data");
      expect(ret.body.data.number).toBe(testData.n);
      expect(ret.body.data.photos.length).toBe(testData.n);

      for (let i = 0; i < testData.n; i++) {
        expect(ret.body.data.photos[i].path).toBe(paths[i]);
        expect(ret.body.data.photos[i].exists).toBe(false);
      }
    }
  );

  it("Should return 2 photos, the first exists and the second does not, after adding 1 photo and requesting 2", async () => {
    const photoAddedData = await addPhoto(app);

    const paths = [photoAddedData.path, "path2"];

    const ret = await request(app)
      .post("/getPhotosByPath")
      .set(serverTokenHeader())
      .send({
        paths: paths,
        photoType: "data",
      });

    expect(ret.statusCode).toBe(200);
    expect(ret.body.ok).toBe(true);
    expect(ret.body).toHaveProperty("data");
    expect(ret.body.data.number).toBe(2);
    expect(ret.body.data.photos.length).toBe(2);

    expect(ret.body.data.photos[0].path).toBe(paths[0]);
    expect(ret.body.data.photos[0].exists).toBe(true);

    expect(ret.body.data.photos[1].path).toBe(paths[1]);
    expect(ret.body.data.photos[1].exists).toBe(false);
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
        .post("/getPhotosByPath")
        .set(serverTokenHeader())
        .send({
          paths: [photoAddedData.path],
          photoType: testData.photoType,
        });

      expect(ret.statusCode).toBe(200);
      expect(ret.body.ok).toBe(true);
      expect(ret.body).toHaveProperty("data");
      expect(ret.body.data.number).toBe(1);
      expect(ret.body.data.photos.length).toBe(1);

      expect(ret.body.data.photos[0].path).toBe(photoAddedData.path);
      expect(ret.body.data.photos[0].exists).toBe(true);
      testData.testFunction(ret.body.data.photos[0].photo, {
        path: photoAddedData.path,
        id: photoAddedData.id,
      });
    }
  );
});
