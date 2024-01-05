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
import { setupServerUserToken } from "@tests/helpers/functions";

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
    await openAndInitDB();
    await mockFsVolumeReset();
    await setupServerUserToken(app);
  });

  afterEach(async () => {
    await clearDB();
    await clearFilesWaiting();
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
