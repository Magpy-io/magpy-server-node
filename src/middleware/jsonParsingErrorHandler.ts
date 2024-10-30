import { NextFunction, Request, Response } from 'express';

import responseFormatter from '../api/responseFormatter';
import { ExtendedRequest } from '../api/endpointsLoader';

function JsonParsingErrorHandler(
  err: any,
  req: ExtendedRequest,
  res: Response,
  next: NextFunction,
) {
  req.logger?.debug('Error parsing json body');
  responseFormatter.sendFailedBadRequest(req, res, 'Error parsing json body');
}

export default JsonParsingErrorHandler;
