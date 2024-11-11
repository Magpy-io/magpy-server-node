import { Request } from 'express';
import { ErrorCodes } from '../../api/Types/ErrorTypes';
import { CustomLogger } from '../../modules/Logger';

export interface ExtendedRequest extends Request {
  hasValidCredentials?: boolean;
  isClaimedRemote?: boolean;
  userId?: string;
  userIdError?: { message: string; code: ErrorCodes };
  token?: string;
  tokenError?: { message: string; code: ErrorCodes };
  isConnexionLocal?: boolean;
  id?: string;
  logger?: CustomLogger;
}
