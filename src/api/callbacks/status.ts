import { Request, Response } from 'express';

import { Status } from '../Types';
import responseFormatter from '../responseFormatter';
import { EndpointType, ExtendedRequest } from '../endpointsLoader';
import { IsServerClaimedLocal, IsServerClaimedRemote } from '../../modules/serverDataManager';

const sendResponse = responseFormatter.getCustomSendResponse<Status.ResponseData>();

const callback = async (req: ExtendedRequest, res: Response, body: Status.RequestData) => {
  try {
    let claimed: 'Locally' | 'Remotely' | 'None' = 'None';

    if (IsServerClaimedLocal()) {
      claimed = 'Locally';
    }

    if (IsServerClaimedRemote()) {
      claimed = 'Remotely';
    }

    return sendResponse(res, { claimed });
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
