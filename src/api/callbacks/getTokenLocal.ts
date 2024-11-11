import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import checkServerIsClaimedRemote from '../../middleware/checkServerIsClaimedRemote';
import { GetServerInfo, TokenManager, WhoAmI } from '../../modules/BackendQueries';
import { ErrorBackendUnreachable } from '../../modules/BackendQueries/ExceptionsManager';
import {
  GetServerCredentials,
  GetServerLocalClaimInfo,
  GetServerSigningKey,
  GetServerToken,
  IsServerClaimedLocal,
  SaveServerSigningKey,
} from '../../modules/serverDataManager';
import { generateUserToken, verifyToken } from '../../modules/tokenManagement';
import { GetTokenLocal } from '../Types';
import responseFormatter from '../responseFormatter';
import { EndpointType, ExtendedRequest } from '../endpointsLoader';
import { randomBytes } from 'crypto';

const { sendResponse, sendFailedMessage } = responseFormatter.getCustomSendResponse<
  GetTokenLocal.ResponseData,
  GetTokenLocal.ResponseErrorTypes
>();

const callback = async (
  req: ExtendedRequest,
  res: Response,
  body: GetTokenLocal.RequestData,
) => {
  const { username, password } = body;

  if (!IsServerClaimedLocal()) {
    req.logger?.debug('server is not claimed');
    return sendFailedMessage(req, res, 'Server not claimed', 'SERVER_NOT_CLAIMED');
  }

  const localCredentials = GetServerLocalClaimInfo();

  if (!localCredentials) {
    throw new Error('Sever is claimed locally but localCredentials is empty.');
  }

  const passwordValid = await bcrypt.compare(password, localCredentials.passwordHash);

  if (localCredentials.username != username || !passwordValid) {
    req.logger?.debug('Wrong username or password.');
    return sendFailedMessage(req, res, 'Wrong username or password.', 'INVALID_CREDENTIALS');
  }

  req.logger?.debug('user has access to server, generating token');

  let serverSigningKey = GetServerSigningKey();

  if (!serverSigningKey) {
    req.logger?.debug(
      'First time generating token, generating signing key and saving it to server config.',
    );
    const keyGenerated = randomBytes(32).toString('hex');
    serverSigningKey = keyGenerated;
    await SaveServerSigningKey(keyGenerated);
  }

  const userToken = generateUserToken(localCredentials.userId, serverSigningKey);
  res.set('x-authorization', 'Bearer ' + userToken);

  return sendResponse(req, res, 'Token generated successfully');
};

export default {
  endpoint: GetTokenLocal.endpoint,
  callback: callback,
  method: 'post',
  requestShema: GetTokenLocal.RequestSchema,
} as EndpointType;
