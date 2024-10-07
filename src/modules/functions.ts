import bcrypt from 'bcryptjs';
import { platform } from 'os';
import { isAbsolute } from 'path';

import responseFormatter from '../api/responseFormatter';
import {
  deletePhotoByIdFromDB,
  getPhotoByIdFromDB,
  getPhotoByMediaIdFromDB,
} from '../db/sequelizeDb';
import { Photo } from '../db/sequelizeDb';
import { isPhotoOnDisk, removePhotoVariationsFromDisk } from './diskManager';
import { SetLastWarningForUser } from './warningsManager';

function notNull<T>(value: T): value is NonNullable<T> {
  return value !== null;
}

export function filterNull<T>(arr: T[]) {
  return arr.filter(notNull);
}

export function timeout(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
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
  if (platform() == 'win32') {
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
    | {
        id: string;
      }
    | { mediaId: string; deviceUniqueId: string },
): Promise<
  | { exists: null; deleted: Photo; warning: true }
  | { exists: null; deleted: null; warning: false }
  | { exists: Photo; deleted: null; warning: false }
> {
  let photo: Photo | null;

  if ('id' in data) {
    photo = await getPhotoByIdFromDB(data.id);
  } else {
    photo = await getPhotoByMediaIdFromDB({ mediaId: data.mediaId }, data.deviceUniqueId);
  }

  if (!photo) {
    return { exists: null, deleted: null, warning: false };
  }

  const existsDisk = await isPhotoOnDisk(photo);

  if (!existsDisk) {
    console.error(
      `Some variation of photo ${photo.serverPath} not found on disk, deleting the photo variations and removing it from db.`,
    );
    await removePhotoVariationsFromDisk(photo);
    await deletePhotoByIdFromDB(photo.id);
    return { exists: null, deleted: photo, warning: true };
  }

  return { exists: photo, deleted: null, warning: false };
}

/**
 * Returns an array of photos containing only the photos present in both the db and disk.
 *
 * If any variation of a photo is missing from disk the photo entry from db is removed.
 */
export async function filterPhotosAndDeleteMissing(photos: Photo[]) {
  const photosThatExist = [];
  const photosDeleted = [];

  for (let photo of photos) {
    const ret = await checkPhotoExistsAndDeleteMissing({ id: photo.id });
    if (ret.exists) {
      photosThatExist.push(photo);
    }

    if (ret.deleted) {
      photosDeleted.push(photo);
    }
  }
  return { photosThatExist, photosDeleted, warning: photosDeleted.length != 0 };
}

/**
 * Returns an array of photos containing the photos present in both the db and disk, and null for any missing photo.
 *
 * If any variation of a photo is missing from disk the photo entry from db is removed, and null is returned for that photo.
 */
export async function filterPhotosExistAndDeleteMissing(photos: Array<Photo | null>) {
  const photosThatExist: Array<Photo | null> = [];
  const photosDeleted: Array<Photo> = [];

  for (let photo of photos) {
    if (!photo) {
      photosThatExist.push(null);
    } else {
      const ret = await checkPhotoExistsAndDeleteMissing({ id: photo.id });
      if (ret.exists) {
        photosThatExist.push(photo);
      } else {
        photosThatExist.push(null);

        if (ret.deleted) {
          photosDeleted.push(photo);
        }
      }
    }
  }
  return { photosThatExist, photosDeleted, warning: photosDeleted.length != 0 };
}

export function AddWarningPhotosDeleted(photosDeleted: Photo[], userid: string) {
  console.log('Photos missing deleted, adding warning');
  SetLastWarningForUser(userid, {
    code: 'PHOTOS_NOT_ON_DISK_DELETED',
    data: {
      photosDeleted: photosDeleted.map(p => responseFormatter.createPhotoObject(p)),
    },
  });
}

export async function sleep(timeout: number): Promise<null> {
  return new Promise(res => {
    setTimeout(() => {
      res(null);
    }, timeout);
  });
}
