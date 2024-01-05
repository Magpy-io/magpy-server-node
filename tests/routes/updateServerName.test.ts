import "@tests/helpers/loadEnvFile";
import { mockModules } from "@tests/helpers/mockModules";
mockModules();

import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { Express } from "express";

import { initServer, stopServer } from "@src/server/server";
import * as sac from "@tests/helpers/setupAndCleanup";

import { GetServerName } from "@src/modules/serverDataManager";

describe("Test 'updateServerName' endpoint", () => {
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

  it("Should return ok when changing the server name", async () => {
    const ret = await request(app)
      .post("/updateServerName")
      .send({ name: "newName" });

    expect(ret.statusCode).toBe(200);
    expect(ret.body.ok).toBe(true);

    const serverName = await GetServerName();

    expect(serverName).toBe("newName");
  });

  it.each([
    { name: "ab" },
    {
      name: "12345678901234567890123456789012345678901234567890123456789012345678901",
    },
  ])(
    "Should return error INVALID_NAME when using the name : $name",
    async (testData) => {
      const serverNameBefore = await GetServerName();
      const ret = await request(app)
        .post("/updateServerName")
        .send({ name: testData.name });

      expect(ret.statusCode).toBe(400);
      expect(ret.body.ok).toBe(false);
      expect(ret.body.errorCode).toBe("INVALID_NAME");

      const serverName = await GetServerName();

      expect(serverName).toBe(serverNameBefore);
    }
  );
});
