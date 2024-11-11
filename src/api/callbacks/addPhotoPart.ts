import { Request, Response } from 'express';

import { postPhotoPartTimeout } from '../../config/config';
import { addPhotoToDB, deletePhotoByIdFromDB } from '../../db/sequelizeDb';
import assertUserToken from '../../middleware/userToken/assertUserToken';
import { addPhotoToDisk, PhotoParsingError } from '../../modules/diskManager';
import { hashFile } from '../../modules/hashing';
import FilesWaiting, { FilesWaitingType } from '../../modules/waitingFiles';
import { AddPhotoPart } from '../Types';
import responseFormatter from '../responseFormatter';
import { EndpointType, ExtendedRequest } from '../endpointsLoader';
import { checkPhotoExistsAndDeleteMissing } from '../../modules/functions';

const { sendResponse, sendFailedMessage } = responseFormatter.getCustomSendResponse<
  AddPhotoPart.ResponseData,
  AddPhotoPart.ResponseErrorTypes
>();

const callback = async (
  req: ExtendedRequest,
  res: Response,
  body: AddPhotoPart.RequestData,
) => {
  if (!req.userId) {
    throw new Error('UserId is not defined.');
  }

  if (body.partSize != body.photoPart.length) {
    req.logger?.debug('Bad request parameters');
    return responseFormatter.sendFailedBadRequest(
      req,
      res,
      'photoPart length and partSize do not match',
    );
  }

  if (!FilesWaiting.has(body.id)) {
    req.logger?.debug(`No photo transfer for id ${body.id} was found.`);
    return sendFailedMessage(
      req,
      res,
      `No photo transfer for id ${body.id} was found.`,
      'PHOTO_TRANSFER_NOT_FOUND',
    );
  }

  req.logger?.debug(`Photo transfer for id ${body.id} found.`);

  const photoWaiting = FilesWaiting.get(body.id)!;
  photoWaiting.received += body.partSize;
  photoWaiting.dataParts.set(body.partNumber, body.photoPart);

  if (photoWaiting.received < photoWaiting.image64Len) {
    req.logger?.debug(
      'Photo part added. (' +
        photoWaiting.received.toString() +
        '/' +
        photoWaiting.image64Len.toString() +
        ')',
    );
    req.logger?.debug('Reseting timeout.');

    clearTimeout(photoWaiting.timeout);
    photoWaiting.timeout = setTimeout(() => {
      req.logger?.debug(`Photo transfer for id ${body.id} timed out.`);
      req.logger?.debug(`Deleting pending transfer for id ${body.id}`);
      FilesWaiting.delete(body.id);
    }, postPhotoPartTimeout);

    return sendResponse(req, res, {
      lenReceived: photoWaiting.received,
      lenWaiting: photoWaiting.image64Len,
      done: false,
    });
  }

  if (photoWaiting.received > photoWaiting.image64Len) {
    req.logger?.debug(
      `Transfered data (${photoWaiting.received}) exceeds initial image size (${photoWaiting.image64Len}).`,
    );

    req.logger?.debug(`Deleting pending transfer for id ${body.id}`);
    clearTimeout(photoWaiting.timeout);
    FilesWaiting.delete(body.id);

    return sendFailedMessage(
      req,
      res,
      `Transfered data (${photoWaiting.received}) exceeds initial image size (${photoWaiting.image64Len}).`,
      'PHOTO_SIZE_EXCEEDED',
    );
  }

  req.logger?.debug(
    'Full image received. (' +
      photoWaiting.image64Len.toString() +
      '/' +
      photoWaiting.image64Len.toString() +
      ')',
  );

  req.logger?.debug('Removing timeout');
  clearTimeout(photoWaiting.timeout);

  if (!arePartsValid(photoWaiting.dataParts)) {
    req.logger?.debug(`Deleting pending transfer for id ${body.id}`);
    clearTimeout(photoWaiting.timeout);
    FilesWaiting.delete(body.id);

    return sendFailedMessage(req, res, `Not all parts were found`, 'MISSING_PARTS');
  }

  const image64 = joinParts(photoWaiting.dataParts);

  const hash = hashFile(image64);
  photoWaiting.photo.hash = hash;

  req.logger?.debug(`Deleting pending transfer for id ${body.id}`);
  FilesWaiting.delete(body.id);

  const photoExists = await checkPhotoExistsAndDeleteMissing({
    mediaId: photoWaiting.photo.mediaId,
    deviceUniqueId: photoWaiting.photo.deviceUniqueId,
  });

  if (photoExists.exists) {
    req.logger?.debug('Photo exists in db');

    const jsonResponse = {
      lenReceived: photoWaiting.received,
      lenWaiting: photoWaiting.image64Len,
      done: true,
      photo: responseFormatter.createPhotoObject(photoExists.exists, ''),
      photoExistsBefore: true,
    };

    return sendResponse(req, res, jsonResponse);
  }

  const dbPhoto = await addPhotoToDB(photoWaiting.photo);

  req.logger?.debug('Photo added successfully to db.');

  try {
    req.logger?.debug('Adding photo to disk.');
    await addPhotoToDisk(dbPhoto, image64);
  } catch (err) {
    req.logger?.debug('Could not add photo to disk, removing photo from db');
    await deletePhotoByIdFromDB(dbPhoto.id);

    if (err instanceof PhotoParsingError) {
      req.logger?.error('Format not supported.', err);
      return sendFailedMessage(req, res, `Format not supported`, 'FORMAT_NOT_SUPPORTED');
    }

    throw err;
  }

  req.logger?.debug('Photo added to disk.');

  const jsonResponse = {
    lenReceived: photoWaiting.received,
    lenWaiting: photoWaiting.image64Len,
    done: true,
    photo: responseFormatter.createPhotoObject(dbPhoto, ''),
    photoExistsBefore: false,
  };

  return sendResponse(req, res, jsonResponse);
};

function arePartsValid(parts: Map<number, string>) {
  const totalNumberOfParts = parts.size;

  for (let i = 0; i < totalNumberOfParts; i++) {
    if (!parts.has(i)) {
      return false;
    }
  }
  return true;
}

function joinParts(parts: Map<number, string>) {
  const totalNumberOfParts = parts.size;

  let ret = '';
  for (let i = 0; i < totalNumberOfParts; i++) {
    ret = ret.concat(parts.get(i) as string);
  }
  return ret;
}

export default {
  endpoint: AddPhotoPart.endpoint,
  callback: callback,
  method: 'post',
  middleWare: assertUserToken,
  requestShema: AddPhotoPart.RequestSchema,
} as EndpointType;
