import "@tests/helpers/loadEnvFile";
import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { Express } from "express";

import { mockModules } from "@tests/helpers/mockModules";
mockModules();

import mockFsVolumeReset from "@tests/helpers/mockFsVolumeReset";
import { initServer, stopServer, clearFilesWaiting } from "@src/server/server";
import { openAndInitDB } from "@src/db/sequelizeDb";
import { clearDB } from "@src/db/sequelizeDb";
import { clearImagesDisk } from "@src/modules/diskManager";
import * as mockValues from "@src/modules/__mocks__/backendRequestsMockValues";
import {
  setupServerUserToken,
  serverTokenHeader,
} from "@tests/helpers/functions";

import { GetServerData } from "@src/modules/serverDataManager";

describe("Test 'unclaimServer' endpoint", () => {
  let app: Express;

  beforeAll(async () => {
    app = await initServer();
  });

  afterAll(async () => {
    stopServer();
  });

  beforeEach(async () => {
    await openAndInitDB();
    mockFsVolumeReset();
    await setupServerUserToken(app);
  });

  afterEach(async () => {
    await clearDB();
    await clearImagesDisk();
    await clearFilesWaiting();
  });

  it("Should return ok if unclaimed a valid server", async () => {
    const ret = await request(app)
      .post("/unclaimServer")
      .set(serverTokenHeader())
      .send({});

    expect(ret.statusCode).toBe(200);
    expect(ret.body.ok).toBe(true);

    const serverData = await GetServerData();

    expect(serverData.serverId).toBeFalsy();
    expect(serverData.serverKey).toBeFalsy();
    expect(serverData.serverToken).toBeFalsy();
  });
});
