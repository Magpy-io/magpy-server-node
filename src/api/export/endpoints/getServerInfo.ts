import { GetServerInfo } from "../Types/";
import { GeneratePostRequest } from "../RequestsManager";

export const Post = GeneratePostRequest<
  GetServerInfo.RequestData,
  GetServerInfo.ResponseData,
  GetServerInfo.ResponseErrorTypes
>(GetServerInfo.endpoint, GetServerInfo.tokenAuth);
