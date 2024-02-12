import { Request, Response } from 'express';

import checkUserToken from '../../middleware/checkUserToken';
import { WhoAmI } from '../Types';
import responseFormatter from '../responseFormatter';
import { EndpointType } from '../endpointsLoader';

const sendResponse = responseFormatter.getCustomSendResponse<WhoAmI.ResponseData>();

const callback = async (req: Request, res: Response, body: WhoAmI.RequestData) => {
  try {
    if (!req.userId) {
      throw new Error('UserId is not defined.');
    }

    const userId = req.userId;
    const jsonResponse = {
      user: { id: userId },
    };
    console.log('Token verified, sending confirmation');
    return sendResponse(res, jsonResponse);
  } catch (err) {
    console.error(err);
    return responseFormatter.sendErrorMessage(res);
  }
};

export default {
  endpoint: WhoAmI.endpoint,
  callback: callback,
  method: 'post',
  middleWare: checkUserToken,
  requestShema: WhoAmI.RequestSchema,
} as EndpointType;
