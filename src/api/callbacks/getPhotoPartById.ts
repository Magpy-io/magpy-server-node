import { Request, Response } from 'express';

import { getPhotoByIdFromDB } from '../../db/sequelizeDb';
import assertUserToken from '../../middleware/userToken/assertUserToken';
import { getPhotoFromDisk } from '../../modules/diskManager';
import {
  AddWarningPhotosMissing,
  checkPhotoExistsAndDeleteMissing,
} from '../../modules/functions';
import { getNumberOfParts, getPartN } from '../../modules/stringHelper';
import { GetPhotoPartById } from '../Types';
import responseFormatter from '../responseFormatter';
import { EndpointType, ExtendedRequest } from '../endpointsLoader';

const { sendResponse, sendFailedMessage } = responseFormatter.getCustomSendResponse<
  GetPhotoPartById.ResponseData,
  GetPhotoPartById.ResponseErrorTypes
>();

const callback = async (
  req: ExtendedRequest,
  res: Response,
  body: GetPhotoPartById.RequestData,
) => {
  if (!req.userId) {
    throw new Error('UserId is not defined.');
  }

  const { id, part } = body;

  req.logger?.debug('Checking photo exists');

  const dbPhoto = await getPhotoByIdFromDB(id);

  if (!dbPhoto) {
    req.logger?.debug('Photo not found in db.');

    return sendFailedMessage(req, res, `Photo with id: ${id} not found`, 'ID_NOT_FOUND');
  } else {
    req.logger?.debug('Photo found in db, retrieving photo from disk.');

    const image64 = await getPhotoFromDisk(dbPhoto, 'original');

    if (image64 == null) {
      req.logger?.debug('Photo not found in disk');

      AddWarningPhotosMissing([dbPhoto], req.userId);

      const jsonResponse = {
        photo: responseFormatter.createPhotoObject(dbPhoto, ''),
        part: 0,
        totalNbOfParts: 0,
      };
      return sendResponse(req, res, jsonResponse, true);
    }

    req.logger?.debug('Photo retrieved.');

    const totalNbOfParts = getNumberOfParts(image64);

    if (0 <= part && part < totalNbOfParts) {
      const ImagePart = getPartN(image64, part);
      const jsonResponse = {
        photo: responseFormatter.createPhotoObject(dbPhoto, ImagePart),
        part: part,
        totalNbOfParts: totalNbOfParts,
      };
      return sendResponse(req, res, jsonResponse);
    } else {
      req.logger?.debug(
        `Part number ${part} must be between 0 and ${totalNbOfParts - 1} included`,
      );

      return sendFailedMessage(
        req,
        res,
        `Part number ${part} must be between 0 and ${totalNbOfParts - 1} included`,
        'INVALID_PART_NUMBER',
      );
    }
  }
};

export default {
  endpoint: GetPhotoPartById.endpoint,
  callback: callback,
  method: 'post',
  middleWare: assertUserToken,
  requestShema: GetPhotoPartById.RequestSchema,
} as EndpointType;
