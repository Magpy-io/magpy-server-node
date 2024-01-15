import { generateMiddlewareFromShema } from "@src/middleware/checkValidRequestParameters";
import { Request, Response } from "express";
import Joi from "joi";
const fs = require("mz/fs");

function getEndpoints() {
  const endpoints: any = [];
  fs.readdirSync(__dirname + "/endpoints").forEach(function (file: any) {
    const split = file.split(".");

    //only .js and .ts files
    if (split[split.length - 1] == "ts" || split[split.length - 1] == "js") {
      endpoints.push(require("@src/api/endpoints/" + file).default);
    }
  });
  return endpoints;
}

function loadEndpoints(app: any) {
  const endpoints = getEndpoints();
  endpoints.forEach(
    ({
      endpoint,
      callback,
      method,
      middleWare,
      requestShema,
    }: {
      endpoint: string;
      callback: any;
      method: string;
      middleWare: any;
      requestShema: Joi.ObjectSchema;
    }) => {
      const reqParamValidationMiddleware =
        generateMiddlewareFromShema(requestShema);

      const callbackWithLogging = (req: Request, res: Response) => {
        console.log(endpoint);
        callback(req, res);
      };
      const endpointFormatted = "/" + endpoint;

      let middleWareArray;

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

      app[method](endpointFormatted, ...middleWareArray, callbackWithLogging);
    }
  );
}

export default loadEndpoints;
