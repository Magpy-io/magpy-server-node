import { APIPhoto } from './Types';

export type WarningFormat<Code, Data> = { code: Code; data: Data };

export type WarningDataTypes = WarningPhotosMissingFromDiskType;

export type WarningPhotosMissingFromDiskDataType = {
  photosMissing: Array<APIPhoto>;
};
export type WarningPhotosMissingFromDiskType = WarningFormat<
  'PHOTOS_MISSING_FROM_DISK',
  WarningPhotosMissingFromDiskDataType
>;
