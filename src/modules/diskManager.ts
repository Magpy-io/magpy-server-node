// IMPORTS
import fs from "fs/promises";
import { Buffer } from "buffer";
import sharp from "sharp";
import { GetStorageFolderPath } from "@src/modules/serverDataManager";
import * as path from "path";

import * as config from "@src/config/config";
import { isValidPhotoType } from "@src/types/photoType";

import { PhotoTypes } from "@src/api/export/exportedTypes";

interface AddPhotoParamType {
  width: number;
  height: number;
  serverPath: string;
  serverCompressedPath: string;
  serverThumbnailPath: string;
}

export async function addPhotoToDisk<T extends AddPhotoParamType>(
  photo: T,
  base64: string
) {
  await createFolder(path.parse(photo.serverPath).dir);

  const factorTmp = Math.sqrt(
    (photo.width * photo.height) / config.MAX_PIXELS_IN_IMAGE
  );
  const factor = factorTmp > 1 ? factorTmp : 1;
  const newWidth = Math.round(photo.width / factor);
  const newHeight = Math.round(photo.height / factor);

  const factor2Tmp = Math.sqrt(
    (photo.width * photo.height) / config.MAX_PIXELS_IN_IMAGE_BIGGER
  );
  const factor2 = factor2Tmp > 1 ? factor2Tmp : 1;
  const newWidth2 = Math.round(photo.width / factor2);
  const newHeight2 = Math.round(photo.height / factor2);

  let buff = Buffer.from(base64, "base64");

  const data1 = await sharp(buff)
    .resize({ width: newWidth, height: newHeight })
    .jpeg({ quality: 70 })
    .toBuffer()
    .catch((err) => {
      console.error(err);
      throw err;
    });
  const data2 = await sharp(buff)
    .resize({ width: newWidth2, height: newHeight2 })
    .jpeg({ quality: 70 })
    .toBuffer()
    .catch((err) => {
      console.error(err);
      throw err;
    });
  await fs.writeFile(photo.serverPath, buff, { flag: "wx" });
  await fs.writeFile(photo.serverCompressedPath, data2, { flag: "wx" });
  await fs.writeFile(photo.serverThumbnailPath, data1, { flag: "wx" });
  return;
}

export async function removePhotoFromDisk<T extends AddPhotoParamType>(
  photo: T
) {
  try {
    await fs.rm(photo.serverPath, { force: true });
  } catch (err: any) {
    console.error(err);
    throw err;
  }
  await removePhotoVariationsFromDisk(photo);
}

export async function removePhotoVariationsFromDisk<
  T extends AddPhotoParamType
>(photo: T) {
  try {
    await fs.rm(photo.serverThumbnailPath, { force: true });
  } catch (err: any) {
    console.error(err);
    throw err;
  }
  try {
    await fs.rm(photo.serverCompressedPath, { force: true });
  } catch (err: any) {
    console.error(err);
    throw err;
  }
}

export async function getPhotoFromDisk<T extends AddPhotoParamType>(
  photo: T,
  photoType: PhotoTypes
) {
  if (!isValidPhotoType(photoType)) {
    throw new Error(
      `getPhotoFromDisk: invalid photoType: ${photoType}, should be one of "thumbnail", "compressed" or "original"`
    );
  }
  let photoPath = "";
  switch (photoType) {
    case "thumbnail":
      photoPath = photo.serverThumbnailPath;
      break;

    case "compressed":
      photoPath = photo.serverCompressedPath;
      break;

    case "original":
      photoPath = photo.serverPath;
      break;

    default:
      throw new Error(
        `getPhotoFromDisk: invalid photoType: ${photoType}, should be one of "thumbnail", "compressed" or "original"`
      );
      break;
  }

  try {
    const result = await fs.readFile(photoPath, { encoding: "base64" });
    return Buffer.from(result).toString();
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function clearImagesDisk() {
  try {
    const pathDir = GetStorageFolderPath();
    await fs.rm(pathDir, { force: true, recursive: true });
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function clearDbFile() {
  try {
    const pathDir = config.sqliteDbFile;
    await fs.rm(pathDir, { force: true, recursive: true });
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function isPhotoOnDisk<T extends AddPhotoParamType>(photo: T) {
  const originalExists = await pathExists(photo.serverPath);
  const compressedExists = await pathExists(photo.serverCompressedPath);
  const thumbnailExists = await pathExists(photo.serverThumbnailPath);
  return originalExists && compressedExists && thumbnailExists;
}

export async function folderHasRights(dirPath: string) {
  try {
    const filename = "tmpFileForTestingAccessToFolder.txt";
    const filePath = path.join(dirPath, filename);
    let fileExists = false;

    if (await pathExists(filePath)) {
      fileExists = true;
    }

    let fh = await fs.open(filePath, "a");
    await fh.close();

    if (!fileExists) {
      await fs.rm(filePath, { force: true });
    }

    return true;
  } catch (err) {
    return false;
  }
}

export async function pathExists(pathToTest: string) {
  try {
    await fs.access(pathToTest, fs.constants.F_OK);
    return true;
  } catch (err) {
    return false;
  }
}

export async function createFolder(dirPath: string) {
  const exists = await pathExists(dirPath);

  if (!exists) {
    await fs.mkdir(dirPath, { recursive: true });
  }
}
