import { NextFunction, Request, Response } from 'express';

import responseFormatter from '../api/responseFormatter';
import { ExtendedRequest } from '../api/endpointsLoader';

export function unexpectedErrorHandler(
  err: any,
  req: ExtendedRequest,
  res: Response,
  next: NextFunction,
) {
  req.logger?.error(err);
  responseFormatter.sendErrorMessage(req, res);
}
