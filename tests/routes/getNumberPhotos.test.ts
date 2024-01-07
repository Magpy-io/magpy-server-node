import "@tests/helpers/loadEnvFile";
import { mockModules } from "@tests/helpers/mockModules";
mockModules();

import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { Express } from "express";

import { initServer, stopServer } from "@src/server/server";

import * as sac from "@tests/helpers/setupAndCleanup";

import { addNPhotos } from "@tests/helpers/functions";
import { serverTokenHeader } from "@tests/helpers/functions";

describe("Test 'getNumberPhotos' endpoint", () => {
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

  it.each([{ n: 0 }, { n: 1 }, { n: 2 }])(
    "Should return $n after adding $n photos",
    async (p: { n: number }) => {
      await addNPhotos(app, p.n);

      const ret = await request(app)
        .post("/getNumberPhotos")
        .set(serverTokenHeader())
        .send({});

      expect(ret.statusCode).toBe(200);
      expect(ret.body.ok).toBe(true);
      expect(ret.body.warning).toBe(false);
      expect(ret.body).toHaveProperty("data");
      expect(ret.body.data.number).toBe(p.n);
    }
  );
});
