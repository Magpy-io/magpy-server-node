import { Request, Response } from 'express';

import { Status } from '../Types';
import responseFormatter from '../responseFormatter';
import { EndpointType, ExtendedRequest } from '../endpointsLoader';
import { IsServerClaimedLocal, IsServerClaimedRemote } from '../../modules/serverDataManager';
import checkServerHasValidCredentials from '../../middleware/checkServerHasValidCredentials';

const { sendResponse, sendFailedMessage } = responseFormatter.getCustomSendResponse<
  Status.ResponseData,
  Status.ResponseErrorTypes
>();

const callback = async (req: ExtendedRequest, res: Response, body: Status.RequestData) => {
  return sendResponse(res, 'Server ok');
};

export default {
  endpoint: Status.endpoint,
  callback: callback,
  method: 'post',
  requestShema: Status.RequestSchema,
} as EndpointType;
