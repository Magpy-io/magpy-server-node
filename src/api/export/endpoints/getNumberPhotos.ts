import { GetNumberPhotos } from "../types/";
import { GeneratePostRequest } from "../RequestsManager";

export const Post = GeneratePostRequest<
  GetNumberPhotos.RequestData,
  GetNumberPhotos.ResponseData,
  GetNumberPhotos.ResponseErrorTypes
>(GetNumberPhotos.endpoint, GetNumberPhotos.tokenAuth);
