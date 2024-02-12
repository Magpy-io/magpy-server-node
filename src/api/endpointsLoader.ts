import { NextFunction, Request, Response, Express } from 'express';
import Joi from 'joi';
import * as callbacks from './callbacks';
import { generateMiddlewareFromShema } from '../middleware/checkValidRequestParameters';

export type EndpointType = {
  endpoint: string;
  callback: (
    req: Request,
    res: Response,
    body: any,
  ) => Promise<Response<any, Record<string, any>>>;
  method: 'post';
  middleWare?: MiddleWareType | MiddleWareArray;
  requestShema: Joi.ObjectSchema;
};

function getEndpoints(): EndpointType[] {
  return Object.values(callbacks).map(callback => callback.default);
}

type MiddleWareType = (req: Request, res: Response, next: NextFunction) => {};

type MiddleWareArray = MiddleWareType[];

function loadEndpoints(app: Express) {
  const endpoints = getEndpoints();
  endpoints.forEach(({ endpoint, callback, method, middleWare, requestShema }) => {
    const reqParamValidationMiddleware = generateMiddlewareFromShema(requestShema);

    const callbackFormated = (req: Request, res: Response) => {
      console.log(endpoint);
      callback(req, res, req.body);
    };
    const endpointFormatted = '/' + endpoint;

    let middleWareArray: MiddleWareArray;

    if (middleWare) {
      if (middleWare instanceof Array) {
        middleWareArray = middleWare;
      } else {
        middleWareArray = [middleWare];
      }
    } else {
      middleWareArray = [];
    }

    // execute parameter validation just before endpoint callback
    middleWareArray.push(reqParamValidationMiddleware);

    app[method](endpointFormatted, ...middleWareArray, callbackFormated);
  });
}

export default loadEndpoints;
