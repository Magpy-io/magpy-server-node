import "@tests/helpers/loadEnvFile";
import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { Express } from "express";
import * as path from "path";

import { mockModules } from "@tests/helpers/mockModules";
mockModules();

import mockFsVolumeReset from "@tests/helpers/mockFsVolumeReset";
import {
  CreatePath,
  GetPathFromRoot,
} from "@tests/helpers/mockFsValumeManager";
import { initServer, stopServer, clearFilesWaiting } from "@src/server/server";
import { openAndInitDB } from "@src/db/sequelizeDb";
import { clearDB } from "@src/db/sequelizeDb";
import { setupServerUserToken } from "@tests/helpers/functions";

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
    await openAndInitDB();
    await mockFsVolumeReset();
    await setupServerUserToken(app);
  });

  afterEach(async () => {
    await clearDB();
    await clearFilesWaiting();
  });

  it("Should return ok when changing the server path to a valid one", async () => {
    const photosPath = GetPathFromRoot("/pathToPhotos");
    CreatePath(photosPath);

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
