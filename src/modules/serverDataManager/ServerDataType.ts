import Joi from 'joi';

import { ServerDataDefault } from './serverDataCached';

export type ServerDataType = {
  serverRegisteredInfo: {
    serverCredentials: { serverId: string; serverKey: string } | null;
    serverToken: string | null;
  };
  storageFolderPath: string;
  serverName: string;
};

export const ServerDataSchema = Joi.object({
  serverRegisteredInfo: Joi.object({
    serverCredentials: Joi.object({
      serverId: Joi.string().required(),
      serverKey: Joi.string().required(),
    })
      .required()
      .allow(null),
    serverToken: Joi.string(),
  }).required(),
  storageFolderPath: Joi.string().default(ServerDataDefault.storageFolderPath),
  serverName: Joi.string().default(ServerDataDefault.serverName),
});
