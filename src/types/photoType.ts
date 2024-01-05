type Photo = {
  id: string;
  name: string;
  fileSize: number;
  width: number;
  height: number;
  date: string;
  syncDate: string;
  serverPath: string;
  serverCompressedPath: string;
  serverThumbnailPath: string;
  clientPath: string;
  hash: string;
  image64?: string;
};

const PhotoTypesArray = [
  "data",
  "thumbnail",
  "compressed",
  "original",
] as const;

type PhotoTypes = (typeof PhotoTypesArray)[number];

function isValidPhotoType(photoType_p: string): boolean {
  const photoType = PhotoTypesArray.find(
    (validName) => validName === photoType_p
  );
  if (photoType) {
    return true;
  }
  return false;
}

function parsePhotoType(photoType_p: string): PhotoTypes {
  const photoType = PhotoTypesArray.find(
    (validName) => validName === photoType_p
  );
  if (photoType) {
    return photoType;
  }
  throw new Error(
    "Error parsing PhotoType, '" + photoType_p + "' is not a valid PhotoType"
  );
}
export { parsePhotoType, isValidPhotoType };
export type { Photo, PhotoTypes };
