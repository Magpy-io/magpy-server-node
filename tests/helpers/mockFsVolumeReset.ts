import { GetStorageFolderPath } from "@src/modules/serverDataManager";
import { vol } from "memfs";
import { join } from "path";
import { GetRootPath } from "@tests/helpers/mockFsValumeManager";

export default async function () {
  vol.reset();
  const rootPath = await GetStorageFolderPath();
  const rootPathFile = join(rootPath, "file.txt");
  const json: any = {};
  // Add file to create folder
  json[rootPathFile] = "";
  vol.fromJSON(json, GetRootPath());
}
