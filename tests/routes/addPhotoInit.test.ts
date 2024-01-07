import "@tests/helpers/loadEnvFile";
import { mockModules } from "@tests/helpers/mockModules";
mockModules();

import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { Express } from "express";
import { validate } from "uuid";

import { initServer, stopServer } from "@src/server/server";

import * as sac from "@tests/helpers/setupAndCleanup";

import {
  defaultPhoto,
  addPhoto,
  waitForPhotoTransferToFinish,
  getPhotoFromDb,
  deletePhotoFromDisk,
  testWarning,
} from "@tests/helpers/functions";
import FilesWaiting from "@src/modules/waitingFiles";
import { serverTokenHeader } from "@tests/helpers/functions";
import { PhotoTypes } from "@src/types/photoType";

describe("Test 'addPhotoInit' endpoint", () => {
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
    expect(ret.body.warning).toBe(false);
    expect(ret.body).toHaveProperty("data");

    const validId = validate(ret.body.data.id);
    expect(validId).toBe(true);

    expect(FilesWaiting.size).toBe(1);

    await waitForPhotoTransferToFinish();

    expect(FilesWaiting.size).toBe(0);
  });
});
