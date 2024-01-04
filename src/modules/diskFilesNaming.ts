import { Photo } from "@src/types/photoType";
import * as path from "path";

import { GetStorageFolderPath } from "@src/modules/serverDataManager";

function splitImageName(fullName: string) {
  const nameSplited = fullName.split(".");
  const format = nameSplited.pop();
  const name = nameSplited.join();
  return { name: name, format: format };
}

async function createServerImageName(photo: Photo) {
  const dirPath = await GetStorageFolderPath();
  const { name, format } = splitImageName(photo.name);
  const date = photo.syncDate;
  const dateFormated = date.replace(/\:/g, "-");
  const serverFileName = `Ants_${name}_${dateFormated}.${format}`;
  return path.join(dirPath, serverFileName);
}

function createServerImageThumbnailName(fullImagePath: string) {
  const { name, format } = splitImageName(fullImagePath);
  return name + "_thumbnail" + "." + format;
}

function createServerImageCompressedName(fullImagePath: string) {
  const { name, format } = splitImageName(fullImagePath);
  return name + "_compressed" + "." + format;
}

export {
  createServerImageName,
  createServerImageThumbnailName,
  createServerImageCompressedName,
};
