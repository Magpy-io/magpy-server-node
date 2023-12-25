import { vol } from "memfs";
import { serverDataFile } from "@src/config/config";
import { join } from "path";

export function AddServerData(serverData: any) {
  const rootPathFile = serverDataFile;
  const json: any = {};

  json[rootPathFile] = JSON.stringify(serverData);
  vol.fromJSON(json, "./");
}

export function CreatePath(path: string) {
  const pathFile = join(path, "file.txt");
  const json: any = {};
  // Add file to create folder
  json[pathFile] = "";
  vol.fromJSON(json, "/");
}
