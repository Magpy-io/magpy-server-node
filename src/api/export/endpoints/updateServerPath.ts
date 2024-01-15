import { UpdateServerPath } from "../types/";
import { GeneratePostRequest } from "../RequestsManager";

export const Post = GeneratePostRequest<
  UpdateServerPath.RequestData,
  UpdateServerPath.ResponseData,
  UpdateServerPath.ResponseErrorTypes
>(UpdateServerPath.endpoint, UpdateServerPath.tokenAuth);
