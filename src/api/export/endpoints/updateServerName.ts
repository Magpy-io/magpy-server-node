import { UpdateServerName } from "../Types/";
import { GeneratePostRequest } from "../RequestsManager";

export const Post = GeneratePostRequest<
  UpdateServerName.RequestData,
  UpdateServerName.ResponseData,
  UpdateServerName.ResponseErrorTypes
>(UpdateServerName.endpoint, UpdateServerName.tokenAuth);
