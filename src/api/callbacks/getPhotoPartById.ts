import { Request, Response } from 'express';

import { getPhotoByIdFromDB } from '../../db/sequelizeDb';
import assertUserToken from '../../middleware/userToken/assertUserToken';
import { getPhotoFromDisk } from '../../modules/diskManager';
import {
  AddWarningPhotosDeleted,
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
  try {
    if (!req.userId) {
      throw new Error('UserId is not defined.');
    }

    const { id, part } = body;

    console.log('Checking photo exists');

    const ret = await checkPhotoExistsAndDeleteMissing({
      id: id,
    });
    const warning = ret.warning;
    if (warning) {
      AddWarningPhotosDeleted([ret.deleted], req.userId);
    }

    if (!ret.exists) {
      console.log('Photo not found in db.');
      console.log('Sending response message.');
      return sendFailedMessage(
        req,
        res,
        `Photo with id: ${id} not found`,
        'ID_NOT_FOUND',
        warning,
      );
    } else {
      console.log('Photo found in db.');
      console.log(`Getting photo with id = ${id} from db.`);
      const dbPhoto = await getPhotoByIdFromDB(id);

      if (!dbPhoto) {
        throw new Error('getPhotoPartById: photo exists but cannot retrieve from db');
      }

      console.log('Retrieving photo from disk.');
      const image64 = await getPhotoFromDisk(dbPhoto, 'original');
      console.log('Photo retrieved.');
      console.log('Sending response data.');

      const totalNbOfParts = getNumberOfParts(image64);

      if (0 <= part && part < totalNbOfParts) {
        const ImagePart = getPartN(image64, part);
        const jsonResponse = {
          photo: responseFormatter.createPhotoObject(dbPhoto, ImagePart),
          part: part,
          totalNbOfParts: totalNbOfParts,
        };
        return sendResponse(res, jsonResponse);
      } else {
        console.log(
          `Part number ${part} must be between 0 and ${totalNbOfParts - 1} included`,
        );
        console.log('Sending response message.');
        return sendFailedMessage(
          req,
          res,
          `Part number ${part} must be between 0 and ${totalNbOfParts - 1} included`,
          'INVALID_PART_NUMBER',
        );
      }
    }
  } catch (err) {
    console.error(err);
    return responseFormatter.sendErrorMessage(req, res);
  }
};

export default {
  endpoint: GetPhotoPartById.endpoint,
  callback: callback,
  method: 'post',
  middleWare: assertUserToken,
  requestShema: GetPhotoPartById.RequestSchema,
} as EndpointType;
