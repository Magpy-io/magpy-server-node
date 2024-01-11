import * as path from "path";

import { GetStorageFolderPath } from "@src/modules/serverDataManager";
import { pathExists, createFolder } from "@src/modules/diskManager";
import { Photo } from "@src/db/sequelizeDb";

type createServerImageNameInputType = { name: string; syncDate: string };

async function createServerImageName<T extends createServerImageNameInputType>(
  photo: T
) {
  const dirPath = GetStorageFolderPath();
  const nameParsed = path.parse(photo.name);
  const serverFileName = createBaseName(photo) + nameParsed.ext;
  const folderPath = path.join(dirPath, "Originals");
  await createFolder(folderPath);
  const filePath = path.join(folderPath, serverFileName);
  return await getFirstAvailableFileName(filePath);
}

async function createServerImageThumbnailName<
  T extends createServerImageNameInputType
>(photo: T) {
  const dirPath = GetStorageFolderPath();
  const nameParsed = path.parse(photo.name);
  const serverFileName = createBaseName(photo) + "_thumbnail" + nameParsed.ext;
  const folderPath = path.join(dirPath, "Thumbnails");
  await createFolder(folderPath);
  const filePath = path.join(folderPath, serverFileName);
  return await getFirstAvailableFileName(filePath);
}

async function createServerImageCompressedName<
  T extends createServerImageNameInputType
>(photo: T) {
  const dirPath = GetStorageFolderPath();
  const nameParsed = path.parse(photo.name);
  const serverFileName = createBaseName(photo) + "_compressed" + nameParsed.ext;
  const folderPath = path.join(dirPath, "Compressed");
  await createFolder(folderPath);
  const filePath = path.join(folderPath, serverFileName);
  return await getFirstAvailableFileName(filePath);
}

function createBaseName<T extends createServerImageNameInputType>(photo: T) {
  const nameParsed = path.parse(photo.name);

  const date = photo.syncDate;
  const dateFormated = date.replace(/\:/g, "-");
  return `Ants_${nameParsed.name}_${dateFormated}`;
}

type AddServerImagePathsInputType = {
  serverPath: string;
  serverCompressedPath: string;
  serverThumbnailPath: string;
};
async function addServerImagePaths<
  T extends AddServerImagePathsInputType & createServerImageNameInputType
>(photo: T) {
  photo.serverPath = await createServerImageName(photo);
  photo.serverCompressedPath = await createServerImageCompressedName(photo);
  photo.serverThumbnailPath = await createServerImageThumbnailName(photo);
}

async function getFirstAvailableFileName(filePath: string) {
  let i = 0;
  let filePath_i = filePath;
  const filePathParsed = path.parse(filePath);

  while (await pathExists(filePath_i)) {
    i++;
    filePath_i = path.join(
      filePathParsed.dir,
      filePathParsed.name + `_${i}` + filePathParsed.ext
    );
  }
  return filePath_i;
}

export { addServerImagePaths };
