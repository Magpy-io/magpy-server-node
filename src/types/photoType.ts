import { PhotoTypes, PhotoTypesArray } from '../api/Types';

function isValidPhotoType(photoType_p: string): boolean {
  const photoType = PhotoTypesArray.find(validName => validName === photoType_p);
  if (photoType) {
    return true;
  }
  return false;
}

function parsePhotoType(photoType_p: string): PhotoTypes {
  const photoType = PhotoTypesArray.find(validName => validName === photoType_p);
  if (photoType) {
    return photoType;
  }
  throw new Error("Error parsing PhotoType, '" + photoType_p + "' is not a valid PhotoType");
}
export { parsePhotoType, isValidPhotoType };
