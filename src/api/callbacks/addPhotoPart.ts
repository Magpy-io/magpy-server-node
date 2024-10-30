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
  try {
    if (!req.userId) {
      throw new Error('UserId is not defined.');
    }

    if (body.partSize != body.photoPart.length) {
      console.log('Bad request parameters');
      console.log('Sending response message');
      return responseFormatter.sendFailedBadRequest(
        req,
        res,
        'photoPart length and partSize do not match',
      );
    }

    if (!FilesWaiting.has(body.id)) {
      console.log(`No photo transfer for id ${body.id} was found.`);
      console.log('Sending response message.');
      return sendFailedMessage(
        req,
        res,
        `No photo transfer for id ${body.id} was found.`,
        'PHOTO_TRANSFER_NOT_FOUND',
      );
    }

    console.log(`Photo transfer for id ${body.id} found.`);

    const photoWaiting = FilesWaiting.get(body.id)!;
    photoWaiting.received += body.partSize;
    photoWaiting.dataParts.set(body.partNumber, body.photoPart);

    if (photoWaiting.received < photoWaiting.image64Len) {
      console.log(
        'Photo part added. (' +
          photoWaiting.received.toString() +
          '/' +
          photoWaiting.image64Len.toString() +
          ')',
      );
      console.log('Reseting timeout.');

      clearTimeout(photoWaiting.timeout);
      photoWaiting.timeout = setTimeout(() => {
        console.log(`Photo transfer for id ${body.id} timed out.`);
        console.log(`Deleting pending transfer for id ${body.id}`);
        FilesWaiting.delete(body.id);
      }, postPhotoPartTimeout);

      console.log('Sending response message.');
      return sendResponse(res, {
        lenReceived: photoWaiting.received,
        lenWaiting: photoWaiting.image64Len,
        done: false,
      });
    }

    if (photoWaiting.received > photoWaiting.image64Len) {
      console.log(
        `Transfered data (${photoWaiting.received}) exceeds initial image size (${photoWaiting.image64Len}).`,
      );

      console.log(`Deleting pending transfer for id ${body.id}`);
      clearTimeout(photoWaiting.timeout);
      FilesWaiting.delete(body.id);

      console.log('Sending response message.');
      return sendFailedMessage(
        req,
        res,
        `Transfered data (${photoWaiting.received}) exceeds initial image size (${photoWaiting.image64Len}).`,
        'PHOTO_SIZE_EXCEEDED',
      );
    }

    console.log(
      'Full image received. (' +
        photoWaiting.image64Len.toString() +
        '/' +
        photoWaiting.image64Len.toString() +
        ')',
    );

    console.log('Removing timeout');
    clearTimeout(photoWaiting.timeout);

    if (!arePartsValid(photoWaiting.dataParts)) {
      console.log(`Deleting pending transfer for id ${body.id}`);
      clearTimeout(photoWaiting.timeout);
      FilesWaiting.delete(body.id);

      console.log('Sending response message.');
      return sendFailedMessage(req, res, `Not all parts were found`, 'MISSING_PARTS');
    }

    const image64 = joinParts(photoWaiting.dataParts);

    const hash = hashFile(image64);
    photoWaiting.photo.hash = hash;

    console.log(`Deleting pending transfer for id ${body.id}`);
    FilesWaiting.delete(body.id);

    const photoExists = await checkPhotoExistsAndDeleteMissing({
      mediaId: photoWaiting.photo.mediaId,
      deviceUniqueId: photoWaiting.photo.deviceUniqueId,
    });

    if (photoExists.exists) {
      console.log('Photo exists in db');

      const jsonResponse = {
        lenReceived: photoWaiting.received,
        lenWaiting: photoWaiting.image64Len,
        done: true,
        photo: responseFormatter.createPhotoObject(photoExists.exists, ''),
        photoExistsBefore: true,
      };

      console.log('Sending response message.');
      return sendResponse(res, jsonResponse);
    }

    const dbPhoto = await addPhotoToDB(photoWaiting.photo);

    console.log('Photo added successfully to db.');

    try {
      console.log('Adding photo to disk.');
      await addPhotoToDisk(dbPhoto, image64);
    } catch (err) {
      console.log('Could not add photo to disk, removing photo from db');
      await deletePhotoByIdFromDB(dbPhoto.id);

      if (err instanceof PhotoParsingError) {
        console.log('Format not supported.');
        console.log(err);
        return sendFailedMessage(req, res, `Format not supported`, 'FORMAT_NOT_SUPPORTED');
      }

      throw err;
    }

    console.log('Photo added to disk.');

    const jsonResponse = {
      lenReceived: photoWaiting.received,
      lenWaiting: photoWaiting.image64Len,
      done: true,
      photo: responseFormatter.createPhotoObject(dbPhoto, ''),
      photoExistsBefore: false,
    };
    console.log('Sending response message.');
    return sendResponse(res, jsonResponse);
  } catch (err) {
    console.error(err);
    return responseFormatter.sendErrorMessage(req, res);
  }
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
