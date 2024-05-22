import Joi from 'joi';

import { ServerDataDefault } from './serverDataCached';

export type ServerDataType = {
  serverRegisteredInfo: {
    serverCredentials: { serverId: string; serverKey: string };
    serverToken?: string | null;
  } | null;
  localClaimInfo: {
    username: string;
    passwordHash: string;
  } | null;
  storageFolderPath: string;
  serverName: string;
};

export const ServerDataSchema = Joi.object({
  serverRegisteredInfo: Joi.object({
    serverCredentials: Joi.object({
      serverId: Joi.string().required(),
      serverKey: Joi.string().required(),
    }).required(),
    serverToken: Joi.string().allow(null),
  })
    .required()
    .allow(null),
  localClaimInfo: Joi.object({
    username: Joi.string().required(),
    passwordHash: Joi.string().required(),
  })
    .required()
    .allow(null),
  storageFolderPath: Joi.string().default(ServerDataDefault.storageFolderPath),
  serverName: Joi.string().default(ServerDataDefault.serverName),
});
