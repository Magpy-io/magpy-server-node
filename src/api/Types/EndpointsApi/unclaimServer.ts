import Joi from 'joi';

import {
  ErrorAuthorizationFailed,
  ErrorBackendServerUnreachable,
  ErrorCouldNotGetRequestAddress,
} from '../ErrorTypes';
import { TokenAuthentification } from '../Types';

export type ResponseData = string;

export const RequestSchema = Joi.object()
  .options({
    presence: 'required',
  })
  .meta({ className: 'RequestData' });

export type ResponseErrorTypes =
  | ErrorAuthorizationFailed
  | ErrorCouldNotGetRequestAddress
  | ErrorBackendServerUnreachable;

export const endpoint = 'unclaimServer';

export const tokenAuth: TokenAuthentification = 'no';

//auto-generated file using "yarn types"
export * from '../RequestTypes/unclaimServer';
