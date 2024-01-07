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
  getPhotoFromDb,
  deletePhotoFromDisk,
  testWarning,
} from "@tests/helpers/functions";
import { serverTokenHeader } from "@tests/helpers/functions";
import { PhotoTypes } from "@src/types/photoType";

describe("Test 'getPhotosByPath' endpoint", () => {
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
    "Should return $n photos all existing after adding $n photos and requesting $n photo paths",
    async (testData: { n: number }) => {
      const addedPhotosData = await addNPhotos(app, testData.n);

      const photosAdded = await Promise.all(
        addedPhotosData.map((photoData) => {
          return getPhotoFromDb(photoData.id);
        })
      );
      const photosData = photosAdded.map((photo) => {
        return {
          path: photo.clientPath,
          size: photo.fileSize,
          date: photo.date,
        };
      });

      const ret = await request(app)
        .post("/getPhotosByPath")
        .set(serverTokenHeader())
        .send({
          photosData: photosData,
          photoType: "data",
        });

      expect(ret.statusCode).toBe(200);
      expect(ret.body.ok).toBe(true);
      expect(ret.body.warning).toBe(false);
      expect(ret.body).toHaveProperty("data");
      expect(ret.body.data.number).toBe(testData.n);
      expect(ret.body.data.photos.length).toBe(testData.n);

      for (let i = 0; i < testData.n; i++) {
        expect(ret.body.data.photos[i].path).toBe(photosData[i].path);
        expect(ret.body.data.photos[i].exists).toBe(true);
      }
    }
  );

  it.each([{ n: 0 }, { n: 1 }, { n: 2 }])(
    "Should return $n photos all not existing after adding no photos and requesting $n photo paths",
    async (testData: { n: number }) => {
      const photosData = Array(testData.n)
        .fill("")
        .map((_, i) => {
          return { path: "path" + i.toString(), size: 0, date: "" };
        });

      const ret = await request(app)
        .post("/getPhotosByPath")
        .set(serverTokenHeader())
        .send({
          photosData: photosData,
          photoType: "data",
        });

      expect(ret.statusCode).toBe(200);
      expect(ret.body.ok).toBe(true);
      expect(ret.body).toHaveProperty("data");
      expect(ret.body.data.number).toBe(testData.n);
      expect(ret.body.data.photos.length).toBe(testData.n);

      for (let i = 0; i < testData.n; i++) {
        expect(ret.body.data.photos[i].path).toBe(photosData[i].path);
        expect(ret.body.data.photos[i].exists).toBe(false);
      }
    }
  );

  it("Should return 2 photos, the first exists and the second does not, after adding 1 photo and requesting 2", async () => {
    const photoAddedData = await addPhoto(app);

    const dbPhoto = await getPhotoFromDb(photoAddedData.id);

    const photosData = [
      { path: photoAddedData.path, size: dbPhoto.fileSize, date: dbPhoto.date },
      { path: "path2", size: 0, date: "" },
    ];

    const ret = await request(app)
      .post("/getPhotosByPath")
      .set(serverTokenHeader())
      .send({
        photosData: photosData,
        photoType: "data",
      });

    expect(ret.statusCode).toBe(200);
    expect(ret.body.ok).toBe(true);
    expect(ret.body).toHaveProperty("data");
    expect(ret.body.data.number).toBe(2);
    expect(ret.body.data.photos.length).toBe(2);

    expect(ret.body.data.photos[0].path).toBe(photosData[0].path);
    expect(ret.body.data.photos[0].exists).toBe(true);

    expect(ret.body.data.photos[1].path).toBe(photosData[1].path);
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

      const dbPhoto = await getPhotoFromDb(photoAddedData.id);

      const photosData = [
        {
          path: photoAddedData.path,
          size: dbPhoto.fileSize,
          date: dbPhoto.date,
        },
      ];

      const ret = await request(app)
        .post("/getPhotosByPath")
        .set(serverTokenHeader())
        .send({
          photosData: photosData,
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

  const testDataArray: Array<{ photoType: PhotoTypes }> = [
    { photoType: "thumbnail" },
    { photoType: "compressed" },
    { photoType: "original" },
  ];

  it.each(testDataArray)(
    "Should return photo does not exist if a photo exists on db but its $photoType is not on disk",
    async (testData: { photoType: PhotoTypes }) => {
      const addedPhotoData = await addPhoto(app);

      const photo = await getPhotoFromDb(addedPhotoData.id);

      await deletePhotoFromDisk(photo, testData.photoType);

      const photosData = [
        {
          path: addedPhotoData.path,
          size: photo.fileSize,
          date: photo.date,
        },
      ];

      const ret = await request(app)
        .post("/getPhotosByPath")
        .set(serverTokenHeader())
        .send({
          photosData: photosData,
          photoType: "data",
        });

      expect(ret.statusCode).toBe(200);
      expect(ret.body.ok).toBe(true);
      expect(ret.body.warning).toBe(true);
      expect(ret.body).toHaveProperty("data");
      expect(ret.body.data.number).toBe(1);
      expect(ret.body.data.photos.length).toBe(1);

      expect(ret.body.data.photos[0].path).toBe(addedPhotoData.path);
      expect(ret.body.data.photos[0].exists).toBe(false);

      testWarning(photo);
    }
  );
});
