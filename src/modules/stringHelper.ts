import { getPhotoPartSize } from "@src/config/config";

function getNumberOfParts(image64) {
  const len = image64.length;
  const numberOfParts = Math.floor(len / getPhotoPartSize);

  if (len % getPhotoPartSize != 0) {
    return numberOfParts + 1;
  }
  return numberOfParts;
}

function getPartN(image64, n) {
  const nbParts = getNumberOfParts(image64);
  if (n >= nbParts) {
    throw new Error(`Maximum number of parts is ${nbParts}, got ${n}`);
  }

  return image64.substring(n * getPhotoPartSize, (n + 1) * getPhotoPartSize);
}

export { getNumberOfParts, getPartN };
