import "@tests/helpers/loadEnvFile";
import { mockModules } from "@tests/helpers/mockModules";
mockModules();

import { describe, expect, it } from "@jest/globals";

import { Express } from "express";
import * as exportedTypes from "@src/api/export/exportedTypes";

import { initServer, stopServer } from "@src/server/server";

import * as sac from "@tests/helpers/setupAndCleanup";

import {
  defaultPhoto,
  testPhotoMetaAndId,
  getPhotoById,
  waitForPhotoTransferToFinish,
  testPhotosExistInDbAndDisk,
  getDataFromRet,
  expectErrorCodeToBe,
  testPhotoOriginal,
  expectToBeOk,
  expectToNotBeOk,
} from "@tests/helpers/functions";
import * as imageBase64Parts from "@tests/helpers/imageBase64Parts";
import FilesWaiting from "@src/modules/waitingFiles";

describe("Test 'addPhotoPart' endpoint", () => {
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

  it("Should add the photo after sending all the parts of a photo", async () => {
    const { image64: _, ...photo } = defaultPhoto;

    const requestPhoto = { ...photo, image64Len: imageBase64Parts.photoLen };

    const retInit = await exportedTypes.AddPhotoInitPost(requestPhoto);

    if (!retInit.ok) {
      throw "Error starting photo transfer";
    }

    const id = getDataFromRet(retInit).id;
    expect(FilesWaiting.size).toBe(1);

    let ret = await exportedTypes.AddPhotoPartPost({
      id: id,
      partNumber: 0,
      partSize: imageBase64Parts.photoLenPart1,
      photoPart: imageBase64Parts.photoImage64Part1,
    });

    expectToBeOk(ret);
    expect(ret.warning).toBe(false);

    let data = getDataFromRet(ret);
    expect(data.done).toBe(false);
    expect(data.lenWaiting).toBe(imageBase64Parts.photoLen);
    expect(data.lenReceived).toBe(imageBase64Parts.photoLenPart1);

    ret = await exportedTypes.AddPhotoPartPost({
      id: id,
      partNumber: 1,
      partSize: imageBase64Parts.photoLenPart2,
      photoPart: imageBase64Parts.photoImage64Part2,
    });

    expectToBeOk(ret);
    expect(ret.warning).toBe(false);

    data = getDataFromRet(ret);
    expect(data.done).toBe(false);
    expect(data.lenWaiting).toBe(imageBase64Parts.photoLen);
    expect(data.lenReceived).toBe(
      imageBase64Parts.photoLenPart1 + imageBase64Parts.photoLenPart2
    );

    ret = await exportedTypes.AddPhotoPartPost({
      id: id,
      partNumber: 2,
      partSize: imageBase64Parts.photoLenPart3,
      photoPart: imageBase64Parts.photoImage64Part3,
    });

    expectToBeOk(ret);
    expect(ret.warning).toBe(false);

    data = getDataFromRet(ret);
    expectToBeOk(ret);
    expect(data.lenWaiting).toBe(imageBase64Parts.photoLen);
    expect(data.lenReceived).toBe(imageBase64Parts.photoLen);

    if (!data.done) {
      throw new Error();
    }

    testPhotoMetaAndId(data.photo);
    await testPhotosExistInDbAndDisk(data.photo);

    const getPhoto = await getPhotoById(data.photo.id, "original");
    expect(getPhoto).toBeTruthy();
    testPhotoOriginal(getPhoto, { id: data.photo.id });

    expect(FilesWaiting.size).toBe(0);
  });

  it("Should return error PHOTO_TRANSFER_NOT_FOUND if no transfer was started and sended part", async () => {
    const ret = await exportedTypes.AddPhotoPartPost({
      id: "id",
      partNumber: 0,
      partSize: imageBase64Parts.photoLenPart1,
      photoPart: imageBase64Parts.photoImage64Part1,
    });

    expectToNotBeOk(ret);
    expectErrorCodeToBe(ret, "PHOTO_TRANSFER_NOT_FOUND");
  });

  it("Should return error PHOTO_TRANSFER_NOT_FOUND if started transfer and sended part too late", async () => {
    const { image64: _, ...photo } = defaultPhoto;

    const requestPhoto = { ...photo, image64Len: imageBase64Parts.photoLen };

    const retInit = await exportedTypes.AddPhotoInitPost(requestPhoto);

    if (!retInit.ok) {
      throw "Error starting photo transfer";
    }

    expect(FilesWaiting.size).toBe(1);

    const id = getDataFromRet(retInit).id;

    await waitForPhotoTransferToFinish();

    expect(FilesWaiting.size).toBe(0);

    const ret = await exportedTypes.AddPhotoPartPost({
      id: id,
      partNumber: 0,
      partSize: imageBase64Parts.photoLenPart1,
      photoPart: imageBase64Parts.photoImage64Part1,
    });

    expectToNotBeOk(ret);
    expectErrorCodeToBe(ret, "PHOTO_TRANSFER_NOT_FOUND");

    const getPhoto = await getPhotoById(id, "data");
    expect(getPhoto).toBeFalsy();
  });

  it("Should return error PHOTO_SIZE_EXCEEDED if sended more data in parts than needed", async () => {
    const { image64: _, ...photo } = defaultPhoto;

    const requestPhoto = { ...photo, image64Len: imageBase64Parts.photoLen };

    const retInit = await exportedTypes.AddPhotoInitPost(requestPhoto);

    if (!retInit.ok) {
      throw "Error starting photo transfer";
    }

    expect(FilesWaiting.size).toBe(1);

    const id = getDataFromRet(retInit).id;

    let ret = await exportedTypes.AddPhotoPartPost({
      id: id,
      partNumber: 0,
      partSize: imageBase64Parts.photoLenPart1,
      photoPart: imageBase64Parts.photoImage64Part1,
    });

    expectToBeOk(ret);

    ret = await exportedTypes.AddPhotoPartPost({
      id: id,
      partNumber: 1,
      partSize: imageBase64Parts.photoLenPart1,
      photoPart: imageBase64Parts.photoImage64Part1,
    });

    expectToBeOk(ret);

    ret = await exportedTypes.AddPhotoPartPost({
      id: id,
      partNumber: 2,
      partSize: imageBase64Parts.photoLenPart1,
      photoPart: imageBase64Parts.photoImage64Part1,
    });

    expectToNotBeOk(ret);
    expectErrorCodeToBe(ret, "PHOTO_SIZE_EXCEEDED");

    expect(FilesWaiting.size).toBe(0);
  });

  it("Should return error BAD_REQUEST if partSize not equal to photoPart length", async () => {
    const { image64: _, ...photo } = defaultPhoto;

    const requestPhoto = { ...photo, image64Len: imageBase64Parts.photoLen };

    const retInit = await exportedTypes.AddPhotoInitPost(requestPhoto);

    if (!retInit.ok) {
      throw "Error starting photo transfer";
    }

    const id = getDataFromRet(retInit).id;

    const ret = await exportedTypes.AddPhotoPartPost({
      id: id,
      partNumber: 0,
      partSize: imageBase64Parts.photoLenPart1 + 1,
      photoPart: imageBase64Parts.photoImage64Part1,
    });

    expectToNotBeOk(ret);
    expectErrorCodeToBe(ret, "BAD_REQUEST");
  });

  it("Should return error MISSING_PARTS if added all parts but a number is missing", async () => {
    const { image64: _, ...photo } = defaultPhoto;

    const requestPhoto = { ...photo, image64Len: imageBase64Parts.photoLen };

    const retInit = await exportedTypes.AddPhotoInitPost(requestPhoto);

    if (!retInit.ok) {
      throw "Error starting photo transfer";
    }

    const id = getDataFromRet(retInit).id;

    expect(FilesWaiting.size).toBe(1);

    let ret = await exportedTypes.AddPhotoPartPost({
      id: id,
      partNumber: 0,
      partSize: imageBase64Parts.photoLenPart1,
      photoPart: imageBase64Parts.photoImage64Part1,
    });

    expectToBeOk(ret);

    ret = await exportedTypes.AddPhotoPartPost({
      id: id,
      partNumber: 1,
      partSize: imageBase64Parts.photoLenPart2,
      photoPart: imageBase64Parts.photoImage64Part2,
    });

    expectToBeOk(ret);

    ret = await exportedTypes.AddPhotoPartPost({
      id: id,
      partNumber: 3,
      partSize: imageBase64Parts.photoLenPart3,
      photoPart: imageBase64Parts.photoImage64Part3,
    });

    expectToNotBeOk(ret);
    expectErrorCodeToBe(ret, "MISSING_PARTS");

    const getPhoto = await getPhotoById(id, "original");
    expect(getPhoto).toBeFalsy();

    expect(FilesWaiting.size).toBe(0);
  });
});
