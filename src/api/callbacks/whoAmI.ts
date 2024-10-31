import { Request, Response } from 'express';

import assertUserToken from '../../middleware/userToken/assertUserToken';
import { WhoAmI } from '../Types';
import responseFormatter from '../responseFormatter';
import { EndpointType, ExtendedRequest } from '../endpointsLoader';

const { sendResponse, sendFailedMessage } = responseFormatter.getCustomSendResponse<
  WhoAmI.ResponseData,
  WhoAmI.ResponseErrorTypes
>();

const callback = async (req: ExtendedRequest, res: Response, body: WhoAmI.RequestData) => {
  if (!req.userId) {
    throw new Error('UserId is not defined.');
  }

  const userId = req.userId;
  const jsonResponse = {
    user: { id: userId },
  };

  console.log('Token verified, sending confirmation');
  return sendResponse(req, res, jsonResponse);
};

export default {
  endpoint: WhoAmI.endpoint,
  callback: callback,
  method: 'post',
  middleWare: assertUserToken,
  requestShema: WhoAmI.RequestSchema,
} as EndpointType;
