import { Request } from 'express';

export interface ExtendedRequest extends Request {
  hasValidCredentials?: boolean;
  isClaimedRemote?: boolean;
  isClaimedLocal?: boolean;
  userId?: string;
  token?: string;
}
