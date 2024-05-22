import { Request } from 'express';

export interface ExtendedRequest extends Request {
  hasValidCredentials?: boolean;
  isClaimedRemote?: boolean;
  userId?: string;
  token?: string;
}
