import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { Express } from "express";

import { initServer, stopServer, clearFilesWaiting } from "@src/server/server";
import { openAndInitDB } from "@src/db/sequelizeDb";
import { clearDB } from "@src/db/sequelizeDb";
import { clearImagesDisk } from "@src/modules/diskManager";
import { addNPhotos } from "@tests/helpers/functions";

describe("Test 'getNumberPhotos' endpoint", () => {
  let app: Express;

  beforeAll(async () => {
    app = await initServer();
  });

  afterAll(async () => {
    stopServer();
  });

  beforeEach(async () => {
    await openAndInitDB();
  });

  afterEach(async () => {
    await clearDB();
    await clearImagesDisk();
    await clearFilesWaiting();
  });

  it.each([{ n: 0 }, { n: 1 }, { n: 2 }])(
    "Should return $n after adding $n photos",
    async (p: { n: number }) => {
      await addNPhotos(app, p.n);

      const ret = await request(app).post("/getNumberPhotos").send({});

      expect(ret.statusCode).toBe(200);
      expect(ret.body.ok).toBe(true);
      expect(ret.body).toHaveProperty("data");
      expect(ret.body.data.number).toBe(p.n);
    }
  );
});
