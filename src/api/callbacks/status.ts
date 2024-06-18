import { Request, Response } from 'express';

import { Status } from '../Types';
import responseFormatter from '../responseFormatter';
import { EndpointType, ExtendedRequest } from '../endpointsLoader';
import { IsServerClaimedLocal, IsServerClaimedRemote } from '../../modules/serverDataManager';
import checkServerHasValidCredentials from '../../middleware/checkServerHasValidCredentials';

const sendResponse = responseFormatter.getCustomSendResponse<Status.ResponseData>();

const callback = async (req: ExtendedRequest, res: Response, body: Status.RequestData) => {
  try {
    return sendResponse(res, 'Server ok');
  } catch (err) {
    console.error(err);
    return responseFormatter.sendErrorMessage(res);
  }
};

export default {
  endpoint: Status.endpoint,
  callback: callback,
  method: 'post',
  requestShema: Status.RequestSchema,
} as EndpointType;
