import { randomBytes } from 'crypto';
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import checkServerIsClaimed from '../../middleware/checkServerIsClaimedRemote';
import { GetServerToken, RegisterServer, TokenManager } from '../../modules/BackendQueries';
import { ErrorBackendUnreachable } from '../../modules/BackendQueries/ExceptionsManager';
import { getMyPort, getMyPrivateIp, getMyPublicIp } from '../../modules/NetworkManager';
import {
  GetServerName,
  IsServerClaimedAny,
  SaveServerCredentials,
  SaveServerLocalClaimInfo,
  SaveServerToken,
} from '../../modules/serverDataManager';
import { ClaimServerLocal } from '../Types';
import responseFormatter from '../responseFormatter';
import { EndpointType, ExtendedRequest } from '../endpointsLoader';

const sendResponse = responseFormatter.getCustomSendResponse<ClaimServerLocal.ResponseData>();

const callback = async (
  req: ExtendedRequest,
  res: Response,
  body: ClaimServerLocal.RequestData,
) => {
  try {
    const { userName, password } = body;

    if (IsServerClaimedAny()) {
      console.log('server already claimed');
      return responseFormatter.sendFailedMessage(
        res,
        'Server already claimed',
        'SERVER_ALREADY_CLAIMED',
      );
    }

    console.log('server not claimed, saving claiming user.');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await SaveServerLocalClaimInfo({ username: userName, passwordHash: hashedPassword });

    return sendResponse(res, 'ok');
  } catch (err) {
    console.error(err);
    return responseFormatter.sendErrorMessage(res);
  }
};

export default {
  endpoint: ClaimServerLocal.endpoint,
  callback: callback,
  method: 'post',
  requestShema: ClaimServerLocal.RequestSchema,
} as EndpointType;
