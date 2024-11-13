import { Request, Response } from 'express';

import { getPhotoByIdFromDB, updatePhotoMediaIdById } from '../../db/sequelizeDb';
import assertUserToken from '../../middleware/userToken/assertUserToken';
import { AddWarningPhotosMissing } from '../../modules/functions';
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

  req.logger?.debug(`Searching in db for photo with id: ${id}`);

  const photo = await getPhotoByIdFromDB(id);

  if (!photo) {
    req.logger?.debug('Photo does not exist in server.');

    return sendFailedMessage(
      req,
      res,
      `Photo with id ${id} not found in server`,
      'ID_NOT_FOUND',
      false,
    );
  } else {
    req.logger?.debug('Photo found in db, updating mediaId');

    await updatePhotoMediaIdById(id, mediaId, deviceUniqueId);

    req.logger?.debug('Photo updated successfully.');

    return sendResponse(req, res, `Photo with id ${id} successfully updated with new mediaId`);
  }
};

export default {
  endpoint: UpdatePhotoMediaId.endpoint,
  callback: callback,
  method: 'post',
  middleWare: assertUserToken,
  requestShema: UpdatePhotoMediaId.RequestSchema,
} as EndpointType;
