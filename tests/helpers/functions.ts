import { expect } from '@jest/globals';
import {
  AddPhoto,
  GetNumberPhotos,
  GetPhotosById,
  GetToken,
  GetTokenLocal,
  ClaimServerLocal,
  ClaimServer,
  UpdatePhotoMediaId,
} from '@src/api/export/';
import { GetUserToken, HasUserToken } from '@src/api/export/TokenManager';
import { APIPhoto, PhotoTypes } from '@src/api/export/Types';
import { ErrorCodes } from '@src/api/export/Types/ErrorTypes';
import { postPhotoPartTimeout } from '@src/config/config';
import * as dbFunction from '@src/db/sequelizeDb';
import { Photo } from '@src/db/sequelizeDb';
import * as mockValues from '@src/modules/BackendQueries/__mocks__/mockValues';
import { pathExists } from '@src/modules/diskBasicFunctions';
import { timeout } from '@src/modules/functions';
import {
  GetServerCredentials,
  GetServerSigningKey,
  SaveServerCredentials,
  SaveServerLocalClaimInfo,
} from '@src/modules/serverDataManager';
import { verifyUserToken } from '@src/modules/tokenManagement';
import { GetLastWarningForUser, HasWarningForUser } from '@src/modules/warningsManager';
import { photoImage64 } from '@tests/helpers/imageBase64';
import fs from 'fs/promises';
import jwt from 'jsonwebtoken';
import { validate } from 'uuid';
import { v4 as uuid } from 'uuid';

let serverUserToken = '';

const defaultUsername = 'username';
const defaultPassword = 'password';

const defaultPhoto = {
  name: 'image.jpg',
  fileSize: 1000,
  width: 1500,
  height: 1000,
  mediaId: 'mediaId',
  date: '2022-12-11T17:05:21.396Z',
  image64: photoImage64,
  deviceUniqueId: 'fe2e61bd-31e2-4896-b121-1124fa561344',
};

const defaultPhotoSecondMediaId = {
  mediaId: 'secondMediaId',
  deviceUniqueId: '6b065dcf-782b-4203-8b59-06d81242fac0',
};

async function addPhoto(data?: {
  mediaId?: string;
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
    mediaId: data?.mediaId ?? defaultPhoto.mediaId,
    date: data?.date ?? defaultPhoto.date,
    image64: data?.image64 ?? defaultPhoto.image64,
    deviceUniqueId: data?.deviceUniqueId ?? defaultPhoto.deviceUniqueId,
  });

  if (!ret.ok) {
    throw 'Error adding photo';
  }

  return {
    id: ret.data.photo.id,
    mediaId: data?.mediaId ?? defaultPhoto.mediaId,
  };
}

async function addNPhotos(n: number) {
  const ret: { id: string; mediaId: string }[] = [];
  for (let i = 0; i < n; i++) {
    const photoAddedData = await addPhoto({
      mediaId: 'mediaId' + i.toString(),
    });
    ret.push(photoAddedData);
  }
  return ret;
}

async function deletePhotoFromDisk(photo: Photo, photoType: PhotoTypes) {
  if (photoType == 'thumbnail') {
    await fs.rm(photo.serverThumbnailPath, { force: true });
  }

  if (photoType == 'compressed') {
    await fs.rm(photo.serverCompressedPath, { force: true });
  }

  if (photoType == 'original') {
    await fs.rm(photo.serverPath, { force: true });
  }
}

async function getPhotoFromDb(id: string) {
  const dbPhoto = await dbFunction.getPhotoByIdFromDB(id);

  if (!dbPhoto) {
    throw new Error('Photo not found in db');
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
    throw new Error('dbPhoto expected to be thruthy');
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
  mediaId?: string;
  name?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  date?: string;
  id?: string;
};

function testPhotoMetaAndId(photo: APIPhoto, data?: testPhotoMetaAndIdDataType) {
  testPhotoMetaAndIdWithAdditionalMediaIds(photo, [], data);
}

function testPhotoMetaAndIdWithAdditionalMediaIds(
  photo: APIPhoto,
  additionalMediaIds: { mediaId: string; deviceUniqueId: string }[],
  data?: testPhotoMetaAndIdDataType,
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

  //test mediaIds

  const mediaIdsToTest = [
    {
      mediaId: data?.mediaId ?? defaultPhoto.mediaId,
      deviceUniqueId: data?.deviceUniqueId ?? defaultPhoto.deviceUniqueId,
    },
    ...additionalMediaIds,
  ];

  expect(photo.meta.mediaIds.length).toBe(mediaIdsToTest.length);

  for (let i = 0; i < mediaIdsToTest.length; i++) {
    expect(photo.meta.mediaIds[i].mediaId).toBe(mediaIdsToTest[i].mediaId);
    expect(photo.meta.mediaIds[i].deviceUniqueId).toBe(mediaIdsToTest[i].deviceUniqueId);
  }
}

function testPhotoOriginal(
  photo?: APIPhoto,
  data?: testPhotoMetaAndIdDataType,
  image64?: string,
) {
  if (!photo) {
    throw new Error('testPhotoOriginal: no photo to test');
  }
  testPhotoMetaAndId(photo, data);

  expect(photo.image64).toBe(image64 ?? defaultPhoto.image64);
}

function testPhotoCompressed(
  photo: APIPhoto,
  data?: testPhotoMetaAndIdDataType,
  image64?: string,
) {
  testPhotoMetaAndId(photo, data);

  expect(photo.image64.length).toBeLessThan(image64?.length ?? photoImage64.length);
}

function testPhotoThumbnail(
  photo: APIPhoto,
  data?: testPhotoMetaAndIdDataType,
  image64?: string,
) {
  testPhotoMetaAndId(photo, data);

  expect(photo.image64.length).toBeLessThan(image64?.length ?? photoImage64.length);
}

function testPhotoData(photo: APIPhoto, data?: testPhotoMetaAndIdDataType) {
  testPhotoMetaAndId(photo, data);

  expect(photo.image64).toBe('');
}

async function checkPhotoExists(id: string) {
  const ret = await GetPhotosById.Post({
    ids: [id],
    photoType: 'data',
  });

  if (!ret.ok) {
    throw 'Error checking photo exists';
  }

  return ret.data.photos[0].exists;
}

async function getPhotoById(id: string, photoType?: PhotoTypes) {
  const ret = await GetPhotosById.Post({
    ids: [id],
    photoType: photoType ?? 'data',
  });

  if (!ret.ok) {
    throw 'Error checking photo exists';
  }

  if (!ret.data.photos[0].exists) {
    return;
  }

  return ret.data.photos[0].photo;
}

async function getNumberPhotos() {
  const ret = await GetNumberPhotos.Post();

  if (!ret.ok) {
    throw 'Error checking photo exists';
  }

  return ret.data.number;
}

async function waitForPhotoTransferToFinish() {
  await timeout(postPhotoPartTimeout + 100);
}

function testReturnedToken() {
  const serverSigningKey = GetServerSigningKey();

  if (!serverSigningKey) {
    throw new Error('testReturnedToken: serverSigningKey needs to be defined');
  }

  expect(HasUserToken()).toBe(true);

  const userTokenRetured = GetUserToken();

  const tokenVerification = verifyUserToken(userTokenRetured, serverSigningKey);
  expect(tokenVerification.ok).toBe(true);

  if (!tokenVerification.ok) {
    throw new Error('');
  }

  expect(tokenVerification.data.id).toBeDefined();
}

async function setupServerClaimed() {
  const ret = await ClaimServer.Post({
    userToken: mockValues.validUserToken,
  });

  if (!ret.ok) {
    throw new Error('Error claiming server remotely:\n ' + JSON.stringify(ret));
  }
}

async function setupServerUserToken() {
  const ret = await GetToken.Post({
    userToken: mockValues.validUserToken,
  });

  if (!HasUserToken()) {
    throw new Error(
      'Error setting up server to generate user token:\n ' + JSON.stringify(ret),
    );
  }
  serverUserToken = GetUserToken();
}

async function setupServerClaimedLocally() {
  const ret = await ClaimServerLocal.Post({
    username: defaultUsername,
    password: defaultPassword,
  });

  if (!ret.ok) {
    throw new Error('Error claiming server locally:\n ' + JSON.stringify(ret));
  }
}

async function setupServerLocalUserToken() {
  const ret = await GetTokenLocal.Post({
    username: defaultUsername,
    password: defaultPassword,
  });

  if (!HasUserToken()) {
    throw new Error(
      'Error setting up server to generate user token:\n ' + JSON.stringify(ret),
    );
  }
  serverUserToken = GetUserToken();
}

function getUserId() {
  if (!serverUserToken) {
    throw new Error('No serverUserToken to use in getUserId()');
  }
  const serverSigningKey = GetServerSigningKey();
  if (!serverSigningKey) {
    throw new Error('getUserId: serverSigningKey needs to be defined');
  }

  const tokenVerification = verifyUserToken(serverUserToken, serverSigningKey);

  if (!tokenVerification.ok) {
    throw new Error('getUserId: token verification failed');
  }
  return tokenVerification.data.id;
}

function getExpiredToken() {
  const serverSigningKey = GetServerSigningKey();
  if (!serverSigningKey) {
    throw new Error('getExpiredToken: serverSigningKey needs to be defined');
  }
  const expiredToken = jwt.sign({}, serverSigningKey, {
    expiresIn: 0,
  });

  return expiredToken;
}

function randomTokenHeader() {
  return { 'x-authorization': 'Bearer serverUserToken' };
}

function testWarning(dbPhoto: Photo) {
  expect(HasWarningForUser(getUserId())).toBe(true);

  const warning = GetLastWarningForUser(getUserId());
  expect(warning).toBeTruthy();

  if (!warning) {
    throw new Error('warning should be defined');
  }

  expect(warning.code).toBe('PHOTOS_NOT_ON_DISK_DELETED');
  expect(warning.data).toHaveProperty('photosDeleted');
  expect(warning.data.photosDeleted.length).toBe(1);

  expect(warning.data.photosDeleted[0].id).toBe(dbPhoto.id);
}

function getDataFromRet<T extends { ok: boolean; data?: any }>(o: T) {
  type DataType = T extends { data: infer S } ? S : never;

  if (!o.ok) {
    throw new Error('getDataFromRet: ok is false, cannot get data');
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
  errorCode: ErrorCodes,
) {
  expect(o.errorCode).toBe(errorCode);
}

async function addPhotoWithMultipleMediaIds() {
  const addedPhotoData = await addPhoto();

  await UpdatePhotoMediaId.Post({
    id: addedPhotoData.id,
    mediaId: defaultPhotoSecondMediaId.mediaId,
    deviceUniqueId: defaultPhotoSecondMediaId.deviceUniqueId,
  });

  return addedPhotoData;
}

function generateId() {
  return uuid();
}

function generateDate() {
  return new Date().toISOString();
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
  testPhotoMetaAndIdWithAdditionalMediaIds,
  getNumberPhotos,
  waitForPhotoTransferToFinish,
  defaultPhoto,
  defaultPhotoSecondMediaId,
  defaultPassword,
  defaultUsername,
  testReturnedToken,
  setupServerClaimed,
  setupServerUserToken,
  setupServerClaimedLocally,
  setupServerLocalUserToken,
  serverUserToken,
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
  addPhotoWithMultipleMediaIds,
  generateId,
  generateDate,
};
