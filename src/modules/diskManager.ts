// IMPORTS
import fs from "fs/promises";
import { Buffer } from "buffer";
import sharp from "sharp";
import { GetStorageFolderPath } from "@src/modules/serverDataManager";

import {
  createServerImageThumbnailName,
  createServerImageCompressedName,
} from "@src/modules/diskFilesNaming";

import {
  MAX_PIXELS_IN_IMAGE,
  MAX_PIXELS_IN_IMAGE_BIGGER,
} from "@src/config/config";

async function addPhotoToDisk(
  data: string,
  photoWidth: number,
  photoHeight: number,
  path: string
) {
  const factor = Math.sqrt((photoWidth * photoHeight) / MAX_PIXELS_IN_IMAGE);
  const newWidth = Math.round(photoWidth / factor);
  const newHeight = Math.round(photoHeight / factor);

  const factor2 = Math.sqrt(
    (photoWidth * photoHeight) / MAX_PIXELS_IN_IMAGE_BIGGER
  );
  const newWidth2 = Math.round(photoWidth / factor2);
  const newHeight2 = Math.round(photoHeight / factor2);

  let buff = Buffer.from(data, "base64");

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
  const file1 = await fs.writeFile(path, buff);
  const file2 = await fs.writeFile(
    createServerImageCompressedName(path),
    data2
  );
  const file3 = await fs.writeFile(createServerImageThumbnailName(path), data1);
  return [file1, file2, file3];
}

async function removePhotoFromDisk(path: string) {
  try {
    await fs.unlink(path);
    await fs.unlink(createServerImageThumbnailName(path));
    await fs.unlink(createServerImageCompressedName(path));
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function getOriginalPhotoFromDisk(path: string) {
  try {
    const result = await fs.readFile(path, { encoding: "base64" });
    return Buffer.from(result).toString();
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function getThumbnailPhotoFromDisk(path: string) {
  try {
    const result = await fs.readFile(createServerImageThumbnailName(path), {
      encoding: "base64",
    });
    return Buffer.from(result).toString();
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function getCompressedPhotoFromDisk(path: string) {
  try {
    const result = await fs.readFile(createServerImageCompressedName(path), {
      encoding: "base64",
    });
    return Buffer.from(result).toString();
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function clearImagesDisk() {
  try {
    const path = await GetStorageFolderPath();
    console.error(path);
    const files = await fs.readdir(path);
    const filesUnlinkedPromises = files.map((file) => {
      return fs.unlink(path + file);
    });
    await Promise.all(filesUnlinkedPromises);
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function createFolder(dirPath: string) {
  try {
    await fs.access(dirPath);
  } catch (error: any) {
    if (error.code === "ENOENT") {
      //The directory does NOT exist
      await fs.mkdir(dirPath, { recursive: true });
    } else {
      throw error;
    }
  }
}

export {
  addPhotoToDisk,
  getThumbnailPhotoFromDisk,
  getCompressedPhotoFromDisk,
  getOriginalPhotoFromDisk,
  clearImagesDisk,
  removePhotoFromDisk,
  createFolder,
};
