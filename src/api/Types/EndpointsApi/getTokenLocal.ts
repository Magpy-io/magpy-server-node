import Joi from 'joi';

import { ErrorInvalidCredentials, ErrorServerNotClaimed } from '../ErrorTypes';
import { TokenAuthentification } from '../Types';

export type ResponseData = string;

export const RequestSchema = Joi.object({
  username: Joi.string(),
  password: Joi.string(),
})
  .options({ presence: 'required' })
  .meta({ className: 'RequestData' });

export type ResponseErrorTypes = ErrorServerNotClaimed | ErrorInvalidCredentials;

export const endpoint = 'getTokenLocal';

export const tokenAuth: TokenAuthentification = 'set-token';

//auto-generated file using "yarn types"
export * from '../RequestTypes/getTokenLocal';
