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
import { ExtendedRequest, MiddleWareType } from '../api/endpointsLoader';
import { NextFunction, Response } from 'express';
import { Logger } from './Logger';

function notNull<T>(value: T): value is NonNullable<T> {
  return value !== null;
}

export function filterNull<T>(arr: T[]) {
  return arr.filter(notNull);
}

export function timeout(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function combineMiddleware(mids: MiddleWareType[]) {
  return mids.reduce(function (a: MiddleWareType, b: MiddleWareType) {
    return async function (req: ExtendedRequest, res: Response, next: NextFunction) {
      return await a(req, res, async function (err: any) {
        if (err) {
          next(err);
        }
        return await b(req, res, next).catch(next);
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

export function AddWarningPhotosMissing(photosDeleted: Photo[], userid: string) {
  Logger.info('Photos missing deleted, adding warning');
  SetLastWarningForUser(userid, {
    code: 'PHOTOS_MISSING_FROM_DISK',
    data: {
      photosMissing: photosDeleted.map(p => responseFormatter.createPhotoObject(p)),
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
