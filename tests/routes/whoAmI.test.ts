import "@tests/helpers/loadEnvFile";
import { mockModules } from "@tests/helpers/mockModules";
mockModules();

import { describe, expect, it } from "@jest/globals";

import { Express } from "express";
import { WhoAmI } from "@src/api/export";

import { initServer, stopServer } from "@src/server/server";
import * as sac from "@tests/helpers/setupAndCleanup";

import * as mockValues from "@src/modules/__mocks__/backendRequestsMockValues";
import { expectToBeOk, getDataFromRet } from "@tests/helpers/functions";

describe("Test 'whoAmI' endpoint", () => {
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

  it("Should ok if valid user token", async () => {
    const ret = await WhoAmI.Post({});

    expectToBeOk(ret);
    expect(ret.warning).toBe(false);

    const data = getDataFromRet(ret);

    expect(data.user.id).toBe(mockValues.userId);
  });
});
