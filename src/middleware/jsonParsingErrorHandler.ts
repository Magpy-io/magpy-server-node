import { NextFunction, Request, Response } from 'express';

import responseFormatter from '../api/responseFormatter';
import { ExtendedRequest } from '../api/endpointsLoader';

function JsonParsingErrorHandler(
  err: any,
  req: ExtendedRequest,
  res: Response,
  next: NextFunction,
) {
  console.log('Error parsing json body');
  console.log('Sending response message');
  responseFormatter.sendFailedBadRequest(res, 'Error parsing json body');
}

export default JsonParsingErrorHandler;
