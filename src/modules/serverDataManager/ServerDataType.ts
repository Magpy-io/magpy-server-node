import Joi from "joi";
import { ServerDataDefault } from "./serverDataCached";

export type ServerDataType = {
  serverId?: string;
  serverKey?: string;
  serverToken?: string;
  storageFolderPath: string;
  serverName: string;
};

export const ServerDataSchema = Joi.object({
  serverId: Joi.string(),
  serverKey: Joi.string(),
  serverToken: Joi.string(),
  storageFolderPath: Joi.string().default(ServerDataDefault.storageFolderPath),
  serverName: Joi.string().default(ServerDataDefault.serverName),
});
