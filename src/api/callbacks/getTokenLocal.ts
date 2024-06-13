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

const sendResponse = responseFormatter.getCustomSendResponse<GetTokenLocal.ResponseData>();

const callback = async (
  req: ExtendedRequest,
  res: Response,
  body: GetTokenLocal.RequestData,
) => {
  try {
    const { username, password } = body;

    if (!IsServerClaimedLocal()) {
      console.log('server is not claimed');
      return responseFormatter.sendFailedMessage(
        res,
        'Server not claimed',
        'SERVER_NOT_CLAIMED',
      );
    }

    const localCredentials = GetServerLocalClaimInfo();

    if (!localCredentials) {
      throw new Error('Sever is claimed locally but localCredentials is empty.');
    }

    const passwordValid = await bcrypt.compare(password, localCredentials.passwordHash);

    if (localCredentials.username != username || !passwordValid) {
      console.log('Wrong username or password.');
      return responseFormatter.sendFailedMessage(
        res,
        'Wrong username or password.',
        'INVALID_CREDENTIALS',
      );
    }

    console.log('user has access to server, generating token');

    let serverSigningKey = GetServerSigningKey();

    if (!serverSigningKey) {
      console.log(
        'First time generating token, generating signing key and saving it to server config.',
      );
      const keyGenerated = randomBytes(32).toString('hex');
      serverSigningKey = keyGenerated;
      await SaveServerSigningKey(keyGenerated);
    }

    const userToken = generateUserToken(localCredentials.userId, serverSigningKey);
    res.set('x-authorization', 'Bearer ' + userToken);

    console.log('sending response');
    return sendResponse(res, 'Token generated successfully');
  } catch (err) {
    console.error(err);
    return responseFormatter.sendErrorMessage(res);
  }
};

export default {
  endpoint: GetTokenLocal.endpoint,
  callback: callback,
  method: 'post',
  requestShema: GetTokenLocal.RequestSchema,
} as EndpointType;
