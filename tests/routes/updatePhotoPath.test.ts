import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { Express } from "express";

import { initServer, stopServer, clearFilesWaiting } from "@src/server/server";
import { openAndInitDB } from "@src/db/sequelizeDb";
import { clearDB } from "@src/db/sequelizeDb";
import { clearImagesDisk } from "@src/modules/diskManager";
import { addNPhotos, addPhoto, getPhotoById } from "@tests/helpers/functions";

describe("Test 'updatePhotoPath' endpoint", () => {
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

  it("Should change the path of photo after adding the photo", async () => {
    const addedPhotoData = await addPhoto(app);

    const ret = await request(app).post("/updatePhotoPath").send({
      id: addedPhotoData.id,
      path: "newPath",
    });

    expect(ret.statusCode).toBe(200);
    expect(ret.body.ok).toBe(true);

    const photo = await getPhotoById(app, addedPhotoData.id);
    expect(photo.meta.clientPath).toBe("newPath");
  });

  it("Should return error ID_NOT_FOUND when request id not in db", async () => {
    const ret = await request(app).post("/updatePhotoPath").send({
      id: "id",
      path: "newPath",
    });

    expect(ret.statusCode).toBe(400);
    expect(ret.body.ok).toBe(false);
    expect(ret.body.errorCode).toBe("ID_NOT_FOUND");
  });

  it("Should change the path of photo after adding the photo", async () => {
    const addedPhotosData = await addNPhotos(app, 2);

    const ret = await request(app).post("/updatePhotoPath").send({
      id: addedPhotosData[0].id,
      path: addedPhotosData[1].path,
    });

    expect(ret.statusCode).toBe(400);
    expect(ret.body.ok).toBe(false);
    expect(ret.body.errorCode).toBe("PATH_EXISTS");

    const photo = await getPhotoById(app, addedPhotosData[0].id);
    expect(photo.meta.clientPath).toBe(addedPhotosData[0].path);
  });
});
