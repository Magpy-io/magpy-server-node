// IMPORTS
import fs from "fs/promises";
import { Buffer } from "buffer";
import sharp from "sharp";
import { GetStorageFolderPath } from "@src/modules/serverDataManager";
import * as path from "path";

import {
  createServerImageThumbnailName,
  createServerImageCompressedName,
} from "@src/modules/diskFilesNaming";

import {
  MAX_PIXELS_IN_IMAGE,
  MAX_PIXELS_IN_IMAGE_BIGGER,
} from "@src/config/config";

export async function addPhotoToDisk(
  data: string,
  photoWidth: number,
  photoHeight: number,
  photoPath: string
) {
  await createFolder(path.parse(photoPath).dir);

  const factorTmp = Math.sqrt((photoWidth * photoHeight) / MAX_PIXELS_IN_IMAGE);
  const factor = factorTmp > 1 ? factorTmp : 1;
  const newWidth = Math.round(photoWidth / factor);
  const newHeight = Math.round(photoHeight / factor);

  const factor2Tmp = Math.sqrt(
    (photoWidth * photoHeight) / MAX_PIXELS_IN_IMAGE_BIGGER
  );
  const factor2 = factor2Tmp > 1 ? factor2Tmp : 1;
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
  const file1 = await fs.writeFile(photoPath, buff);
  const file2 = await fs.writeFile(
    createServerImageCompressedName(photoPath),
    data2
  );
  const file3 = await fs.writeFile(
    createServerImageThumbnailName(photoPath),
    data1
  );
  return [file1, file2, file3];
}

export async function removePhotoFromDisk(photoPath: string) {
  try {
    await fs.unlink(photoPath);
  } catch (err: any) {
    if (err.code != "ENOENT") {
      console.error(err);
      throw err;
    }
  }
  try {
    await fs.unlink(createServerImageThumbnailName(photoPath));
  } catch (err: any) {
    if (err.code != "ENOENT") {
      console.error(err);
      throw err;
    }
  }
  try {
    await fs.unlink(createServerImageCompressedName(photoPath));
  } catch (err: any) {
    if (err.code != "ENOENT") {
      console.error(err);
      throw err;
    }
  }
}

export async function getOriginalPhotoFromDisk(photoPath: string) {
  try {
    const result = await fs.readFile(photoPath, { encoding: "base64" });
    return Buffer.from(result).toString();
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function getThumbnailPhotoFromDisk(photoPath: string) {
  try {
    const result = await fs.readFile(
      createServerImageThumbnailName(photoPath),
      {
        encoding: "base64",
      }
    );
    return Buffer.from(result).toString();
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function getCompressedPhotoFromDisk(photoPath: string) {
  try {
    const result = await fs.readFile(
      createServerImageCompressedName(photoPath),
      {
        encoding: "base64",
      }
    );
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

export async function isPhotoOnDisk(photoPath: string) {
  const originalExists = await pathExists(photoPath);
  const compressedExists = await pathExists(
    createServerImageCompressedName(photoPath)
  );
  const thumbnailExists = await pathExists(
    createServerImageThumbnailName(photoPath)
  );
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
