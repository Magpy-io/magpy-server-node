import { vol } from "memfs";
import { join } from "path";
import * as os from "os";

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
