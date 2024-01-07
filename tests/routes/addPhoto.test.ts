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
  getUserId,
  testWarning,
} from "@tests/helpers/functions";
import { serverTokenHeader } from "@tests/helpers/functions";
import { PhotoTypes } from "@src/types/photoType";
import {
  GetLastWarningForUser,
  HasWarningForUser,
} from "@src/modules/warningsManager";

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
    expect(ret.body.warning).toBe(false);
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
});
