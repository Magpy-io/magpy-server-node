import Joi from 'joi';

import { ErrorServerNotClaimed, ErrorsAuthorization } from '../ErrorTypes';
import { APIPhoto, PhotoTypesArray, TokenAuthentification } from '../Types';

export type ResponseData = {
  number: number;
  photos: Array<
    { mediaId: string; exists: false } | { mediaId: string; exists: true; photo: APIPhoto }
  >;
};

export const RequestSchema = Joi.object({
  photosData: Joi.array().items(
    Joi.object({
      mediaId: Joi.string(),
    }).options({ presence: 'required' }),
  ),
  photoType: Joi.string().valid(...PhotoTypesArray),
  deviceUniqueId: Joi.string().uuid({ version: 'uuidv4' }),
})
  .options({ presence: 'required' })
  .meta({ className: 'RequestData' });

export type ResponseErrorTypes = ErrorServerNotClaimed | ErrorsAuthorization;

export const endpoint = 'getPhotosByMediaId';

export const tokenAuth: TokenAuthentification = 'yes';

//auto-generated file using "yarn types"
export * from '../RequestTypes/getPhotosByMediaId';
