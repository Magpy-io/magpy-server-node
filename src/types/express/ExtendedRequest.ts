import { Request } from 'express';
import { ErrorCodes } from 'src/api/Types/ErrorTypes';

export interface ExtendedRequest extends Request {
  hasValidCredentials?: boolean;
  isClaimedRemote?: boolean;
  userId?: string;
  userIdError?: { message: string; code: ErrorCodes };
  token?: string;
  isConnexionLocal?: boolean;
}
