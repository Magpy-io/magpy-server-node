import { UpdateServerName } from "../types/";
import { GeneratePostRequest } from "../RequestsManager";

export const Post = GeneratePostRequest<
  UpdateServerName.RequestData,
  UpdateServerName.ResponseData,
  UpdateServerName.ResponseErrorTypes
>(UpdateServerName.endpoint, UpdateServerName.tokenAuth);
