import { GetStorageFolderPath } from "@src/modules/serverDataManager";

import { vol } from "memfs";
import { join } from "path";

export default async function () {
  vol.reset();
  const rootPath = await GetStorageFolderPath();
  const rootPathFile = join(rootPath, "file.txt");
  const json: any = {};
  // Add file to create folder
  json[rootPathFile] = "";
  vol.fromJSON(json, "/");
}
