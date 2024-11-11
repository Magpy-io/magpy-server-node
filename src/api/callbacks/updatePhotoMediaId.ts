import { Request, Response } from 'express';

import { updatePhotoMediaIdById } from '../../db/sequelizeDb';
import assertUserToken from '../../middleware/userToken/assertUserToken';
import {
  AddWarningPhotosMissing,
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

  req.logger?.debug(`Searching in db for photo with id: ${id}`);

  const ret = await checkPhotoExistsAndDeleteMissing({
    id: id,
  });

  const warning = ret.warning;
  if (warning) {
    AddWarningPhotosMissing([ret.deleted], req.userId);
  }

  if (!ret.exists) {
    req.logger?.debug('Photo does not exist in server.');

    return sendFailedMessage(
      req,
      res,
      `Photo with id ${id} not found in server`,
      'ID_NOT_FOUND',
      warning,
    );
  } else {
    req.logger?.debug('Photo found and mediaId does not exist in db');
    req.logger?.debug('Updating mediaId in db');
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
