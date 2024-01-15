import { AddPhoto } from "../types/";
import { GeneratePostRequest } from "../RequestsManager";

export const Post = GeneratePostRequest<
  AddPhoto.RequestData,
  AddPhoto.ResponseData,
  AddPhoto.ResponseErrorTypes
>(AddPhoto.endpoint, AddPhoto.tokenAuth);
