import { ClaimServer } from "../types/";
import { GeneratePostRequest } from "../RequestsManager";

export const Post = GeneratePostRequest<
  ClaimServer.RequestData,
  ClaimServer.ResponseData,
  ClaimServer.ResponseErrorTypes
>(ClaimServer.endpoint, ClaimServer.tokenAuth);
