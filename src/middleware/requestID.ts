import { NextFunction, Response } from 'express';
import { ExtendedRequest } from '../types/express/ExtendedRequest';
import { NewRequestId } from '../modules/RequestIdGenerator';

export function requestID(req: ExtendedRequest, res: Response, next: NextFunction) {
  req.id = NewRequestId();
  next();
}
