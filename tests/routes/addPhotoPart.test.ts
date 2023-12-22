import "@tests/helpers/loadEnvFile";
import { describe, expect, it } from "@jest/globals";
import request from "supertest";
import { Express } from "express";

import { mockModules } from "@tests/helpers/mockModules";
mockModules();

import mockFsVolumeReset from "@tests/helpers/mockFsVolumeReset";
import { initServer, stopServer, clearFilesWaiting } from "@src/server/server";
import { openAndInitDB } from "@src/db/sequelizeDb";
import { clearDB } from "@src/db/sequelizeDb";
import { clearImagesDisk } from "@src/modules/diskManager";
import {
  defaultPhoto,
  testPhotoMetaAndId,
  getPhotoById,
  addPhoto,
  waitForPhotoTransferToFinish,
} from "@tests/helpers/functions";
import * as imageBase64Parts from "@tests/helpers/imageBase64Parts";
import FilesWaiting from "@src/modules/waitingFiles";
import {
  setupServerUserToken,
  serverTokenHeader,
} from "@tests/helpers/functions";

describe("Test 'addPhotoPart' endpoint", () => {
  let app: Express;

  beforeAll(async () => {
    app = await initServer();
  });

  afterAll(async () => {
    stopServer();
  });

  beforeEach(async () => {
    await openAndInitDB();
    mockFsVolumeReset();
    await setupServerUserToken(app);
  });

  afterEach(async () => {
    await clearDB();
    await clearImagesDisk();
    await clearFilesWaiting();
  });

  it("Should add the photo after sending all the parts of a photo", async () => {
    const photo = { ...defaultPhoto } as any;
    delete photo.image64;

    const requestPhoto = { ...photo, image64Len: imageBase64Parts.photoLen };

    const retInit = await request(app)
      .post("/addPhotoInit")
      .set(serverTokenHeader())
      .send(requestPhoto);

    if (!retInit.ok) {
      throw "Error starting photo transfer";
    }

    const id = retInit.body.data.id;
    expect(FilesWaiting.size).toBe(1);

    let ret = await request(app)
      .post("/addPhotoPart")
      .set(serverTokenHeader())
      .send({
        id: id,
        partNumber: 0,
        partSize: imageBase64Parts.photoLenPart1,
        photoPart: imageBase64Parts.photoImage64Part1,
      });

    expect(ret.statusCode).toBe(200);
    expect(ret.body.ok).toBe(true);
    expect(ret.body).toHaveProperty("data");
    expect(ret.body.data.lenWaiting).toBe(imageBase64Parts.photoLen);
    expect(ret.body.data.lenReceived).toBe(imageBase64Parts.photoLenPart1);

    ret = await request(app)
      .post("/addPhotoPart")
      .set(serverTokenHeader())
      .send({
        id: id,
        partNumber: 1,
        partSize: imageBase64Parts.photoLenPart2,
        photoPart: imageBase64Parts.photoImage64Part2,
      });

    expect(ret.statusCode).toBe(200);
    expect(ret.body.ok).toBe(true);
    expect(ret.body).toHaveProperty("data");
    expect(ret.body.data.lenWaiting).toBe(imageBase64Parts.photoLen);
    expect(ret.body.data.lenReceived).toBe(
      imageBase64Parts.photoLenPart1 + imageBase64Parts.photoLenPart2
    );

    ret = await request(app)
      .post("/addPhotoPart")
      .set(serverTokenHeader())
      .send({
        id: id,
        partNumber: 2,
        partSize: imageBase64Parts.photoLenPart3,
        photoPart: imageBase64Parts.photoImage64Part3,
      });

    expect(ret.statusCode).toBe(200);
    expect(ret.body.ok).toBe(true);
    expect(ret.body).toHaveProperty("data");
    expect(ret.body.data).toHaveProperty("photo");
    expect(ret.body.data.lenWaiting).toBe(imageBase64Parts.photoLen);
    expect(ret.body.data.lenReceived).toBe(imageBase64Parts.photoLen);

    testPhotoMetaAndId(ret.body.data.photo);

    const getPhoto = await getPhotoById(app, id, "original");

    expect(getPhoto).toBeTruthy();
    expect(getPhoto.id).toBe(ret.body.data.photo.id);
    expect(getPhoto.meta.name).toBe(defaultPhoto.name);
    expect(getPhoto.meta.fileSize).toBe(defaultPhoto.fileSize);
    expect(getPhoto.meta.width).toBe(defaultPhoto.width);
    expect(getPhoto.meta.height).toBe(defaultPhoto.height);
    expect(getPhoto.meta.clientPath).toBe(defaultPhoto.path);
    expect(getPhoto.meta.date).toBe(defaultPhoto.date);
    expect(getPhoto.image64).toBe(defaultPhoto.image64);

    expect(FilesWaiting.size).toBe(0);
  });

  it("Should return error PHOTO_TRANSFER_NOT_FOUND if no transfer was started and sended part", async () => {
    let ret = await request(app)
      .post("/addPhotoPart")
      .set(serverTokenHeader())
      .send({
        id: "id",
        partNumber: 0,
        partSize: imageBase64Parts.photoLenPart1,
        photoPart: imageBase64Parts.photoImage64Part1,
      });

    expect(ret.statusCode).toBe(400);
    expect(ret.body.ok).toBe(false);
    expect(ret.body.errorCode).toBe("PHOTO_TRANSFER_NOT_FOUND");
  });

  it("Should return error PHOTO_TRANSFER_NOT_FOUND if started transfer and sended part too late", async () => {
    const photo = { ...defaultPhoto } as any;
    delete photo.image64;

    const requestPhoto = { ...photo, image64Len: imageBase64Parts.photoLen };

    const retInit = await request(app)
      .post("/addPhotoInit")
      .set(serverTokenHeader())
      .send(requestPhoto);

    if (!retInit.ok) {
      throw "Error starting photo transfer";
    }

    const id = retInit.body.data.id;
    expect(FilesWaiting.size).toBe(1);

    await waitForPhotoTransferToFinish();

    expect(FilesWaiting.size).toBe(0);

    let ret = await request(app)
      .post("/addPhotoPart")
      .set(serverTokenHeader())
      .send({
        id: id,
        partNumber: 0,
        partSize: imageBase64Parts.photoLenPart1,
        photoPart: imageBase64Parts.photoImage64Part1,
      });

    expect(ret.statusCode).toBe(400);
    expect(ret.body.ok).toBe(false);
    expect(ret.body.errorCode).toBe("PHOTO_TRANSFER_NOT_FOUND");

    const getPhoto = await getPhotoById(app, id, "data");

    expect(getPhoto).toBe(false);
  });

  it("Should return error PHOTO_SIZE_EXCEEDED if sended more data in parts than needed", async () => {
    const photo = { ...defaultPhoto } as any;
    delete photo.image64;

    const requestPhoto = { ...photo, image64Len: imageBase64Parts.photoLen };

    const retInit = await request(app)
      .post("/addPhotoInit")
      .set(serverTokenHeader())
      .send(requestPhoto);

    if (!retInit.ok) {
      throw "Error starting photo transfer";
    }

    const id = retInit.body.data.id;
    expect(FilesWaiting.size).toBe(1);

    let ret = await request(app)
      .post("/addPhotoPart")
      .set(serverTokenHeader())
      .send({
        id: id,
        partNumber: 0,
        partSize: imageBase64Parts.photoLenPart1,
        photoPart: imageBase64Parts.photoImage64Part1,
      });

    expect(ret.statusCode).toBe(200);
    expect(ret.body.ok).toBe(true);

    ret = await request(app)
      .post("/addPhotoPart")
      .set(serverTokenHeader())
      .send({
        id: id,
        partNumber: 1,
        partSize: imageBase64Parts.photoLenPart1,
        photoPart: imageBase64Parts.photoImage64Part1,
      });

    expect(ret.statusCode).toBe(200);
    expect(ret.body.ok).toBe(true);

    ret = await request(app)
      .post("/addPhotoPart")
      .set(serverTokenHeader())
      .send({
        id: id,
        partNumber: 2,
        partSize: imageBase64Parts.photoLenPart1,
        photoPart: imageBase64Parts.photoImage64Part1,
      });

    expect(ret.statusCode).toBe(400);
    expect(ret.body.ok).toBe(false);
    expect(ret.body.errorCode).toBe("PHOTO_SIZE_EXCEEDED");

    expect(FilesWaiting.size).toBe(0);
  });

  it("Should return error BAD_REQUEST if partSize not equal to photoPart length", async () => {
    const photo = { ...defaultPhoto } as any;
    delete photo.image64;

    const requestPhoto = { ...photo, image64Len: imageBase64Parts.photoLen };

    const retInit = await request(app)
      .post("/addPhotoInit")
      .set(serverTokenHeader())
      .send(requestPhoto);

    if (!retInit.ok) {
      throw "Error starting photo transfer";
    }

    const id = retInit.body.data.id;

    let ret = await request(app)
      .post("/addPhotoPart")
      .set(serverTokenHeader())
      .send({
        id: id,
        partNumber: 0,
        partSize: imageBase64Parts.photoLenPart1 + 1,
        photoPart: imageBase64Parts.photoImage64Part1,
      });

    expect(ret.statusCode).toBe(400);
    expect(ret.body.ok).toBe(false);
    expect(ret.body.errorCode).toBe("BAD_REQUEST");
  });

  it("Should return error MISSING_PARTS if added all parts but a number is missing", async () => {
    const photo = { ...defaultPhoto } as any;
    delete photo.image64;

    const requestPhoto = { ...photo, image64Len: imageBase64Parts.photoLen };

    const retInit = await request(app)
      .post("/addPhotoInit")
      .set(serverTokenHeader())
      .send(requestPhoto);

    if (!retInit.ok) {
      throw "Error starting photo transfer";
    }

    const id = retInit.body.data.id;
    expect(FilesWaiting.size).toBe(1);

    let ret = await request(app)
      .post("/addPhotoPart")
      .set(serverTokenHeader())
      .send({
        id: id,
        partNumber: 0,
        partSize: imageBase64Parts.photoLenPart1,
        photoPart: imageBase64Parts.photoImage64Part1,
      });

    expect(ret.statusCode).toBe(200);
    expect(ret.body.ok).toBe(true);

    ret = await request(app)
      .post("/addPhotoPart")
      .set(serverTokenHeader())
      .send({
        id: id,
        partNumber: 1,
        partSize: imageBase64Parts.photoLenPart2,
        photoPart: imageBase64Parts.photoImage64Part2,
      });

    expect(ret.statusCode).toBe(200);
    expect(ret.body.ok).toBe(true);

    ret = await request(app)
      .post("/addPhotoPart")
      .set(serverTokenHeader())
      .send({
        id: id,
        partNumber: 3,
        partSize: imageBase64Parts.photoLenPart3,
        photoPart: imageBase64Parts.photoImage64Part3,
      });

    expect(ret.statusCode).toBe(400);
    expect(ret.body.ok).toBe(false);
    expect(ret.body.errorCode).toBe("MISSING_PARTS");

    const getPhoto = await getPhotoById(app, id, "original");

    expect(getPhoto).toBeFalsy();

    expect(FilesWaiting.size).toBe(0);
  });

  it("Should return error PHOTO_EXISTS if a photo with same path was added while adding photo parts", async () => {
    const photo = { ...defaultPhoto } as any;
    delete photo.image64;

    const requestPhoto = { ...photo, image64Len: imageBase64Parts.photoLen };

    const retInit = await request(app)
      .post("/addPhotoInit")
      .set(serverTokenHeader())
      .send(requestPhoto);

    if (!retInit.ok) {
      throw "Error starting photo transfer";
    }

    const id = retInit.body.data.id;
    expect(FilesWaiting.size).toBe(1);

    let ret = await request(app)
      .post("/addPhotoPart")
      .set(serverTokenHeader())
      .send({
        id: id,
        partNumber: 0,
        partSize: imageBase64Parts.photoLenPart1,
        photoPart: imageBase64Parts.photoImage64Part1,
      });

    expect(ret.statusCode).toBe(200);
    expect(ret.body.ok).toBe(true);

    ret = await request(app)
      .post("/addPhotoPart")
      .set(serverTokenHeader())
      .send({
        id: id,
        partNumber: 1,
        partSize: imageBase64Parts.photoLenPart2,
        photoPart: imageBase64Parts.photoImage64Part2,
      });

    expect(ret.statusCode).toBe(200);
    expect(ret.body.ok).toBe(true);

    const addedPhotoData = await addPhoto(app);

    ret = await request(app)
      .post("/addPhotoPart")
      .set(serverTokenHeader())
      .send({
        id: id,
        partNumber: 2,
        partSize: imageBase64Parts.photoLenPart3,
        photoPart: imageBase64Parts.photoImage64Part3,
      });

    expect(ret.statusCode).toBe(400);
    expect(ret.body.ok).toBe(false);
    expect(ret.body.errorCode).toBe("PHOTO_EXISTS");

    const getPhoto = await getPhotoById(app, addedPhotoData.id, "data");

    expect(getPhoto).toBeTruthy();

    expect(FilesWaiting.size).toBe(0);
  });
});
