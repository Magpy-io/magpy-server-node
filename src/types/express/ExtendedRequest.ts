import { Request } from 'express';
import { ErrorCodes } from 'src/api/Types/ErrorTypes';
import winston from 'winston';

export interface ExtendedRequest extends Request {
  hasValidCredentials?: boolean;
  isClaimedRemote?: boolean;
  userId?: string;
  userIdError?: { message: string; code: ErrorCodes };
  token?: string;
  tokenError?: { message: string; code: ErrorCodes };
  isConnexionLocal?: boolean;
  id?: string;
  logger?: winston.Logger;
}
