import { UnclaimServer } from "../types/";
import { GeneratePostRequest } from "../RequestsManager";

export const Post = GeneratePostRequest<
  UnclaimServer.RequestData,
  UnclaimServer.ResponseData,
  UnclaimServer.ResponseErrorTypes
>(UnclaimServer.endpoint, UnclaimServer.tokenAuth);
