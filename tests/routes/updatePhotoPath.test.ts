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
  deletePhotoFromDisk,
  getPhotoById,
  getPhotoFromDb,
  testWarning,
} from "@tests/helpers/functions";
import { serverTokenHeader } from "@tests/helpers/functions";

describe("Test 'updatePhotoPath' endpoint", () => {
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

  it("Should change the path of photo after adding the photo", async () => {
    const addedPhotoData = await addPhoto(app);

    const ret = await request(app)
      .post("/updatePhotoPath")
      .set(serverTokenHeader())
      .send({
        id: addedPhotoData.id,
        path: "newPath",
      });

    expect(ret.statusCode).toBe(200);
    expect(ret.body.ok).toBe(true);
    expect(ret.body.warning).toBe(false);

    const photo = await getPhotoById(app, addedPhotoData.id);
    expect(photo.meta.clientPath).toBe("newPath");
  });

  it("Should return error ID_NOT_FOUND when request id not in db", async () => {
    const ret = await request(app)
      .post("/updatePhotoPath")
      .set(serverTokenHeader())
      .send({
        id: "id",
        path: "newPath",
      });

    expect(ret.statusCode).toBe(400);
    expect(ret.body.ok).toBe(false);
    expect(ret.body.errorCode).toBe("ID_NOT_FOUND");
  });

  it("Should return error ID_NOT_FOUND when id is in db but compressed photo is missing from disk", async () => {
    const addedPhotoData = await addPhoto(app);

    const photo = await getPhotoFromDb(addedPhotoData.id);
    await deletePhotoFromDisk(photo, "compressed");

    const ret = await request(app)
      .post("/updatePhotoPath")
      .set(serverTokenHeader())
      .send({
        id: addedPhotoData.id,
        path: addedPhotoData.path,
      });

    expect(ret.statusCode).toBe(400);
    expect(ret.body.ok).toBe(false);
    expect(ret.body.warning).toBe(true);
    expect(ret.body.errorCode).toBe("ID_NOT_FOUND");

    testWarning(photo);
  });
});
