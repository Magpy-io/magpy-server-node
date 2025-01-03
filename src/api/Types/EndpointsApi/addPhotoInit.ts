import Joi from 'joi';

import { ErrorServerNotClaimed, ErrorsAuthorization } from '../ErrorTypes';
import { APIPhoto, TokenAuthentification } from '../Types';

export type ResponseData =
  | {
      id: string;
      photoExistsBefore: false;
    }
  | {
      photo: APIPhoto;
      photoExistsBefore: true;
    };

export const RequestSchema = Joi.object({
  name: Joi.string(),
  fileSize: Joi.number().integer(),
  width: Joi.number().integer(),
  height: Joi.number().integer(),
  mediaId: Joi.string(),
  date: Joi.string().isoDate(),
  image64Len: Joi.number(),
  deviceUniqueId: Joi.string(),
})
  .options({ presence: 'required' })
  .meta({ className: 'RequestData' });

export type ResponseErrorTypes = ErrorServerNotClaimed | ErrorsAuthorization;

export const endpoint = 'addPhotoInit';

export const tokenAuth: TokenAuthentification = 'yes';

//auto-generated file using "yarn types"
export * from '../RequestTypes/addPhotoInit';
