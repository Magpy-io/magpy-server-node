import { NextFunction, Response } from 'express';
import { ExtendedRequest } from '../types/express/ExtendedRequest';
import { NewRequestId } from '../modules/RequestIdGenerator';
import { Logger } from 'src/modules/Logger';

export function addLogger(req: ExtendedRequest, res: Response, next: NextFunction) {
  req.logger = Logger.child({ requestId: req.id });
  next();
}
