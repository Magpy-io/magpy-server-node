import "@tests/helpers/loadEnvFile";
import { mockModules } from "@tests/helpers/mockModules";
mockModules();

import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { Express } from "express";

import { createFolder } from "@src/modules/diskManager";

import { GetPathFromRoot } from "@tests/helpers/mockFsVolumeManager";
import { initServer, stopServer } from "@src/server/server";

import * as sac from "@tests/helpers/setupAndCleanup";

import { GetStorageFolderPath } from "@src/modules/serverDataManager";

describe("Test 'updateServerPath' endpoint", () => {
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

  it("Should return ok when changing the server path to a valid one", async () => {
    const photosPath = GetPathFromRoot("/pathToPhotos");

    await createFolder(photosPath);
    const ret = await request(app)
      .post("/updateServerPath")
      .send({ path: photosPath });

    console.log(ret.body);
    expect(ret.statusCode).toBe(200);
    expect(ret.body.ok).toBe(true);

    const serverName = await GetStorageFolderPath();

    expect(serverName).toBe(photosPath);
  });

  it("Should return error PATH_FOLDER_DOES_NOT_EXIST when using a folder that does not exist", async () => {
    const serverPathBefore = await GetStorageFolderPath();
    const ret = await request(app)
      .post("/updateServerPath")
      .send({ path: GetPathFromRoot("/nonExistingPath") });

    expect(ret.statusCode).toBe(400);
    expect(ret.body.ok).toBe(false);
    expect(ret.body.errorCode).toBe("PATH_FOLDER_DOES_NOT_EXIST");

    const serverPath = await GetStorageFolderPath();

    expect(serverPath).toBe(serverPathBefore);
  });
});
