import { Request, Response } from 'express';

import { postPhotoPartTimeout } from '../../config/config';
import { addPhotoToDB, deletePhotoByIdFromDB } from '../../db/sequelizeDb';
import checkUserToken from '../../middleware/checkUserToken';
import { addPhotoToDisk } from '../../modules/diskManager';
import { hashFile } from '../../modules/hashing';
import FilesWaiting, { FilesWaitingType } from '../../modules/waitingFiles';
import { AddPhotoPart } from '../Types';
import responseFormatter from '../responseFormatter';
import { EndpointType } from '../endpointsLoader';

const sendResponse = responseFormatter.getCustomSendResponse<AddPhotoPart.ResponseData>();

const callback = async (req: Request, res: Response, body: AddPhotoPart.RequestData) => {
  try {
    if (!req.userId) {
      throw new Error('UserId is not defined.');
    }

    if (body.partSize != body.photoPart.length) {
      console.log('Bad request parameters');
      console.log('Sending response message');
      return responseFormatter.sendFailedMessage(
        res,
        'photoPart length and partSize do not match',
        'BAD_REQUEST',
      );
    }

    if (!FilesWaiting.has(body.id)) {
      console.log(`No photo transfer for id ${body.id} was found.`);
      console.log('Sending response message.');
      return responseFormatter.sendFailedMessage(
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
      console.log('Photo part added.');
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
      return responseFormatter.sendFailedMessage(
        res,
        `Transfered data (${photoWaiting.received}) exceeds initial image size (${photoWaiting.image64Len}).`,
        'PHOTO_SIZE_EXCEEDED',
      );
    }
    console.log('Full image received.');

    console.log('Removing timeout');
    clearTimeout(photoWaiting.timeout);

    if (!arePartsValid(photoWaiting.dataParts)) {
      console.log(`Deleting pending transfer for id ${body.id}`);
      clearTimeout(photoWaiting.timeout);
      FilesWaiting.delete(body.id);

      console.log('Sending response message.');
      return responseFormatter.sendFailedMessage(
        res,
        `Not all parts were found`,
        'MISSING_PARTS',
      );
    }

    const image64 = joinParts(photoWaiting.dataParts);

    const hash = hashFile(image64);
    photoWaiting.photo.hash = hash;

    console.log(`Deleting pending transfer for id ${body.id}`);
    FilesWaiting.delete(body.id);

    const dbPhoto = await addPhotoToDB(photoWaiting.photo);

    console.log('Photo added successfully to db.');

    try {
      console.log('Adding photo to disk.');
      await addPhotoToDisk(dbPhoto, image64);
    } catch (err) {
      console.log('Could not add photo to disk, removing photo from db');
      await deletePhotoByIdFromDB(dbPhoto.id);
      throw err;
    }

    console.log('Photo added to disk.');

    const jsonResponse = {
      lenReceived: photoWaiting.received,
      lenWaiting: photoWaiting.image64Len,
      done: true,
      photo: responseFormatter.createPhotoObject(dbPhoto, ''),
    };
    console.log('Sending response message.');
    return sendResponse(res, jsonResponse);
  } catch (err) {
    console.error(err);
    return responseFormatter.sendErrorMessage(res);
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
  middleWare: checkUserToken,
  requestShema: AddPhotoPart.RequestSchema,
} as EndpointType;
