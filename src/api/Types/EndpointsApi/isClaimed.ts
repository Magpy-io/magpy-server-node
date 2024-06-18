import Joi from 'joi';

import { ErrorBackendServerUnreachable } from '../ErrorTypes';
import { TokenAuthentification } from '../Types';

export type ResponseData = { claimed: 'None' | 'Locally' | 'Remotely' };

export const RequestSchema = Joi.object({})
  .options({ presence: 'required' })
  .meta({ className: 'RequestData' });

export type ResponseErrorTypes = ErrorBackendServerUnreachable;

export const endpoint = 'isClaimed';

export const tokenAuth: TokenAuthentification = 'no';

//auto-generated file using "yarn types"
export * from '../RequestTypes/isClaimed';
