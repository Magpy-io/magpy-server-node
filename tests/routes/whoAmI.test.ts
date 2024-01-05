import "@tests/helpers/loadEnvFile";
import { mockModules } from "@tests/helpers/mockModules";
mockModules();

import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { Express } from "express";

import { initServer, stopServer } from "@src/server/server";
import * as sac from "@tests/helpers/setupAndCleanup";

import * as mockValues from "@src/modules/__mocks__/backendRequestsMockValues";
import { serverTokenHeader } from "@tests/helpers/functions";

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
    const ret = await request(app)
      .post("/whoami")
      .set(serverTokenHeader())
      .send({});

    expect(ret.statusCode).toBe(200);
    expect(ret.body.ok).toBe(true);
    expect(ret.body).toHaveProperty("data");
    expect(ret.body.data).toHaveProperty("user");
    expect(ret.body.data.user.id).toBe(mockValues.userId);
  });
});
