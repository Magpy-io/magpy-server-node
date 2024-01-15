import { GetPhotos } from "../types/";
import { GeneratePostRequest } from "../RequestsManager";

export const Post = GeneratePostRequest<
  GetPhotos.RequestData,
  GetPhotos.ResponseData,
  GetPhotos.ResponseErrorTypes
>(GetPhotos.endpoint, GetPhotos.tokenAuth);
