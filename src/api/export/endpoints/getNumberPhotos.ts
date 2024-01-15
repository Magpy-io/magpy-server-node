import { GetNumberPhotos } from "../Types/";
import { GeneratePostRequest } from "../RequestsManager";

export const Post = GeneratePostRequest<
  GetNumberPhotos.RequestData,
  GetNumberPhotos.ResponseData,
  GetNumberPhotos.ResponseErrorTypes
>(GetNumberPhotos.endpoint, GetNumberPhotos.tokenAuth);
