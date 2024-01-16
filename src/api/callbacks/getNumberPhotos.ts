import { Request, Response } from "express";
import responseFormatter from "../responseFormatter";
import { numberPhotosFromDB } from "../../db/sequelizeDb";

import checkUserToken from "../../middleware/checkUserToken";

import { GetNumberPhotos } from "../Types";

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
