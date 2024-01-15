import { Request, Response } from "express";
import responseFormatter from "@src/api/responseFormatter";
import { numberPhotosFromDB } from "@src/db/sequelizeDb";

import Joi from "joi";
import checkUserToken from "@src/middleware/checkUserToken";

import { GetNumberPhotos } from "@src/api/Types";

const sendResponse =
  responseFormatter.getCustomSendResponse<GetNumberPhotos.ResponseData>();

const callback = async (req: Request, res: Response) => {
  try {
    console.log("Getting number of photos in db.");
    const nb = await numberPhotosFromDB();
    console.log(`Number of photos found in db: ${nb}.`);
    const jsonResponse = {
      number: nb,
    };
    console.log("Sending response data.");
    return sendResponse(res, jsonResponse);
  } catch (err) {
    console.error(err);
    return responseFormatter.sendErrorMessage(res);
  }
};

export default {
  endpoint: GetNumberPhotos.endpoint,
  callback: callback,
  method: "post",
  middleWare: checkUserToken,
  requestShema: GetNumberPhotos.RequestSchema,
};
