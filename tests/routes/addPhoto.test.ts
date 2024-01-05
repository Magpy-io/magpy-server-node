import "@tests/helpers/loadEnvFile";
import { mockModules } from "@tests/helpers/mockModules";
mockModules();

import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { Express } from "express";

import { initServer, stopServer } from "@src/server/server";

import * as sac from "@tests/helpers/setupAndCleanup";

import {
  testPhotoMetaAndId,
  getPhotoById,
  getNumberPhotos,
  defaultPhoto,
  testPhotosExistInDbAndDisk,
  addPhoto,
  getPhotoFromDb,
  deletePhotoFromDisk,
} from "@tests/helpers/functions";
import { serverTokenHeader } from "@tests/helpers/functions";
import { PhotoTypes } from "@src/types/photoType";

describe("Test 'addPhoto' endpoint", () => {
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

  it("Should add 1 photo when called", async () => {
    const ret = await request(app)
      .post("/addPhoto")
      .set(serverTokenHeader())
      .send(defaultPhoto);

    expect(ret.statusCode).toBe(200);
    expect(ret.body.ok).toBe(true);
    expect(ret.body).toHaveProperty("data");
    expect(ret.body.data).toHaveProperty("photo");

    testPhotoMetaAndId(ret.body.data.photo);
    await testPhotosExistInDbAndDisk(ret.body.data.photo);

    const getPhoto = await getPhotoById(
      app,
      ret.body.data.photo.id,
      "original"
    );

    expect(getPhoto).toBeTruthy();
    expect(getPhoto.id).toBe(ret.body.data.photo.id);
    expect(getPhoto.meta.name).toBe(defaultPhoto.name);
    expect(getPhoto.meta.fileSize).toBe(defaultPhoto.fileSize);
    expect(getPhoto.meta.width).toBe(defaultPhoto.width);
    expect(getPhoto.meta.height).toBe(defaultPhoto.height);
    expect(getPhoto.meta.clientPath).toBe(defaultPhoto.path);
    expect(getPhoto.meta.date).toBe(defaultPhoto.date);
    expect(getPhoto.image64).toBe(defaultPhoto.image64);
  });

  it("Should return error PHOTO_EXISTS and not add photo if tried to add same path twice", async () => {
    const photo1 = {
      name: "image1.jpg",
      fileSize: 1000,
      width: 1500,
      height: 1000,
      path: "/path/to/image.jpg",
      date: "2022-12-11T17:05:21.396Z",
      image64: defaultPhoto.image64,
    };

    const photo2 = {
      name: "image2.jpg",
      fileSize: 1000,
      width: 1500,
      height: 1000,
      path: "/path/to/image.jpg",
      date: "2022-12-11T17:05:21.396Z",
      image64: defaultPhoto.image64,
    };

    const ret1 = await request(app)
      .post("/addPhoto")
      .set(serverTokenHeader())
      .send(photo1);

    const ret2 = await request(app)
      .post("/addPhoto")
      .set(serverTokenHeader())
      .send(photo2);

    expect(ret1.statusCode).toBe(200);
    expect(ret1.body.ok).toBe(true);

    expect(ret2.statusCode).toBe(400);
    expect(ret2.body.ok).toBe(false);
    expect(ret2.body.errorCode).toBe("PHOTO_EXISTS");

    const getPhoto1 = await getPhotoById(app, ret1.body.data.photo.id, "data");
    expect(getPhoto1).toBeTruthy();

    const nbPhotos = await getNumberPhotos(app);
    expect(nbPhotos).toBe(1);
  });

  const testDataArray: Array<{ photoType: PhotoTypes }> = [
    { photoType: "thumbnail" },
    { photoType: "compressed" },
    { photoType: "original" },
  ];

  it.each(testDataArray)(
    "Should add 1 photo when called with an existing clientPath but $photoType missing on disk",
    async (testData) => {
      const addedPhotoData = await addPhoto(app);

      const photo = await getPhotoFromDb(addedPhotoData.id);
      await deletePhotoFromDisk(photo, testData.photoType);

      const ret = await request(app)
        .post("/addPhoto")
        .set(serverTokenHeader())
        .send(defaultPhoto);

      expect(ret.statusCode).toBe(200);
      expect(ret.body.ok).toBe(true);
      expect(ret.body).toHaveProperty("data");
      expect(ret.body.data).toHaveProperty("photo");

      testPhotoMetaAndId(ret.body.data.photo);
      await testPhotosExistInDbAndDisk(ret.body.data.photo);

      const getPhoto = await getPhotoById(
        app,
        ret.body.data.photo.id,
        "original"
      );

      expect(getPhoto).toBeTruthy();
      expect(getPhoto.id).toBe(ret.body.data.photo.id);
      expect(getPhoto.meta.name).toBe(defaultPhoto.name);
      expect(getPhoto.meta.fileSize).toBe(defaultPhoto.fileSize);
      expect(getPhoto.meta.width).toBe(defaultPhoto.width);
      expect(getPhoto.meta.height).toBe(defaultPhoto.height);
      expect(getPhoto.meta.clientPath).toBe(defaultPhoto.path);
      expect(getPhoto.meta.date).toBe(defaultPhoto.date);
      expect(getPhoto.image64).toBe(defaultPhoto.image64);
    }
  );
});
