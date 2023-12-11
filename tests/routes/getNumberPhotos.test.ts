import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { Express } from "express";

import { initServer, stopServer } from "@src/server/server";
import { initDB } from "@src/db/databaseFunctions";
import { clearDB } from "@src/db/databaseFunctions";
import { clearImagesDisk } from "@src/modules/diskManager";
import { addNPhotos } from "@tests/helpers/functions";

describe("Test 'getNumberPhotos' endpoint", () => {
  let app: Express;

  beforeAll(async () => {
    app = await initServer();
  });

  afterAll(async () => {
    stopServer();
    await clearDB();
    await clearImagesDisk();
  });

  beforeEach(async () => {
    await initDB();
  });

  afterEach(async () => {
    await clearDB();
    await clearImagesDisk();
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
