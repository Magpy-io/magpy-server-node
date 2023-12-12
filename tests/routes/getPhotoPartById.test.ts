import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { Express } from "express";

import { initServer, stopServer } from "@src/server/server";
import { initDB } from "@src/db/databaseFunctions";
import { clearDB } from "@src/db/databaseFunctions";
import { clearImagesDisk } from "@src/modules/diskManager";
import {
  addPhoto,
  testPhotoMetaAndId,
  defaultPhoto,
} from "@tests/helpers/functions";

describe("Test 'getPhotoPartById' endpoint", () => {
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

  it("Should return all parts of a photo and combine to match the original photo added", async () => {
    const addedPhotoData = await addPhoto(app);

    const ret = await request(app)
      .post("/getPhotoPartById")
      .send({ id: addedPhotoData.id, part: 0 });

    expect(ret.statusCode).toBe(200);
    expect(ret.body.ok).toBe(true);
    expect(ret.body.data.part).toBe(0);
    testPhotoMetaAndId(ret.body.data.photo, { id: addedPhotoData.id });

    const totalNumberOfParts = ret.body.data.totalNbOfParts;
    const parts = [];
    parts.push(ret.body.data.photo.image64);

    for (let i = 1; i < totalNumberOfParts; i++) {
      const reti = await request(app)
        .post("/getPhotoPartById")
        .send({ id: addedPhotoData.id, part: i });

      expect(reti.statusCode).toBe(200);
      expect(reti.body.ok).toBe(true);
      expect(reti.body.data.part).toBe(i);
      testPhotoMetaAndId(reti.body.data.photo, { id: addedPhotoData.id });
      parts.push(reti.body.data.photo.image64);
    }

    const partsCombined = parts.reduce((a, b) => a + b);
    console.info(partsCombined);
    expect(partsCombined).toBe(defaultPhoto.image64);
  });

  it("Should return ID_NOT_FOUND error if requesting a photo that does not exist", async () => {
    const ret = await request(app)
      .post("/getPhotoPartById")
      .send({ id: "id", part: 0 });

    expect(ret.statusCode).toBe(400);
    expect(ret.body.ok).toBe(false);
    expect(ret.body.errorCode).toBe("ID_NOT_FOUND");
  });

  it.each([{ n: -1 }, { n: 1000 }])(
    "Should return INVALID_PART_NUMBER error if requesting a part number out of range ($n)",
    async (testParameter) => {
      const addedPhotoData = await addPhoto(app);

      const ret = await request(app)
        .post("/getPhotoPartById")
        .send({ id: addedPhotoData.id, part: testParameter.n });

      expect(ret.statusCode).toBe(400);
      expect(ret.body.ok).toBe(false);
      expect(ret.body.errorCode).toBe("INVALID_PART_NUMBER");
    }
  );
});
