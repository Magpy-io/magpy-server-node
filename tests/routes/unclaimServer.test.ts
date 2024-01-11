import "@tests/helpers/loadEnvFile";
import { mockModules } from "@tests/helpers/mockModules";
mockModules();

import { describe, expect, it } from "@jest/globals";

import { Express } from "express";
import * as exportedTypes from "@src/api/export/exportedTypes";

import { initServer, stopServer } from "@src/server/server";

import * as sac from "@tests/helpers/setupAndCleanup";

import { GetServerConfigData } from "@src/modules/serverDataManager";
import { expectToBeOk } from "@tests/helpers/functions";

describe("Test 'unclaimServer' endpoint", () => {
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

  it("Should return ok if unclaimed a valid server", async () => {
    const ret = await exportedTypes.UnclaimServerPost();

    expectToBeOk(ret);
    expect(ret.warning).toBe(false);

    const serverData = GetServerConfigData();

    expect(serverData.serverId).toBeFalsy();
    expect(serverData.serverKey).toBeFalsy();
    expect(serverData.serverToken).toBeFalsy();
  });
});
