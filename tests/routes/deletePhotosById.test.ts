import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { Express } from "express";

import { initServer, stopServer } from "@src/server/server";
import { initDB } from "@src/db/databaseFunctions";
import { clearDB } from "@src/db/databaseFunctions";
import { clearImagesDisk } from "@src/modules/diskManager";
import {
  addNPhotos,
  addPhoto,
  testPhotoOriginal,
  testPhotoCompressed,
  testPhotoThumbnail,
  testPhotoData,
} from "@tests/helpers/functions";

describe("Test 'deletePhotosById' endpoint", () => {
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
    "Should delete and return $n ids when removing $n ids after adding $n photos",
    async (p: { n: number }) => {
      const addedPhotosData = await addNPhotos(app, p.n);
      const ids = addedPhotosData.map((e) => e.id);

      const ret = await request(app).post("/deletePhotosById").send({
        ids: ids,
      });

      expect(ret.statusCode).toBe(200);
      expect(ret.body.ok).toBe(true);
      expect(ret.body).toHaveProperty("data");
      expect(ret.body.data).toHaveProperty("deletedIds");
      expect(ret.body.data.deletedIds).toEqual(ids);
    }
  );

  it.each([{ n: 0 }, { n: 1 }, { n: 2 }])(
    "Should return empty ids array when deleting $n ids that does not exist",
    async (p: { n: number }) => {
      const ids = Array(p.n)
        .fill("")
        .map((_, i) => "id" + i.toString());

      const ret = await request(app).post("/deletePhotosById").send({
        ids: ids,
      });

      expect(ret.statusCode).toBe(200);
      expect(ret.body.ok).toBe(true);
      expect(ret.body).toHaveProperty("data");
      expect(ret.body.data).toHaveProperty("deletedIds");
      expect(ret.body.data.deletedIds).toEqual([]);
    }
  );

  it("Should delete and return a single id when removing 2 ids, 1 exists and the other does not", async () => {
    const addedPhotoData = await addPhoto(app);
    const ids = [addedPhotoData.id, "id2"];

    const ret = await request(app).post("/deletePhotosById").send({
      ids: ids,
    });

    expect(ret.statusCode).toBe(200);
    expect(ret.body.ok).toBe(true);
    expect(ret.body).toHaveProperty("data");
    expect(ret.body.data).toHaveProperty("deletedIds");
    expect(ret.body.data.deletedIds).toEqual([addedPhotoData.id]);
  });
});
