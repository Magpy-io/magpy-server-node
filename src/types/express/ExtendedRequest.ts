import { Request } from 'express';
import { ServerDataType } from '../../modules/serverDataManager';

export interface ExtendedRequest extends Request {
  serverData?: ServerDataType;
  hasValidCredentials?: boolean;
  isClaimed?: boolean;
  userId?: string;
  token?: string;
}
