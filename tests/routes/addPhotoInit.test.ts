import "@tests/helpers/loadEnvFile";
import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { Express } from "express";
import { validate } from "uuid";

import { mockModules } from "@tests/helpers/mockModules";
mockModules();

import mockFsVolumeReset from "@tests/helpers/mockFsVolumeReset";
import { initServer, stopServer, clearFilesWaiting } from "@src/server/server";
import { openAndInitDB } from "@src/db/sequelizeDb";
import { clearDB } from "@src/db/sequelizeDb";
import { clearImagesDisk } from "@src/modules/diskManager";
import {
  defaultPhoto,
  addPhoto,
  waitForPhotoTransferToFinish,
} from "@tests/helpers/functions";
import FilesWaiting from "@src/modules/waitingFiles";
import {
  setupServerUserToken,
  serverTokenHeader,
} from "@tests/helpers/functions";

describe("Test 'addPhotoInit' endpoint", () => {
  let app: Express;

  beforeAll(async () => {
    app = await initServer();
  });

  afterAll(async () => {
    stopServer();
  });

  beforeEach(async () => {
    await openAndInitDB();
    await mockFsVolumeReset();
    await setupServerUserToken(app);
  });

  afterEach(async () => {
    await clearDB();
    await clearImagesDisk();
    await clearFilesWaiting();
  });

  it("Should return the id of the photo being added", async () => {
    const photo = { ...defaultPhoto } as any;
    delete photo.image64;

    const requestPhoto = { ...photo, image64Len: 132148 };

    const ret = await request(app)
      .post("/addPhotoInit")
      .set(serverTokenHeader())
      .send(requestPhoto);

    expect(ret.statusCode).toBe(200);
    expect(ret.body.ok).toBe(true);
    expect(ret.body).toHaveProperty("data");

    const validId = validate(ret.body.data.id);
    expect(validId).toBe(true);

    expect(FilesWaiting.size).toBe(1);

    await waitForPhotoTransferToFinish();

    expect(FilesWaiting.size).toBe(0);
  });

  it("Should return error PHOTO_EXISTS and not add pending photo if tried to add an existing path", async () => {
    const addedPhotoData = await addPhoto(app);

    const photo = { ...defaultPhoto } as any;
    delete photo.image64;

    const requestPhoto = { ...photo, image64Len: 132148 };
    requestPhoto.path = addedPhotoData.path;

    const ret = await request(app)
      .post("/addPhotoInit")
      .set(serverTokenHeader())
      .send(requestPhoto);

    expect(ret.statusCode).toBe(400);
    expect(ret.body.ok).toBe(false);
    expect(ret.body.errorCode).toBe("PHOTO_EXISTS");

    expect(FilesWaiting.size).toBe(0);
  });
});
