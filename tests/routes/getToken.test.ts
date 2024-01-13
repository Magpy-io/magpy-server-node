import "@tests/helpers/loadEnvFile";
import { mockModules } from "@tests/helpers/mockModules";
mockModules();

import { describe, expect, it } from "@jest/globals";

import { Express } from "express";
import { GetToken, UnclaimServer } from "@src/api/export/exportedTypes";

import * as mockValues from "@src/modules/__mocks__/backendRequestsMockValues";

import { initServer, stopServer } from "@src/server/server";

import * as sac from "@tests/helpers/setupAndCleanup";
import {
  expectErrorCodeToBe,
  expectToBeOk,
  expectToNotBeOk,
  testReturnedToken,
} from "@tests/helpers/functions";

describe("Test 'claimServer' endpoint", () => {
  let app: Express;

  beforeAll(async () => {
    app = await initServer();
  });

  afterAll(async () => {
    stopServer();
  });

  beforeEach(async () => {
    await sac.beforeEachNoUserTokenRequested(app);
  });

  afterEach(async () => {
    await sac.afterEach();
  });

  it("Should return a valid token when asking a claimed server", async () => {
    const ret = await GetToken.Post({
      userToken: mockValues.validUserToken,
    });

    expectToBeOk(ret);
    expect(ret.warning).toBe(false);

    testReturnedToken();
  });

  it("Should return error AUTHORIZATION_BACKEND_FAILED when using invalid user token", async () => {
    const ret = await GetToken.Post({
      userToken: mockValues.invalidUserToken,
    });

    expectToNotBeOk(ret);
    expectErrorCodeToBe(ret, "AUTHORIZATION_BACKEND_FAILED");
  });

  it("Should return error AUTHORIZATION_BACKEND_EXPIRED when using an expired user token", async () => {
    const ret = await GetToken.Post({
      userToken: mockValues.expiredUserToken,
    });

    expectToNotBeOk(ret);
    expectErrorCodeToBe(ret, "AUTHORIZATION_BACKEND_EXPIRED");
  });

  it("Should return error SERVER_NOT_CLAIMED when requesting a server not claimed", async () => {
    await UnclaimServer.Post();

    const ret = await GetToken.Post({
      userToken: mockValues.validUserToken,
    });

    expectToNotBeOk(ret);
    expectErrorCodeToBe(ret, "SERVER_NOT_CLAIMED");
  });

  it("Should return error USER_NOT_ALLOWED when requesting a server not owned by user", async () => {
    const ret = await GetToken.Post({
      userToken: mockValues.validUserToken2,
    });

    expectToNotBeOk(ret);
    expectErrorCodeToBe(ret, "USER_NOT_ALLOWED");
  });

  it("Should return error BACKEND_SERVER_UNREACHABLE when claiming a server but backend unreachable", async () => {
    mockValues.failNextRequestServerUnreachable();

    const ret = await GetToken.Post({
      userToken: mockValues.validUserToken,
    });

    expectToNotBeOk(ret);
    expectErrorCodeToBe(ret, "BACKEND_SERVER_UNREACHABLE");
  });

  it("Should return error SERVER_ERROR when claiming a server but receiving unexpected error from backend", async () => {
    mockValues.failNextRequest();

    const ret = await GetToken.Post({
      userToken: mockValues.validUserToken,
    });

    expectToNotBeOk(ret);
    expectErrorCodeToBe(ret, "SERVER_ERROR");
  });
});
