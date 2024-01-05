// IMPORTS
import fs from "fs/promises";
import { Buffer } from "buffer";
import sharp from "sharp";
import { GetStorageFolderPath } from "@src/modules/serverDataManager";
import * as path from "path";

import {
  MAX_PIXELS_IN_IMAGE,
  MAX_PIXELS_IN_IMAGE_BIGGER,
} from "@src/config/config";
import { Photo } from "@src/types/photoType";

export async function addPhotoToDisk(photo: Photo, base64: string) {
  await createFolder(path.parse(photo.serverPath).dir);

  const factorTmp = Math.sqrt(
    (photo.width * photo.height) / MAX_PIXELS_IN_IMAGE
  );
  const factor = factorTmp > 1 ? factorTmp : 1;
  const newWidth = Math.round(photo.width / factor);
  const newHeight = Math.round(photo.height / factor);

  const factor2Tmp = Math.sqrt(
    (photo.width * photo.height) / MAX_PIXELS_IN_IMAGE_BIGGER
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
  await fs.writeFile(photo.serverPath, buff);
  await fs.writeFile(photo.serverCompressedPath, data2);
  await fs.writeFile(photo.serverThumbnailPath, data1);
  return;
}

export async function removePhotoFromDisk(photo: Photo) {
  try {
    await fs.unlink(photo.serverPath);
  } catch (err: any) {
    if (err.code != "ENOENT") {
      console.error(err);
      throw err;
    }
  }
  await removePhotoVariationsFromDisk(photo);
}

export async function removePhotoVariationsFromDisk(photo: Photo) {
  try {
    await fs.unlink(photo.serverThumbnailPath);
  } catch (err: any) {
    if (err.code != "ENOENT") {
      console.error(err);
      throw err;
    }
  }
  try {
    await fs.unlink(photo.serverCompressedPath);
  } catch (err: any) {
    if (err.code != "ENOENT") {
      console.error(err);
      throw err;
    }
  }
}

export async function getOriginalPhotoFromDisk(photo: Photo) {
  try {
    const result = await fs.readFile(photo.serverPath, { encoding: "base64" });
    return Buffer.from(result).toString();
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function getThumbnailPhotoFromDisk(photo: Photo) {
  try {
    const result = await fs.readFile(photo.serverThumbnailPath, {
      encoding: "base64",
    });
    return Buffer.from(result).toString();
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function getCompressedPhotoFromDisk(photo: Photo) {
  try {
    const result = await fs.readFile(photo.serverCompressedPath, {
      encoding: "base64",
    });
    return Buffer.from(result).toString();
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function clearImagesDisk() {
  try {
    const pathDir = await GetStorageFolderPath();
    let files: string[] = [];
    try {
      files = await fs.readdir(pathDir);
    } catch (err) {
      console.log("Could not find storage folder : " + pathDir);
      return;
    }
    const filesUnlinkedPromises = files.map((file) => {
      return fs.unlink(path.join(pathDir, file));
    });
    await Promise.all(filesUnlinkedPromises);
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function isPhotoOnDisk(photo: Photo) {
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
      await fs.unlink(filePath);
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
