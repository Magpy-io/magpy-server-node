// IMPORTS
import { Buffer } from 'buffer';
import fs from 'fs/promises';
import * as path from 'path';
import sharp from 'sharp';

import { PhotoTypes } from '../api/Types';
import * as config from '../config/config';
import { isValidPhotoType } from '../types/photoType';
import { GetStorageFolderPath } from './serverDataManager';
import { pathExists, createFolder } from './diskBasicFunctions';

interface AddPhotoParamType {
  width: number;
  height: number;
  serverPath: string;
  serverCompressedPath: string;
  serverThumbnailPath: string;
}

export async function createPhotosDir() {
  await createFolder(GetStorageFolderPath());
}

export async function addPhotoToDisk<T extends AddPhotoParamType>(photo: T, base64: string) {
  await createPhotosDir();

  const factorForThumbnail = Math.sqrt(
    (photo.width * photo.height) / config.MAX_PIXELS_IN_THUMBNAIL,
  );
  const widthThumbnail = Math.round(photo.width / factorForThumbnail);

  const factorForCompressed = Math.sqrt(
    (photo.width * photo.height) / config.MAX_PIXELS_IN_COMPRESSED,
  );
  const withCompressed = Math.round(photo.width / factorForCompressed);

  let buff = Buffer.from(base64, 'base64');

  const dataThumbnail = await sharp(buff)
    .resize({ width: widthThumbnail, withoutEnlargement: true })
    .jpeg({ quality: 70 })
    .toBuffer()
    .catch(err => {
      throw new PhotoParsingError(err);
    });

  const dataCompressed = await sharp(buff)
    .resize({ width: withCompressed, withoutEnlargement: true })
    .jpeg({ quality: 70 })
    .toBuffer()
    .catch(err => {
      throw new PhotoParsingError(err);
    });

  await fs.writeFile(photo.serverPath, buff, { flag: 'wx' });
  await fs.writeFile(photo.serverThumbnailPath, dataThumbnail, { flag: 'wx' });
  await fs.writeFile(photo.serverCompressedPath, dataCompressed, {
    flag: 'wx',
  });
  return;
}

export async function removePhotoFromDisk<T extends AddPhotoParamType>(photo: T) {
  await fs.rm(photo.serverPath, { force: true });
  await removePhotoVariationsFromDisk(photo);
}

export async function removePhotoVariationsFromDisk<T extends AddPhotoParamType>(photo: T) {
  await fs.rm(photo.serverThumbnailPath, { force: true });
  await fs.rm(photo.serverCompressedPath, { force: true });
}

export async function getPhotoFromDisk<T extends AddPhotoParamType>(
  photo: T,
  photoType: PhotoTypes,
) {
  if (!isValidPhotoType(photoType)) {
    throw new Error(
      `getPhotoFromDisk: invalid photoType: ${photoType}, should be one of "thumbnail", "compressed" or "original"`,
    );
  }
  let photoPath = '';
  switch (photoType) {
    case 'thumbnail':
      photoPath = photo.serverThumbnailPath;
      break;

    case 'compressed':
      photoPath = photo.serverCompressedPath;
      break;

    case 'original':
      photoPath = photo.serverPath;
      break;

    default:
      throw new Error(
        `getPhotoFromDisk: invalid photoType: ${photoType}, should be one of "thumbnail", "compressed" or "original"`,
      );
      break;
  }

  try {
    const result = await fs.readFile(photoPath, { encoding: 'base64' });
    return Buffer.from(result).toString();
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      return null;
    } else {
      throw err;
    }
  }
}

export async function clearImagesDisk() {
  const pathDir = GetStorageFolderPath();
  await fs.rm(pathDir, { force: true, recursive: true });
}

export async function clearDbFile() {
  const pathDir = config.sqliteDbFile;
  await fs.rm(pathDir, { force: true, recursive: true });
}

export async function isPhotoOnDisk<T extends AddPhotoParamType>(photo: T) {
  const originalExists = await pathExists(photo.serverPath);
  const compressedExists = await pathExists(photo.serverCompressedPath);
  const thumbnailExists = await pathExists(photo.serverThumbnailPath);
  return originalExists && compressedExists && thumbnailExists;
}

export class PhotoParsingError extends Error {
  constructor(internal: unknown) {
    super();
    this.message =
      'Error parsing photo. Format not supported. Internal exception:\n' + internal;
  }
}
