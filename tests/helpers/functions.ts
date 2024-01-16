import { expect } from "@jest/globals";

import { validate } from "uuid";
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import { photoImage64 } from "@tests/helpers/imageBase64";
import { postPhotoPartTimeout } from "@src/config/config";
import { timeout } from "@src/modules/functions";
import { verifyUserToken } from "@src/modules/tokenManagement";
import fs from "fs/promises";
import { pathExists } from "@src/modules/diskManager";

import * as dbFunction from "@src/db/sequelizeDb";

import {
  AddPhoto,
  GetPhotosById,
  GetToken,
  UpdatePhotoPath,
  GetNumberPhotos,
} from "@src/api/export/";

import { GetUserToken, HasUserToken } from "@src/api/export/UserTokenManager";
import { PhotoTypes, APIPhoto } from "@src/api/export/Types";
import { ErrorCodes } from "@src/api/export/Types/ErrorTypes";

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

let serverUserToken = "";

const defaultPhoto = {
  name: "image.jpg",
  fileSize: 1000,
  width: 1500,
  height: 1000,
  path: "/path/to/image.jpg",
  date: "2022-12-11T17:05:21.396Z",
  image64: photoImage64,
  deviceUniqueId: "fe2e61bd-31e2-4896-b121-1124fa561344",
};

const defaultPhotoSecondPath = {
  path: "/new/path/to/image.jpg",
  deviceUniqueId: "6b065dcf-782b-4203-8b59-06d81242fac0",
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
  const ret = await AddPhoto.Post({
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

async function testPhotosExistInDbAndDisk(photo: APIPhoto) {
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

type testPhotoMetaAndIdDataType = {
  deviceUniqueId?: string;
  path?: string;
  name?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  date?: string;
  id?: string;
};

function testPhotoMetaAndId(
  photo: APIPhoto,
  data?: testPhotoMetaAndIdDataType
) {
  testPhotoMetaAndIdWithAdditionalPaths(photo, [], data);
}

function testPhotoMetaAndIdWithAdditionalPaths(
  photo: APIPhoto,
  additionalPaths: { path: string; deviceUniqueId: string }[],
  data?: testPhotoMetaAndIdDataType
) {
  const validID = validate(photo.id);
  expect(validID).toBe(true);

  if (data?.id) {
    expect(photo.id).toBe(data.id);
  }

  expect(photo.meta.name).toBe(data?.name ?? defaultPhoto.name);
  expect(photo.meta.fileSize).toBe(data?.fileSize ?? defaultPhoto.fileSize);
  expect(photo.meta.width).toBe(data?.width ?? defaultPhoto.width);
  expect(photo.meta.height).toBe(data?.height ?? defaultPhoto.height);
  expect(photo.meta.date).toBe(data?.date ?? defaultPhoto.date);

  // Less than 10 seconds (arbitrary duration to test it's recent) since photo added
  const sync = new Date(photo.meta.syncDate);
  expect(Date.now() - sync.getTime()).toBeLessThan(10000);

  //test paths

  const pathsToTest = [
    {
      path: data?.path ?? defaultPhoto.path,
      deviceUniqueId: data?.deviceUniqueId ?? defaultPhoto.deviceUniqueId,
    },
    ...additionalPaths,
  ];

  expect(photo.meta.clientPaths.length).toBe(pathsToTest.length);

  for (let i = 0; i < pathsToTest.length; i++) {
    expect(photo.meta.clientPaths[i].path).toBe(pathsToTest[i].path);
    expect(photo.meta.clientPaths[i].deviceUniqueId).toBe(
      pathsToTest[i].deviceUniqueId
    );
  }
}

function testPhotoOriginal(
  photo?: APIPhoto,
  data?: testPhotoMetaAndIdDataType,
  image64?: string
) {
  if (!photo) {
    throw new Error("testPhotoOriginal: no photo to test");
  }
  testPhotoMetaAndId(photo, data);

  expect(photo.image64).toBe(image64 ?? defaultPhoto.image64);
}

function testPhotoCompressed(
  photo: APIPhoto,
  data?: testPhotoMetaAndIdDataType,
  image64?: string
) {
  testPhotoMetaAndId(photo, data);

  expect(photo.image64.length).toBeLessThan(
    image64?.length ?? photoImage64.length
  );
}

function testPhotoThumbnail(
  photo: APIPhoto,
  data?: testPhotoMetaAndIdDataType,
  image64?: string
) {
  testPhotoMetaAndId(photo, data);

  expect(photo.image64.length).toBeLessThan(
    image64?.length ?? photoImage64.length
  );
}

function testPhotoData(photo: APIPhoto, data?: testPhotoMetaAndIdDataType) {
  testPhotoMetaAndId(photo, data);

  expect(photo.image64).toBe("");
}

async function checkPhotoExists(id: string) {
  const ret = await GetPhotosById.Post({
    ids: [id],
    photoType: "data",
  });

  if (!ret.ok) {
    throw "Error checking photo exists";
  }

  return ret.data.photos[0].exists;
}

async function getPhotoById(id: string, photoType?: PhotoTypes) {
  const ret = await GetPhotosById.Post({
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
  const ret = await GetNumberPhotos.Post();

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

  expect(HasUserToken()).toBe(true);

  const userTokenRetured = GetUserToken();

  const tokenVerification = verifyUserToken(
    userTokenRetured,
    serverData.serverKey
  );
  expect(tokenVerification.ok).toBe(true);

  if (!tokenVerification.ok) {
    throw new Error("");
  }

  expect(tokenVerification.data.id).toBeDefined();
}

async function setupServerClaimed() {
  SaveServerCredentials({
    serverId: mockValues.serverId,
    serverKey: mockValues.validKey,
  });
}

async function setupServerUserToken() {
  setupServerClaimed();
  const ret = await GetToken.Post({
    userToken: mockValues.validUserToken,
  });

  if (!HasUserToken()) {
    throw new Error(
      "Error setting up server to generate user token:\n " + JSON.stringify(ret)
    );
  }
  serverUserToken = GetUserToken();
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

function expectErrorCodeToBe<T extends { ok: boolean; errorCode?: ErrorCodes }>(
  o: T,
  errorCode: ErrorCodes
) {
  expect(o.errorCode).toBe(errorCode);
}

async function addPhotoWithMultiplePaths() {
  const addedPhotoData = await addPhoto();

  await UpdatePhotoPath.Post({
    id: addedPhotoData.id,
    path: defaultPhotoSecondPath.path,
    deviceUniqueId: defaultPhotoSecondPath.deviceUniqueId,
  });

  return addedPhotoData;
}

function generateId() {
  return uuid();
}

function generateDate() {
  return new Date().toJSON();
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
  testPhotoMetaAndIdWithAdditionalPaths,
  getNumberPhotos,
  waitForPhotoTransferToFinish,
  defaultPhoto,
  defaultPhotoSecondPath,
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
  addPhotoWithMultiplePaths,
  generateId,
  generateDate,
};
