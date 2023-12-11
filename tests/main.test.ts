import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { Express } from "express";

import { initServer, stopServer } from "@src/server/server";
import { initDB } from "@src/db/databaseFunctions";
import { clearDB } from "@src/db/databaseFunctions";
import { clearImagesDisk } from "@src/modules/diskManager";
import { addPhoto } from "./helpers";

describe("getNumberPhotos", () => {
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

  it("should return 0 photos at the start", async () => {
    const ret = await request(app).post("/getNumberPhotos").send({});

    expect(ret.statusCode).toBe(200);
    expect(ret.body.ok).toBe(true);
    expect(ret.body).toHaveProperty("data");
    expect(ret.body.data.number).toBe(0);
  });

  it("should return 1 photo if a photo is added", async () => {
    await addPhoto(app, "/path/to/image");
    const ret = await request(app).post("/getNumberPhotos").send({});

    expect(ret.statusCode).toBe(200);
    expect(ret.body.ok).toBe(true);
    expect(ret.body).toHaveProperty("data");
    expect(ret.body.data.number).toBe(1);
  });
});

function TestGetNumberPhotosReturn(ret: request.Response) {
  expect(ret.statusCode).toBe(200);
  expect(ret.body.ok).toBe(true);
  expect(ret.body).toHaveProperty("data");
  expect(ret.body.data.number).toBe(1);
}
