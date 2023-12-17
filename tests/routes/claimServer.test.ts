import "@tests/helpers/loadEnvFile";
import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { Express } from "express";

import mockFsVolumeReset from "@tests/helpers/mockFsVolumeReset";
import { AddServerData } from "@tests/helpers/mockFsValumeManager";

jest.mock("fs/promises");
jest.mock("@src/modules/backendRequests");

import * as mockValues from "@tests/mockHelpers/backendRequestsMockValues";

import { initServer, stopServer, clearFilesWaiting } from "@src/server/server";
import { openAndInitDB, clearDB } from "@src/db/sequelizeDb";
import { clearImagesDisk } from "@src/modules/diskManager";

describe("Test 'claimServer' endpoint", () => {
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
  });

  afterEach(async () => {
    await clearDB();
    await clearImagesDisk();
    await clearFilesWaiting();
  });

  it("Should return ok when claiming a non claimed server", async () => {
    const ret = await request(app)
      .post("/claimServer")
      .send({ userToken: mockValues.validUserToken });

    expect(ret.statusCode).toBe(200);
    expect(ret.body.ok).toBe(true);
  });

  it("Should return error AUTHORIZATION_BACKEND_FAILED when trying to claim a server with a non valid token", async () => {
    const ret = await request(app)
      .post("/claimServer")
      .send({ userToken: mockValues.invalidUserToken });

    expect(ret.statusCode).toBe(400);
    expect(ret.body.ok).toBe(false);
    expect(ret.body.errorCode).toBe("AUTHORIZATION_BACKEND_FAILED");
  });

  it("Should return error AUTHORIZATION_BACKEND_EXPIRED when trying to claim a server with an expired token", async () => {
    const ret = await request(app)
      .post("/claimServer")
      .send({ userToken: mockValues.expiredUserToken });

    expect(ret.statusCode).toBe(400);
    expect(ret.body.ok).toBe(false);
    expect(ret.body.errorCode).toBe("AUTHORIZATION_BACKEND_EXPIRED");
  });

  it("Should return error SERVER_ALREADY_CLAIMED when claiming a server with a valid server token", async () => {
    AddServerData({
      serverToken: mockValues.validServerToken,
    });

    const ret = await request(app)
      .post("/claimServer")
      .send({ userToken: mockValues.validUserToken });

    expect(ret.statusCode).toBe(400);
    expect(ret.body.ok).toBe(false);
    expect(ret.body.errorCode).toBe("SERVER_ALREADY_CLAIMED");
  });

  it("Should return error SERVER_ALREADY_CLAIMED when claiming a server with a valid id and key", async () => {
    AddServerData({
      serverId: mockValues.serverId,
      serverKey: mockValues.validKey,
    });

    const ret = await request(app)
      .post("/claimServer")
      .send({ userToken: mockValues.validUserToken });

    expect(ret.statusCode).toBe(400);
    expect(ret.body.ok).toBe(false);
    expect(ret.body.errorCode).toBe("SERVER_ALREADY_CLAIMED");
  });

  it("Should return error BACKEND_SERVER_UNREACHABLE when claiming a server but backend unreachable", async () => {
    AddServerData({
      serverId: mockValues.serverId,
      serverKey: mockValues.validKey,
      serverToken: mockValues.validServerToken,
    });
    mockValues.failNextRequestServerUnreachable();

    const ret = await request(app)
      .post("/claimServer")
      .send({ userToken: mockValues.validUserToken });

    expect(ret.statusCode).toBe(500);
    expect(ret.body.ok).toBe(false);
    expect(ret.body.errorCode).toBe("BACKEND_SERVER_UNREACHABLE");
  });

  it("Should return error SERVER_ERROR when claiming a server but receiving unexpected error from backend", async () => {
    AddServerData({
      serverId: mockValues.serverId,
      serverKey: mockValues.validKey,
      serverToken: mockValues.validServerToken,
    });
    mockValues.failNextRequest();

    const ret = await request(app)
      .post("/claimServer")
      .send({ userToken: mockValues.validUserToken });

    expect(ret.statusCode).toBe(500);
    expect(ret.body.ok).toBe(false);
    expect(ret.body.errorCode).toBe("SERVER_ERROR");
  });
});
