import "@tests/helpers/loadEnvFile";
import { mockModules } from "@tests/helpers/mockModules";
mockModules();

import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { Express } from "express";

import * as mockValues from "@src/modules/__mocks__/backendRequestsMockValues";

import { initServer, stopServer } from "@src/server/server";

import * as sac from "@tests/helpers/setupAndCleanup";

import { testReturnedToken } from "@tests/helpers/functions";

describe("Test 'claimServer' endpoint", () => {
  let app: Express;

  beforeAll(async () => {
    app = await initServer();
  });

  afterAll(async () => {
    stopServer();
  });

  beforeEach(async () => {
    await sac.beforeEachGetTokenTest(app);
  });

  afterEach(async () => {
    await sac.afterEach();
  });

  it("Should return a valid token when asking a claimed server", async () => {
    AddServerData({
      serverId: mockValues.serverId,
      serverKey: mockValues.validKey,
      serverToken: mockValues.validServerToken,
    });

    const ret = await request(app)
      .post("/getToken")
      .send({ userToken: mockValues.validUserToken });

    expect(ret.statusCode).toBe(200);
    expect(ret.body.ok).toBe(true);
    await testReturnedToken(ret);
  });

  it("Should return error AUTHORIZATION_BACKEND_FAILED when using invalid user token", async () => {
    AddServerData({
      serverId: mockValues.serverId,
      serverKey: mockValues.validKey,
      serverToken: mockValues.validServerToken,
    });

    const ret = await request(app)
      .post("/getToken")
      .send({ userToken: mockValues.invalidUserToken });

    expect(ret.statusCode).toBe(400);
    expect(ret.body.ok).toBe(false);
    expect(ret.body.errorCode).toBe("AUTHORIZATION_BACKEND_FAILED");
  });

  it("Should return error AUTHORIZATION_BACKEND_EXPIRED when using an expired user token", async () => {
    AddServerData({
      serverId: mockValues.serverId,
      serverKey: mockValues.validKey,
      serverToken: mockValues.validServerToken,
    });

    const ret = await request(app)
      .post("/getToken")
      .send({ userToken: mockValues.expiredUserToken });

    expect(ret.statusCode).toBe(400);
    expect(ret.body.ok).toBe(false);
    expect(ret.body.errorCode).toBe("AUTHORIZATION_BACKEND_EXPIRED");
  });

  it("Should return error SERVER_NOT_CLAIMED when requesting a server not claimed", async () => {
    const ret = await request(app)
      .post("/getToken")
      .send({ userToken: mockValues.validUserToken });

    expect(ret.statusCode).toBe(400);
    expect(ret.body.ok).toBe(false);
    expect(ret.body.errorCode).toBe("SERVER_NOT_CLAIMED");
  });

  it("Should return error USER_NOT_ALLOWED when requesting a server not owned by user", async () => {
    AddServerData({
      serverId: mockValues.serverId,
      serverKey: mockValues.validKey,
      serverToken: mockValues.validServerToken,
    });

    const ret = await request(app)
      .post("/getToken")
      .send({ userToken: mockValues.validUserToken2 });

    expect(ret.statusCode).toBe(400);
    expect(ret.body.ok).toBe(false);
    expect(ret.body.errorCode).toBe("USER_NOT_ALLOWED");
  });

  it("Should return error BACKEND_SERVER_UNREACHABLE when claiming a server but backend unreachable", async () => {
    AddServerData({
      serverId: mockValues.serverId,
      serverKey: mockValues.validKey,
      serverToken: mockValues.validServerToken,
    });
    mockValues.failNextRequestServerUnreachable();

    const ret = await request(app)
      .post("/getToken")
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
      .post("/getToken")
      .send({ userToken: mockValues.validUserToken });

    expect(ret.statusCode).toBe(500);
    expect(ret.body.ok).toBe(false);
    expect(ret.body.errorCode).toBe("SERVER_ERROR");
  });
});
