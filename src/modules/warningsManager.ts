import { Photo } from "@src/types/photoType";

const warnings = new Map<string, WarningDataTypes>();

export function GetLastWarningForUser(userId: string) {
  if (warnings.has(userId)) {
    const warning = warnings.get(userId);
    warnings.delete(userId);
    return warning;
  }
  return;
}

export function SetLastWarningForUser(
  userId: string,
  warning: WarningDataTypes
) {
  warnings.set(userId, warning);
}

export function ClearAllWarnings() {
  warnings.clear();
}

export type WarningFormat<Code, Data> = { code: Code; data: Data };

export type WarningDataTypes = WarningPhotosNotOnDiskDeletedType;

export type WarningPhotosNotOnDiskDeletedCode = "PHOTOS_NOT_ON_DISK_DELETED";
export type WarningPhotosNotOnDiskDeletedDataType = Array<Photo>;
export type WarningPhotosNotOnDiskDeletedType = WarningFormat<
  WarningPhotosNotOnDiskDeletedCode,
  WarningPhotosNotOnDiskDeletedDataType
>;
