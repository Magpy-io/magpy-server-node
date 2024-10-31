import { randomBytes } from 'crypto';
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
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

const { sendResponse, sendFailedMessage } = responseFormatter.getCustomSendResponse<
  ClaimServerLocal.ResponseData,
  ClaimServerLocal.ResponseErrorTypes
>();

const callback = async (
  req: ExtendedRequest,
  res: Response,
  body: ClaimServerLocal.RequestData,
) => {
  const { username, password } = body;

  if (IsServerClaimedAny()) {
    console.log('server already claimed');
    return sendFailedMessage(req, res, 'Server already claimed', 'SERVER_ALREADY_CLAIMED');
  }

  console.log('server not claimed, saving claiming user.');

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  await SaveServerLocalClaimInfo({
    username: username,
    passwordHash: hashedPassword,
    userId: uuid(),
  });

  return sendResponse(req, res, 'ok');
};

export default {
  endpoint: ClaimServerLocal.endpoint,
  callback: callback,
  method: 'post',
  requestShema: ClaimServerLocal.RequestSchema,
} as EndpointType;
