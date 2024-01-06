import bcrypt from "bcryptjs";
import { isAbsolute } from "path";
import { platform } from "os";
import {
  deletePhotoByIdFromDB,
  getPhotoByClientPathFromDB,
  getPhotoByIdFromDB,
} from "@src/db/sequelizeDb";
import {
  isPhotoOnDisk,
  removePhotoVariationsFromDisk,
} from "@src/modules/diskManager";
import { Photo } from "@src/types/photoType";

export function timeout(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function combineMiddleware(mids: any) {
  return mids.reduce(function (a: any, b: any) {
    return function (req: any, res: any, next: any) {
      a(req, res, function (err: any) {
        if (err) {
          return next(err);
        }
        b(req, res, next);
      });
    };
  });
}

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

export async function comparePasswords(password: string, hash: string) {
  return await bcrypt.compare(password, hash);
}

export function isAbsolutePath(path: string) {
  path = path.trim();
  let absolute = isAbsolute(path);
  const testForDriveLetter = /^[a-zA-Z]:/;

  // isAbsolute tests positive for an absolute path but from the current drive, like '//folder'.
  // This function must return false in this case, the path must be completly absolute
  if (platform() == "win32") {
    absolute = absolute && testForDriveLetter.test(path);
  }

  return absolute;
}

/**
 * Returns if a photo exists on the database and on the disk.
 *
 * If any variation of the photo is missing from disk returns false and deletes the photo entry from db.
 */
export async function checkPhotoExistsAndDeleteMissing(
  data:
    | { id: string }
    | {
        clientPath: string;
      }
) {
  let photo: Photo | null;

  if ("clientPath" in data) {
    photo = await getPhotoByClientPathFromDB(data.clientPath);
    if (!photo) {
      return false;
    }
  } else if ("id" in data) {
    photo = await getPhotoByIdFromDB(data.id);
    if (!photo) {
      return false;
    }
  } else {
    throw new Error("checkPhotoExists: Needs the photo id or clientPath");
  }

  const existsDisk = await isPhotoOnDisk(photo);

  if (!existsDisk) {
    console.error(
      `Some variation of photo ${photo.serverPath} not found on disk, deleting the photo variations and removing it from db.`
    );
    await removePhotoVariationsFromDisk(photo);
    await deletePhotoByIdFromDB(photo.id);
    return false;
  }

  return true;
}

/**
 * Returns an array of photos containing only the photos present in both the db and disk.
 *
 * If any variation of a photo is missing from disk the photo entry from db is removed.
 */
export async function filterPhotosAndDeleteMissing(photos: Photo[]) {
  const photosThatExist = [];

  for (let photo of photos) {
    if (await checkPhotoExistsAndDeleteMissing({ id: photo.id })) {
      photosThatExist.push(photo);
    }
  }
  return photosThatExist;
}

/**
 * Returns an array of photos containing the photos present in both the db and disk, and null for any missing photo.
 *
 * If any variation of a photo is missing from disk the photo entry from db is removed, and null is returned for that photo.
 */
export async function filterPhotosExistAndDeleteMissing(
  photos: Array<Photo | null>
) {
  const photosThatExist: Array<Photo | null> = [];

  for (let photo of photos) {
    if (!photo) {
      photosThatExist.push(null);
    } else if (await checkPhotoExistsAndDeleteMissing({ id: photo.id })) {
      photosThatExist.push(photo);
    } else {
      photosThatExist.push(null);
    }
  }
  return photosThatExist;
}
