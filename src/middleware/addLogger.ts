import { NextFunction, Response } from 'express';
import { ExtendedRequest } from '../types/express/ExtendedRequest';
import { Logger } from '../modules/Logger';

export function addLogger(req: ExtendedRequest, res: Response, next: NextFunction) {
  req.logger = Logger.child({ requestId: req.id });
  next();
}
