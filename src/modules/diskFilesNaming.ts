import { Photo } from "@src/types/photoType";
import * as path from "path";

import { GetStorageFolderPath } from "@src/modules/serverDataManager";

async function createServerImageName(photo: Photo) {
  const dirPath = await GetStorageFolderPath();
  const nameParsed = path.parse(photo.name);
  const serverFileName = createBaseName(photo) + nameParsed.ext;
  return path.join(dirPath, serverFileName);
}

async function createServerImageThumbnailName(photo: Photo) {
  const dirPath = await GetStorageFolderPath();
  const nameParsed = path.parse(photo.name);
  const serverFileName = createBaseName(photo) + "_thumbnail" + nameParsed.ext;
  return path.join(dirPath, serverFileName);
}

async function createServerImageCompressedName(photo: Photo) {
  const dirPath = await GetStorageFolderPath();
  const nameParsed = path.parse(photo.name);
  const serverFileName = createBaseName(photo) + "_compressed" + nameParsed.ext;
  return path.join(dirPath, serverFileName);
}

function createBaseName(photo: Photo) {
  const nameParsed = path.parse(photo.name);

  const date = photo.syncDate;
  const dateFormated = date.replace(/\:/g, "-");
  return `Ants_${nameParsed.name}_${dateFormated}`;
}

async function addServerImagePaths(photo: Photo) {
  photo.serverPath = await createServerImageName(photo);
  photo.serverCompressedPath = await createServerImageCompressedName(photo);
  photo.serverThumbnailPath = await createServerImageThumbnailName(photo);
}

export { addServerImagePaths };
