import Joi from 'joi';

import { TokenAuthentification } from '../Types';

export type ResponseData = string;

export const RequestSchema = Joi.object({})
  .options({ presence: 'required' })
  .meta({ className: 'RequestData' });

export type ResponseErrorTypes = null;

export const endpoint = 'status';

export const tokenAuth: TokenAuthentification = 'no';

//auto-generated file using "yarn types"
export * from '../RequestTypes/status';
