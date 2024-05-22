import { Request } from 'express';
import { ServerDataType } from '../../modules/serverDataManager';

export interface ExtendedRequest extends Request {
  hasValidCredentials?: boolean;
  isClaimed?: boolean;
  userId?: string;
  token?: string;
}
