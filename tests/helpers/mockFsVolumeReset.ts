import { rootPath } from "@src/config/config";

import { vol } from "memfs";

export default function () {
  vol.reset();
  const rootPathFile = rootPath + "file.txt";
  const json: any = {};
  // Add file to create folder
  json[rootPathFile] = "";
  vol.fromJSON(json, "/");
}
