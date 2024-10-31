import { Request, Response } from 'express';

import { countPhotosInDB } from '../../db/sequelizeDb';
import assertUserToken from '../../middleware/userToken/assertUserToken';
import { GetNumberPhotos } from '../Types';
import responseFormatter from '../responseFormatter';
import { EndpointType, ExtendedRequest } from '../endpointsLoader';

const { sendResponse } = responseFormatter.getCustomSendResponse<
  GetNumberPhotos.ResponseData,
  GetNumberPhotos.ResponseErrorTypes
>();

const callback = async (
  req: ExtendedRequest,
  res: Response,
  body: GetNumberPhotos.RequestData,
) => {
  console.log('Getting number of photos in db.');
  const nb = await countPhotosInDB();
  console.log(`Number of photos found in db: ${nb}.`);
  const jsonResponse = {
    number: nb,
  };
  console.log('Sending response data.');
  return sendResponse(req, res, jsonResponse);
};

export default {
  endpoint: GetNumberPhotos.endpoint,
  callback: callback,
  method: 'post',
  middleWare: assertUserToken,
  requestShema: GetNumberPhotos.RequestSchema,
} as EndpointType;
