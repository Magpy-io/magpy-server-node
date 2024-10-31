import { Request, Response } from 'express';

import assertUserToken from '../../middleware/userToken/assertUserToken';
import { GetLastWarningForUser } from '../../modules/warningsManager';
import { GetLastWarning } from '../Types';
import responseFormatter from '../responseFormatter';
import { EndpointType, ExtendedRequest } from '../endpointsLoader';

const { sendResponse, sendFailedMessage } = responseFormatter.getCustomSendResponse<
  GetLastWarning.ResponseData,
  GetLastWarning.ResponseErrorTypes
>();

const callback = async (
  req: ExtendedRequest,
  res: Response,
  body: GetLastWarning.RequestData,
) => {
  if (!req.userId) {
    throw new Error('UserId is not defined.');
  }

  const userId = req.userId;

  const warning = GetLastWarningForUser(userId);

  const jsonResponse = {
    warning: warning ? warning : null,
  };
  req.logger?.debug('Warning found, sending response');
  return sendResponse(req, res, jsonResponse);
};

export default {
  endpoint: GetLastWarning.endpoint,
  callback: callback,
  method: 'post',
  middleWare: assertUserToken,
  requestShema: GetLastWarning.RequestSchema,
} as EndpointType;
