import { NextFunction, Response } from 'express';
import { ExtendedRequest } from 'src/types/express/ExtendedRequest';
import { NewRequestId } from 'src/modules/RequestIdGenerator';

export function requestID(req: ExtendedRequest, res: Response, next: NextFunction) {
  req.id = NewRequestId();
  next();
}
