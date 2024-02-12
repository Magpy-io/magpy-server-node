import { Request, Response } from 'express';

import { numberPhotosFromDB } from '../../db/sequelizeDb';
import checkUserToken from '../../middleware/checkUserToken';
import { GetNumberPhotos } from '../Types';
import responseFormatter from '../responseFormatter';
import { EndpointType, ExtendedRequest } from '../endpointsLoader';

const sendResponse = responseFormatter.getCustomSendResponse<GetNumberPhotos.ResponseData>();

const callback = async (
  req: ExtendedRequest,
  res: Response,
  body: GetNumberPhotos.RequestData,
) => {
  try {
    console.log('Getting number of photos in db.');
    const nb = await numberPhotosFromDB();
    console.log(`Number of photos found in db: ${nb}.`);
    const jsonResponse = {
      number: nb,
    };
    console.log('Sending response data.');
    return sendResponse(res, jsonResponse);
  } catch (err) {
    console.error(err);
    return responseFormatter.sendErrorMessage(res);
  }
};

export default {
  endpoint: GetNumberPhotos.endpoint,
  callback: callback,
  method: 'post',
  middleWare: checkUserToken,
  requestShema: GetNumberPhotos.RequestSchema,
} as EndpointType;
