import { vol } from "memfs";
import { GetStorageFolderPath } from "@src/modules/serverDataManager";
import { serverDataFile } from "@src/config/config";
import { join } from "path";
import * as os from "os";

export function AddServerData(serverData: any) {
  const rootPathFile = serverDataFile;
  const json: any = {};

  json[rootPathFile] = JSON.stringify(serverData);
  vol.fromJSON(json, ".");
}

export function GetPathFromRoot(path: string) {
  return join(GetRootPath(), path);
}

export function GetRootPath() {
  if (os.platform() == "win32") {
    return "c:\\";
  } else {
    return "/";
  }
}

export function volumeReset() {
  vol.reset();
}

export function getVolumeJson() {
  return vol.toJSON();
}
