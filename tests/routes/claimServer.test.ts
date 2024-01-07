import "@tests/helpers/loadEnvFile";
import { mockModules } from "@tests/helpers/mockModules";
mockModules();

import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { Express } from "express";

import * as mockValues from "@src/modules/__mocks__/backendRequestsMockValues";

import * as mockValuesGetIp from "@src/modules/__mocks__/getMyIpMockValues";

import { initServer, stopServer } from "@src/server/server";
import { SaveServerCredentials } from "@src/modules/serverDataManager";
import * as sac from "@tests/helpers/setupAndCleanup";

describe("Test 'claimServer' endpoint", () => {
  let app: Express;

  beforeAll(async () => {
    app = await initServer();
  });

  afterAll(async () => {
    stopServer();
  });

  beforeEach(async () => {
    await sac.beforeEachNoUserTokenSetup(app);
  });

  afterEach(async () => {
    await sac.afterEach();
  });

  it("Should return ok when claiming a non claimed server", async () => {
    const ret = await request(app)
      .post("/claimServer")
      .send({ userToken: mockValues.validUserToken });
    console.log(ret.body);
    expect(ret.statusCode).toBe(200);
    expect(ret.body.ok).toBe(true);
    expect(ret.body.warning).toBe(false);
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
    SaveServerCredentials({
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
    SaveServerCredentials({
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
    mockValues.failNextRequestServerUnreachable();

    const ret = await request(app)
      .post("/claimServer")
      .send({ userToken: mockValues.validUserToken });

    expect(ret.statusCode).toBe(500);
    expect(ret.body.ok).toBe(false);
    expect(ret.body.errorCode).toBe("BACKEND_SERVER_UNREACHABLE");
  });

  it("Should return error SERVER_ERROR when claiming a server but receiving unexpected error from backend", async () => {
    mockValues.failNextRequest();

    const ret = await request(app)
      .post("/claimServer")
      .send({ userToken: mockValues.validUserToken });

    expect(ret.statusCode).toBe(500);
    expect(ret.body.ok).toBe(false);
    expect(ret.body.errorCode).toBe("SERVER_ERROR");
  });

  it("Should return error SERVER_ERROR when claiming a server but could not retrieve my own ip address", async () => {
    mockValuesGetIp.failNextRequest();

    const ret = await request(app)
      .post("/claimServer")
      .send({ userToken: mockValues.validUserToken });

    expect(ret.statusCode).toBe(500);
    expect(ret.body.ok).toBe(false);
    expect(ret.body.errorCode).toBe("SERVER_ERROR");
  });
});
