import { expect } from "@jest/globals";

import { validate } from "uuid";
import jwt from "jsonwebtoken";

import { photoImage64 } from "@tests/helpers/imageBase64";
import { postPhotoPartTimeout } from "@src/config/config";
import { timeout } from "@src/modules/functions";
import { verifyUserToken } from "@src/modules/tokenManagement";
import fs from "fs/promises";
import { pathExists } from "@src/modules/diskManager";

import * as dbFunction from "@src/db/sequelizeDb";

import * as exportedTypes from "@src/api/export/exportedTypes";

import {
  GetServerConfigData,
  SaveServerCredentials,
} from "@src/modules/serverDataManager";

import * as mockValues from "@src/modules/__mocks__/backendRequestsMockValues";
import { Photo } from "@src/db/sequelizeDb";
import {
  GetLastWarningForUser,
  HasWarningForUser,
} from "@src/modules/warningsManager";
import { PhotoTypes } from "@src/api/export/exportedTypes";

let serverUserToken = "";

const defaultPhoto = {
  name: "image.jpg",
  fileSize: 1000,
  width: 1500,
  height: 1000,
  path: "/path/to/image.jpg",
  date: "2022-12-11T17:05:21.396Z",
  image64: photoImage64,
  deviceUniqueId: "0123456789",
};

async function addPhoto(data?: {
  path?: string;
  name?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  date?: string;
  image64?: string;
  deviceUniqueId?: string;
}) {
  const ret = await exportedTypes.AddPhotoPost({
    name: data?.name ?? defaultPhoto.name,
    fileSize: data?.fileSize ?? defaultPhoto.fileSize,
    width: data?.width ?? defaultPhoto.width,
    height: data?.height ?? defaultPhoto.height,
    path: data?.path ?? defaultPhoto.path,
    date: data?.date ?? defaultPhoto.date,
    image64: data?.image64 ?? defaultPhoto.image64,
    deviceUniqueId: data?.deviceUniqueId ?? defaultPhoto.deviceUniqueId,
  });

  if (!ret.ok) {
    throw "Error adding photo";
  }

  return {
    id: ret.data.photo.id,
    path: data?.path ?? defaultPhoto.path,
  };
}

async function addNPhotos(n: number) {
  const ret: { id: string; path: string }[] = [];
  for (let i = 0; i < n; i++) {
    const photoAddedData = await addPhoto({
      path: "/path/to/image" + i.toString() + ".jpg",
    });
    ret.push(photoAddedData);
  }
  return ret;
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

async function testPhotosExistInDbAndDisk(photo: exportedTypes.APIPhoto) {
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
  photo: exportedTypes.APIPhoto,
  data?: {
    deviceUniqueId?: string;
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

  expect(photo.meta.clientPaths.length).toBe(1);
  expect(photo.meta.clientPaths[0].deviceUniqueId).toBe(
    data?.deviceUniqueId ?? defaultPhoto.deviceUniqueId
  );
  expect(photo.meta.clientPaths[0].path).toBe(data?.path ?? defaultPhoto.path);

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
  photo?: exportedTypes.APIPhoto,
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
  if (!photo) {
    throw new Error("testPhotoOriginal: no photo to test");
  }
  testPhotoMetaAndId(photo, data);

  expect(photo.image64).toBe(image64 ?? defaultPhoto.image64);
}

function testPhotoCompressed(
  photo: exportedTypes.APIPhoto,
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
  photo: exportedTypes.APIPhoto,
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
  photo: exportedTypes.APIPhoto,
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

async function checkPhotoExists(id: string) {
  const ret = await exportedTypes.GetPhotosByIdPost({
    ids: [id],
    photoType: "data",
  });

  if (!ret.ok) {
    throw "Error checking photo exists";
  }

  return ret.data.photos[0].exists;
}

async function getPhotoById(id: string, photoType?: PhotoTypes) {
  const ret = await exportedTypes.GetPhotosByIdPost({
    ids: [id],
    photoType: photoType ?? "data",
  });

  if (!ret.ok) {
    throw "Error checking photo exists";
  }

  if (!ret.data.photos[0].exists) {
    return;
  }

  return ret.data.photos[0].photo;
}

async function getNumberPhotos() {
  const ret = await exportedTypes.GetNumberPhotosPost();

  if (!ret.ok) {
    throw "Error checking photo exists";
  }

  return ret.data.number;
}

async function waitForPhotoTransferToFinish() {
  await timeout(postPhotoPartTimeout + 100);
}

function testReturnedToken() {
  const serverData = GetServerConfigData();

  if (!serverData.serverKey) {
    throw new Error(
      "testReturnedToken: serverData.serverKey needs to be defined"
    );
  }

  expect(exportedTypes.HasUserToken()).toBe(true);

  const userTokenRetured = exportedTypes.GetUserToken();

  const tokenVerification = verifyUserToken(
    userTokenRetured,
    serverData.serverKey
  );
  expect(tokenVerification.ok).toBe(true);
  expect(
    (tokenVerification as typeof tokenVerification & { ok: true }).data.id
  ).toBeDefined();
}

async function setupServerClaimed() {
  SaveServerCredentials({
    serverId: mockValues.serverId,
    serverKey: mockValues.validKey,
  });
}

async function setupServerUserToken() {
  setupServerClaimed();
  const ret = await exportedTypes.GetTokenPost({
    userToken: mockValues.validUserToken,
  });

  if (!exportedTypes.HasUserToken()) {
    throw new Error(
      "Error setting up server to generate user token:\n " + JSON.stringify(ret)
    );
  }
  serverUserToken = exportedTypes.GetUserToken();
}

function serverTokenHeader() {
  if (serverUserToken) {
    return { Authorization: "Bearer " + serverUserToken };
  }
  throw new Error("No serverUserToken to use in serverTokenHeader()");
}

function getUserId() {
  if (!serverUserToken) {
    throw new Error("No serverUserToken to use in getUserId()");
  }
  const serverData = GetServerConfigData();
  if (!serverData.serverKey) {
    throw new Error("getUserId: serverData.serverKey needs to be defined");
  }

  const tokenVerification = verifyUserToken(
    serverUserToken,
    serverData.serverKey
  );

  if (!tokenVerification.ok) {
    throw new Error("getUserId: token verification failed");
  }
  return tokenVerification.data.id;
}

function getExpiredToken() {
  const expiredToken = jwt.sign({}, mockValues.validKey, {
    expiresIn: 0,
  });

  return expiredToken;
}

function randomTokenHeader() {
  return { Authorization: "Bearer serverUserToken" };
}

function testWarning(dbPhoto: Photo) {
  expect(HasWarningForUser(getUserId())).toBe(true);

  const warning = GetLastWarningForUser(getUserId());
  expect(warning).toBeTruthy();

  if (!warning) {
    throw new Error("warning should be defined");
  }

  expect(warning.code).toBe("PHOTOS_NOT_ON_DISK_DELETED");
  expect(warning.data).toHaveProperty("photosDeleted");
  expect(warning.data.photosDeleted.length).toBe(1);

  expect(warning.data.photosDeleted[0].id).toBe(dbPhoto.id);
}

function getDataFromRet<T extends { ok: boolean; data?: any }>(o: T) {
  type DataType = T extends { data: infer S } ? S : never;

  if (!o.ok) {
    throw new Error("getDataFromRet: ok is false, cannot get data");
  }
  return o.data as DataType;
}

function expectToBeOk<T extends { ok: boolean }>(o: T) {
  expect(o.ok).toBe(true);
}

function expectToNotBeOk<T extends { ok: boolean }>(o: T) {
  expect(o.ok).toBe(false);
}

function expectErrorCodeToBe<
  T extends { ok: boolean; errorCode?: exportedTypes.ErrorCodes }
>(o: T, errorCode: exportedTypes.ErrorCodes) {
  expect(o.errorCode).toBe(errorCode);
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
  setupServerClaimed,
  setupServerUserToken,
  serverUserToken,
  serverTokenHeader,
  getExpiredToken,
  randomTokenHeader,
  getPhotoFromDb,
  testPhotosExistInDbAndDisk,
  testPhotoNotInDbNorDisk,
  deletePhotoFromDisk,
  getUserId,
  testWarning,
  getDataFromRet,
  expectToBeOk,
  expectToNotBeOk,
  expectErrorCodeToBe,
};
