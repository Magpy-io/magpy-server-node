import "@tests/helpers/loadEnvFile";
import { mockModules } from "@tests/helpers/mockModules";
mockModules();

import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { Express } from "express";

import { initServer, stopServer } from "@src/server/server";

import * as sac from "@tests/helpers/setupAndCleanup";

import {
  addPhoto,
  testPhotoMetaAndId,
  defaultPhoto,
  getPhotoFromDb,
  deletePhotoFromDisk,
} from "@tests/helpers/functions";

import { serverTokenHeader } from "@tests/helpers/functions";
import { PhotoTypes } from "@src/types/photoType";

describe("Test 'getPhotoPartById' endpoint", () => {
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

  it("Should return all parts of a photo and combine to match the original photo added", async () => {
    const addedPhotoData = await addPhoto(app);

    const ret = await request(app)
      .post("/getPhotoPartById")
      .set(serverTokenHeader())
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
        .set(serverTokenHeader())
        .send({ id: addedPhotoData.id, part: i });

      expect(reti.statusCode).toBe(200);
      expect(reti.body.ok).toBe(true);
      expect(reti.body.data.part).toBe(i);
      testPhotoMetaAndId(reti.body.data.photo, { id: addedPhotoData.id });
      parts.push(reti.body.data.photo.image64);
    }

    const partsCombined = parts.reduce((a, b) => a + b);

    expect(partsCombined).toBe(defaultPhoto.image64);
  });

  it("Should return ID_NOT_FOUND error if requesting a photo that does not exist", async () => {
    const ret = await request(app)
      .post("/getPhotoPartById")
      .set(serverTokenHeader())
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
        .set(serverTokenHeader())
        .send({ id: addedPhotoData.id, part: testParameter.n });

      expect(ret.statusCode).toBe(400);
      expect(ret.body.ok).toBe(false);
      expect(ret.body.errorCode).toBe("INVALID_PART_NUMBER");
    }
  );

  const testDataArray: Array<{ photoType: PhotoTypes }> = [
    { photoType: "thumbnail" },
    { photoType: "compressed" },
    { photoType: "original" },
  ];

  it.each(testDataArray)(
    "Should return ID_NOT_FOUND error if requesting a photo that exists in db but $photoType is not on disk",
    async (testData: { photoType: PhotoTypes }) => {
      const addedPhotoData = await addPhoto(app);

      const photo = await getPhotoFromDb(addedPhotoData.id);
      await deletePhotoFromDisk(photo, testData.photoType);

      const ret = await request(app)
        .post("/getPhotoPartById")
        .set(serverTokenHeader())
        .send({ id: addedPhotoData.id, part: 0 });

      expect(ret.statusCode).toBe(400);
      expect(ret.body.ok).toBe(false);
      expect(ret.body.errorCode).toBe("ID_NOT_FOUND");
    }
  );
});
