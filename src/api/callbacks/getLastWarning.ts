import { Request, Response } from 'express';

import assertUserToken from '../../middleware/userToken/assertUserToken';
import { GetLastWarningForUser } from '../../modules/warningsManager';
import { GetLastWarning } from '../Types';
import responseFormatter from '../responseFormatter';
import { EndpointType, ExtendedRequest } from '../endpointsLoader';

const sendResponse = responseFormatter.getCustomSendResponse<GetLastWarning.ResponseData>();

const callback = async (
  req: ExtendedRequest,
  res: Response,
  body: GetLastWarning.RequestData,
) => {
  try {
    if (!req.userId) {
      throw new Error('UserId is not defined.');
    }

    const userId = req.userId;

    const warning = GetLastWarningForUser(userId);

    const jsonResponse = {
      warning: warning ? warning : null,
    };
    console.log('Warning found, sending response');
    return sendResponse(res, jsonResponse);
  } catch (err) {
    console.error(err);
    return responseFormatter.sendErrorMessage(res);
  }
};

export default {
  endpoint: GetLastWarning.endpoint,
  callback: callback,
  method: 'post',
  middleWare: assertUserToken,
  requestShema: GetLastWarning.RequestSchema,
} as EndpointType;
