import Joi from 'joi';

import {
  ErrorPathAccessDenied,
  ErrorPathFolderDoesNotExist,
  ErrorCouldNotGetRequestAddress,
  ErrorAuthorizationFailed,
  ErrorPathNotAbsolute,
} from '../ErrorTypes';
import { TokenAuthentification } from '../Types';

export type ResponseData = string;

export const RequestSchema = Joi.object({
  path: Joi.string().optional(),
})
  .options({ presence: 'required' })
  .meta({ className: 'RequestData' });

export type ResponseErrorTypes =
  | ErrorAuthorizationFailed
  | ErrorPathFolderDoesNotExist
  | ErrorPathAccessDenied
  | ErrorCouldNotGetRequestAddress
  | ErrorPathNotAbsolute;

export const endpoint = 'updateServerPath';

export const tokenAuth: TokenAuthentification = 'optional';

//auto-generated file using "yarn types"
export * from '../RequestTypes/updateServerPath';
