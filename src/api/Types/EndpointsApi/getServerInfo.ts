import Joi from 'joi';

import {
  ErrorAuthorizationFailed,
  ErrorBackendServerUnreachable,
  ErrorCouldNotGetRequestAddress,
} from '../ErrorTypes';
import { TokenAuthentification } from '../Types';

export type ResponseData = {
  storagePath: string;
  serverName: string;
  owner: { name: string; email: string } | null;
  ownerLocal: { name: string } | null;
};

export const RequestSchema = Joi.object()
  .options({
    presence: 'required',
  })
  .meta({ className: 'RequestData' });

export type ResponseErrorTypes =
  | ErrorAuthorizationFailed
  | ErrorCouldNotGetRequestAddress
  | ErrorBackendServerUnreachable;

export const endpoint = 'getServerInfo';

export const tokenAuth: TokenAuthentification = 'no';

//auto-generated file using "yarn types"
export * from '../RequestTypes/getServerInfo';
