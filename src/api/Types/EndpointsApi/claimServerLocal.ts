import Joi from 'joi';

import {
  ErrorServerAlreadyClaimed,
} from '../ErrorTypes';
import { TokenAuthentification } from '../Types';

export type ResponseData = string;

export const RequestSchema = Joi.object({
  userName: Joi.string(),
  password: Joi.string(),
})
  .options({ presence: 'required' })
  .meta({ className: 'RequestData' });

export type ResponseErrorTypes =
  | ErrorServerAlreadyClaimed;

export const endpoint = 'claimServerLocal';

export const tokenAuth: TokenAuthentification = 'no';

//auto-generated file using "yarn types"
export * from '../RequestTypes/claimServerLocal';
