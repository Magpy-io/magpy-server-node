import request from "supertest";
import { expect } from "@jest/globals";
import { Express } from "express";
import { validate } from "uuid";
import jwt from "jsonwebtoken";

import { photoImage64 } from "@tests/helpers/imageBase64";
import { postPhotoPartTimeout } from "@src/config/config";
import { timeout } from "@src/modules/functions";
import { verifyUserToken } from "@src/modules/tokenManagement";
import fs from "fs/promises";
import { pathExists } from "@src/modules/diskManager";

import * as dbFunction from "@src/db/sequelizeDb";

import {
  GetServerConfigData,
  SaveServerCredentials,
} from "@src/modules/serverDataManager";

import * as mockValues from "@src/modules/__mocks__/backendRequestsMockValues";
import { Photo, PhotoTypes } from "@src/types/photoType";

let serverUserToken = "";

const defaultPhoto = {
  name: "image.jpg",
  fileSize: 1000,
  width: 1500,
  height: 1000,
  path: "/path/to/image.jpg",
  date: "2022-12-11T17:05:21.396Z",
  image64: photoImage64,
};

async function addPhoto(
  app: Express,
  data?: {
    path?: string;
    name?: string;
    fileSize?: number;
    width?: number;
    height?: number;
    date?: string;
    image64?: string;
  }
) {
  const ret = await request(app)
    .post("/addPhoto")
    .set(serverTokenHeader())
    .send({
      name: data?.name ?? defaultPhoto.name,
      fileSize: data?.fileSize ?? defaultPhoto.fileSize,
      width: data?.width ?? defaultPhoto.width,
      height: data?.height ?? defaultPhoto.height,
      path: data?.path ?? defaultPhoto.path,
      date: data?.date ?? defaultPhoto.date,
      image64: data?.image64 ?? defaultPhoto.image64,
    });

  if (!ret.body.ok) {
    throw "Error adding photo";
  }

  return {
    id: ret.body.data.photo.id,
    path: data?.path ?? defaultPhoto.path,
  };
}

async function addNPhotos(app: Express, n: number) {
  const ids: { id: string; path: string }[] = [];
  for (let i = 0; i < n; i++) {
    const photoAddedData = await addPhoto(app, {
      path: "/path/to/image" + i.toString() + ".jpg",
    });
    ids.push(photoAddedData);
  }
  return ids;
}

async function deletePhotoFromDisk(photo: Photo, photoType: PhotoTypes) {
  if (photoType == "thumbnail") {
    await fs.rm(photo.serverThumbnailPath, { force: true });
  }

  if (photoType == "compressed") {
    await fs.rm(photo.serverCompressedPath, { force: true });
  }

  if (photoType == "original") {
    await fs.rm(photo.serverPath, { force: true });
  }
}

async function getPhotoFromDb(id: string) {
  const dbPhoto = await dbFunction.getPhotoByIdFromDB(id);

  if (!dbPhoto) {
    throw new Error("Photo not found in db");
  }

  return dbPhoto;
}

async function testPhotoNotInDbNorDisk(photo: Photo) {
  const dbPhoto = await dbFunction.getPhotoByIdFromDB(photo.id);

  expect(dbPhoto).toBeFalsy();

  const originalExists = await pathExists(photo.serverPath);
  const compressedExists = await pathExists(photo.serverCompressedPath);
  const thumbnailExists = await pathExists(photo.serverThumbnailPath);

  expect(originalExists).toBe(false);
  expect(compressedExists).toBe(false);
  expect(thumbnailExists).toBe(false);
}

async function testPhotosExistInDbAndDisk(photo: any) {
  const dbPhoto = await dbFunction.getPhotoByIdFromDB(photo.id);

  expect(dbPhoto).toBeTruthy();
  if (!dbPhoto) {
    throw new Error("dbPhoto expected to be thruthy");
  }

  const originalExists = await pathExists(dbPhoto.serverPath);
  const compressedExists = await pathExists(dbPhoto.serverCompressedPath);
  const thumbnailExists = await pathExists(dbPhoto.serverThumbnailPath);

  expect(originalExists).toBe(true);
  expect(compressedExists).toBe(true);
  expect(thumbnailExists).toBe(true);
}

function testPhotoMetaAndId(
  photo: any,
  data?: {
    path?: string;
    name?: string;
    fileSize?: number;
    width?: number;
    height?: number;
    date?: string;
    id?: string;
  }
) {
  const validID = validate(photo.id);
  expect(validID).toBe(true);

  if (data?.id) {
    expect(photo.id).toBe(data.id);
  }

  expect(photo.meta.clientPath).toBe(data?.path ?? defaultPhoto.path);
  expect(photo.meta.name).toBe(data?.name ?? defaultPhoto.name);
  expect(photo.meta.fileSize).toBe(data?.fileSize ?? defaultPhoto.fileSize);
  expect(photo.meta.width).toBe(data?.width ?? defaultPhoto.width);
  expect(photo.meta.height).toBe(data?.height ?? defaultPhoto.height);
  expect(photo.meta.date).toBe(data?.date ?? defaultPhoto.date);

  // Less than 10 seconds (arbitrary duration to test it's recent) since photo added
  const sync = new Date(photo.meta.syncDate);
  expect(Date.now() - sync.getTime()).toBeLessThan(10000);
}

function testPhotoOriginal(
  photo: any,
  data?: {
    path?: string;
    name?: string;
    fileSize?: number;
    width?: number;
    height?: number;
    date?: string;
    id?: string;
  },
  image64?: string
) {
  testPhotoMetaAndId(photo, data);

  expect(photo.image64).toBe(image64 ?? photoImage64);
}

function testPhotoCompressed(
  photo: any,
  data?: {
    path?: string;
    name?: string;
    fileSize?: number;
    width?: number;
    height?: number;
    date?: string;
    id?: string;
  },
  image64?: string
) {
  testPhotoMetaAndId(photo, data);

  expect(photo.image64.length).toBeLessThan(
    image64?.length ?? photoImage64.length
  );
}

function testPhotoThumbnail(
  photo: any,
  data?: {
    path?: string;
    name?: string;
    fileSize?: number;
    width?: number;
    height?: number;
    date?: string;
    id?: string;
  },
  image64?: string
) {
  testPhotoMetaAndId(photo, data);

  expect(photo.image64.length).toBeLessThan(
    image64?.length ?? photoImage64.length
  );
}

function testPhotoData(
  photo: any,
  data?: {
    path?: string;
    name?: string;
    fileSize?: number;
    width?: number;
    height?: number;
    date?: string;
    id?: string;
  }
) {
  testPhotoMetaAndId(photo, data);

  expect(photo.image64).toBe("");
}

async function checkPhotoExists(app: Express, id: string) {
  const ret = await request(app)
    .post("/getPhotosById")
    .set(serverTokenHeader())
    .send({
      ids: [id],
      photoType: "data",
    });

  if (!ret.body.ok) {
    throw "Error checking photo exists";
  }

  return ret.body.data.photos[0].exists;
}

async function getPhotoById(app: Express, id: string, photoType?: string) {
  const ret = await request(app)
    .post("/getPhotosById")
    .set(serverTokenHeader())
    .send({ ids: [id], photoType: photoType ?? "data" });

  if (!ret.body.ok) {
    throw "Error checking photo exists";
  }

  if (!ret.body.data.photos[0].exists) {
    return false;
  }

  return ret.body.data.photos[0].photo;
}

async function getNumberPhotos(app: Express) {
  const ret = await request(app)
    .post("/getNumberPhotos")
    .set(serverTokenHeader())
    .send({});

  if (!ret.body.ok) {
    throw "Error checking photo exists";
  }

  return ret.body.data.number;
}

async function waitForPhotoTransferToFinish() {
  await timeout(postPhotoPartTimeout + 100);
}

function testReturnedToken(ret: request.Response) {
  const serverData = GetServerConfigData();
  expect(ret.headers["authorization"]).toBeDefined();
  const auth = ret.headers["authorization"];
  const splited = auth.split(" ");
  expect(splited.length).toBe(2);
  expect(splited[0]).toBe("Bearer");
  if (!serverData.serverKey) {
    throw new Error(
      "testReturnedToken: serverData.serverKey needs to be defined"
    );
  }
  const tokenVerification = verifyUserToken(splited[1], serverData.serverKey);
  expect(tokenVerification.ok).toBe(true);
  expect(
    (tokenVerification as typeof tokenVerification & { ok: true }).data.id
  ).toBeDefined();
}

async function setupServerUserToken(app: Express) {
  SaveServerCredentials({
    serverId: mockValues.serverId,
    serverKey: mockValues.validKey,
  });

  const ret = await request(app)
    .post("/getToken")
    .send({ userToken: mockValues.validUserToken });

  if (!ret.body.ok || !ret.headers["authorization"]) {
    throw new Error(
      "Error setting up server to generate user token:\n " +
        JSON.stringify(ret.body)
    );
  }
  serverUserToken = ret.headers["authorization"].split(" ")[1];
}

function serverTokenHeader() {
  if (serverUserToken) {
    return { Authorization: "Bearer " + serverUserToken };
  }

  throw new Error("No serverUserToken to use in serverTokenHeader()");
}

function expiredTokenHeader() {
  const expiredToken = jwt.sign({}, mockValues.validKey, {
    expiresIn: 0,
  });

  return { Authorization: "Bearer " + expiredToken };
}

function randomTokenHeader() {
  return { Authorization: "Bearer serverUserToken" };
}

export {
  addPhoto,
  addNPhotos,
  testPhotoOriginal,
  testPhotoCompressed,
  testPhotoThumbnail,
  testPhotoData,
  checkPhotoExists,
  getPhotoById,
  testPhotoMetaAndId,
  getNumberPhotos,
  waitForPhotoTransferToFinish,
  defaultPhoto,
  testReturnedToken,
  setupServerUserToken,
  serverUserToken,
  serverTokenHeader,
  expiredTokenHeader,
  randomTokenHeader,
  getPhotoFromDb,
  testPhotosExistInDbAndDisk,
  testPhotoNotInDbNorDisk,
  deletePhotoFromDisk,
};
