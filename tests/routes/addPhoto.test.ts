import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { Express } from "express";

import { initServer, stopServer } from "@src/server/server";
import { initDB } from "@src/db/databaseFunctions";
import { clearDB } from "@src/db/databaseFunctions";
import { clearImagesDisk } from "@src/modules/diskManager";

import { photoImage64 } from "@tests/helpers/imageBase64";
import {
  testPhotoMetaAndId,
  getPhotoById,
  getNumberPhotos,
} from "@tests/helpers/functions";

describe("Test 'addPhoto' endpoint", () => {
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

  it("Should add 1 photo when called", async () => {
    const photo = {
      name: "image122.jpg",
      fileSize: 1000,
      width: 1500,
      height: 1000,
      path: "/path/to/image.jpg",
      date: "2022-12-11T17:05:21.396Z",
      image64: photoImage64,
    };

    const ret = await request(app).post("/addPhoto").send(photo);

    expect(ret.statusCode).toBe(200);
    expect(ret.body.ok).toBe(true);
    expect(ret.body).toHaveProperty("data");
    expect(ret.body.data).toHaveProperty("photo");

    testPhotoMetaAndId(ret.body.data.photo, photo);

    const getPhoto = await getPhotoById(
      app,
      ret.body.data.photo.id,
      "original"
    );

    expect(getPhoto).toBeTruthy();
    expect(getPhoto.id).toBe(ret.body.data.photo.id);
    expect(getPhoto.meta.name).toBe(photo.name);
    expect(getPhoto.meta.fileSize).toBe(photo.fileSize);
    expect(getPhoto.meta.width).toBe(photo.width);
    expect(getPhoto.meta.height).toBe(photo.height);
    expect(getPhoto.meta.clientPath).toBe(photo.path);
    expect(getPhoto.meta.date).toBe(photo.date);
    expect(getPhoto.image64).toBe(photo.image64);
  });

  it("Should return error PHOTO_EXISTS and not add photo if tried to add same path twice", async () => {
    const photo1 = {
      name: "image1.jpg",
      fileSize: 1000,
      width: 1500,
      height: 1000,
      path: "/path/to/image.jpg",
      date: "2022-12-11T17:05:21.396Z",
      image64: photoImage64,
    };

    const photo2 = {
      name: "image2.jpg",
      fileSize: 1000,
      width: 1500,
      height: 1000,
      path: "/path/to/image.jpg",
      date: "2022-12-11T17:05:21.396Z",
      image64: photoImage64,
    };

    const ret1 = await request(app).post("/addPhoto").send(photo1);

    const ret2 = await request(app).post("/addPhoto").send(photo2);

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
});
