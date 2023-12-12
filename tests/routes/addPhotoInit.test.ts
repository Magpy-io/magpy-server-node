import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { Express } from "express";
import { validate } from "uuid";

import { initServer, stopServer } from "@src/server/server";
import { initDB } from "@src/db/databaseFunctions";
import { clearDB } from "@src/db/databaseFunctions";
import { clearImagesDisk } from "@src/modules/diskManager";
import { defaultPhoto, addPhoto } from "@tests/helpers/functions";
import FilesWaiting from "@src/modules/waitingFiles";
import { timeout } from "@src/modules/functions";

describe("Test 'addPhotoInit' endpoint", () => {
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

  it("Should return the id of the photo being added", async () => {
    const photo = { ...defaultPhoto };
    delete photo.image64;

    const requestPhoto = { ...photo, image64Len: 132148 };

    const ret = await request(app).post("/addPhotoInit").send(requestPhoto);

    expect(ret.statusCode).toBe(200);
    expect(ret.body.ok).toBe(true);
    expect(ret.body).toHaveProperty("data");

    const validId = validate(ret.body.data.id);
    expect(validId).toBe(true);

    expect(FilesWaiting.size).toBe(1);

    await timeout(100);

    expect(FilesWaiting.size).toBe(0);
  });

  it("Should return error PHOTO_EXISTS and not add pending photo if tried to add an existing path", async () => {
    const addedPhotoData = await addPhoto(app);

    const photo = { ...defaultPhoto };
    delete photo.image64;

    const requestPhoto = { ...photo, image64Len: 132148 };
    requestPhoto.path = addedPhotoData.path;

    const ret = await request(app).post("/addPhotoInit").send(requestPhoto);

    expect(ret.statusCode).toBe(400);
    expect(ret.body.ok).toBe(false);
    expect(ret.body.errorCode).toBe("PHOTO_EXISTS");

    expect(FilesWaiting.size).toBe(0);
  });
});
