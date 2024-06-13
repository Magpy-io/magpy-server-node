import Joi from 'joi';

import { ErrorServerNotClaimed, ErrorsAuthorization } from '../ErrorTypes';
import { APIPhoto, TokenAuthentification } from '../Types';

export type ResponseData = { claimed: 'None' | 'Locally' | 'Remotely' };

export const RequestSchema = Joi.object({})
  .options({ presence: 'required' })
  .meta({ className: 'RequestData' });

export type ResponseErrorTypes = void;

export const endpoint = 'status';

export const tokenAuth: TokenAuthentification = 'no';

//auto-generated file using "yarn types"
export * from '../RequestTypes/status';
