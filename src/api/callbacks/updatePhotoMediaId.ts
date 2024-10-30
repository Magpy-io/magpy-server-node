import { Request, Response } from 'express';

import { updatePhotoMediaIdById } from '../../db/sequelizeDb';
import assertUserToken from '../../middleware/userToken/assertUserToken';
import {
  AddWarningPhotosDeleted,
  checkPhotoExistsAndDeleteMissing,
} from '../../modules/functions';
import { UpdatePhotoMediaId } from '../Types';
import responseFormatter from '../responseFormatter';
import { EndpointType, ExtendedRequest } from '../endpointsLoader';

const { sendResponse, sendFailedMessage } = responseFormatter.getCustomSendResponse<
  UpdatePhotoMediaId.ResponseData,
  UpdatePhotoMediaId.ResponseErrorTypes
>();

const callback = async (
  req: ExtendedRequest,
  res: Response,
  body: UpdatePhotoMediaId.RequestData,
) => {
  if (!req.userId) {
    throw new Error('UserId is not defined.');
  }

  const { id, mediaId, deviceUniqueId } = body;

  try {
    console.log(`Searching in db for photo with id: ${id}`);

    const ret = await checkPhotoExistsAndDeleteMissing({
      id: id,
    });

    const warning = ret.warning;
    if (warning) {
      AddWarningPhotosDeleted([ret.deleted], req.userId);
    }

    if (!ret.exists) {
      console.log('Photo does not exist in server.');
      console.log('Sending response message.');
      return sendFailedMessage(
        req,
        res,
        `Photo with id ${id} not found in server`,
        'ID_NOT_FOUND',
        warning,
      );
    } else {
      console.log('Photo found');

      console.log('Photo mediaId does not exist in db');
      console.log('Updating mediaId in db');
      await updatePhotoMediaIdById(id, mediaId, deviceUniqueId);

      console.log('Photo updated successfully.');
      console.log('Sending response message.');
      return sendResponse(res, `Photo with id ${id} successfully updated with new mediaId`);
    }
  } catch (err) {
    console.error(err);
    return responseFormatter.sendErrorMessage(req, res);
  }
};

export default {
  endpoint: UpdatePhotoMediaId.endpoint,
  callback: callback,
  method: 'post',
  middleWare: assertUserToken,
  requestShema: UpdatePhotoMediaId.RequestSchema,
} as EndpointType;
