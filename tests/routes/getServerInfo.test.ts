import "@tests/helpers/loadEnvFile";
import { mockModules } from "@tests/helpers/mockModules";
mockModules();

import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { Express } from "express";

import { initServer, stopServer } from "@src/server/server";
import * as sac from "@tests/helpers/setupAndCleanup";
import * as mockValues from "@src/modules/__mocks__/backendRequestsMockValues";

import {
  GetServerName,
  GetStorageFolderPath,
  SaveStorageFolderPath,
  SaveServerName,
} from "@src/modules/serverDataManager";

describe("Test 'getServerInfo' endpoint", () => {
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

  type returntype = {
    storagePath: string;
    serverName: string;
    owner: { name: string; email: string } | null;
  };

  it("Should return the default server info", async () => {
    const ret = await request(app).post("/getServerInfo").send({});

    expect(ret.statusCode).toBe(200);
    expect(ret.body.ok).toBe(true);
    expect(ret.body.warning).toBe(false);

    const serverName = GetServerName();
    const serverPath = GetStorageFolderPath();

    expect(ret.body.data.storagePath).toBe(serverPath);
    expect(ret.body.data.serverName).toBe(serverName);
    expect(ret.body.data.owner.name).toBe(mockValues.validUserName);
    expect(ret.body.data.owner.email).toBe(mockValues.validUserEmail);
  });

  it("Should return the updated server info when changed", async () => {
    await SaveStorageFolderPath("newPath");
    await SaveServerName("newName");

    const ret = await request(app).post("/getServerInfo").send({});

    expect(ret.statusCode).toBe(200);
    expect(ret.body.ok).toBe(true);
    expect(ret.body.warning).toBe(false);

    expect(ret.body.data.storagePath).toBe("newPath");
    expect(ret.body.data.serverName).toBe("newName");
  });

  it("Should return owner null for an unclaimed server", async () => {
    await request(app).post("/unclaimServer").send({});

    const ret = await request(app).post("/getServerInfo").send({});

    expect(ret.statusCode).toBe(200);
    expect(ret.body.ok).toBe(true);
    expect(ret.body.warning).toBe(false);
    expect(ret.body.data.owner).toBeNull();
  });
});
