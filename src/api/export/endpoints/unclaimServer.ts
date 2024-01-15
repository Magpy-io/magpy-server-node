import { UnclaimServer } from "../Types/";
import { GeneratePostRequest } from "../RequestsManager";

export const Post = GeneratePostRequest<
  UnclaimServer.RequestData,
  UnclaimServer.ResponseData,
  UnclaimServer.ResponseErrorTypes
>(UnclaimServer.endpoint, UnclaimServer.tokenAuth);
