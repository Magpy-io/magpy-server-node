import { NextFunction, Response } from 'express';
import { ExtendedRequest } from '../types/express/ExtendedRequest';
import { Logger } from '../modules/Logger';
import responseFormatter from '../api/responseFormatter';

export function addLogger(req: ExtendedRequest, res: Response, next: NextFunction) {
  try {
    req.logger = Logger.child({ requestId: req.id, url: req.originalUrl });
    req.logger.http('Request received', { type: 'request' });
    next();
  } catch (err) {
    console.error(err);
    responseFormatter.sendErrorMessage(req, res);
  }
}
