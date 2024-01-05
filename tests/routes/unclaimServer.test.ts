import "@tests/helpers/loadEnvFile";
import { mockModules } from "@tests/helpers/mockModules";
mockModules();

import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { Express } from "express";

import { initServer, stopServer } from "@src/server/server";

import * as sac from "@tests/helpers/setupAndCleanup";

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
    await sac.beforeEach(app);
  });

  afterEach(async () => {
    await sac.afterEach();
  });

  it("Should return ok if unclaimed a valid server", async () => {
    const ret = await request(app).post("/unclaimServer").send({});

    expect(ret.statusCode).toBe(200);
    expect(ret.body.ok).toBe(true);

    const serverData = await GetServerData();

    expect(serverData.serverId).toBeFalsy();
    expect(serverData.serverKey).toBeFalsy();
    expect(serverData.serverToken).toBeFalsy();
  });
});
