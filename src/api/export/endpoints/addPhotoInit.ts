import { AddPhotoInit } from "../types/";
import { GeneratePostRequest } from "../RequestsManager";

export const Post = GeneratePostRequest<
  AddPhotoInit.RequestData,
  AddPhotoInit.ResponseData,
  AddPhotoInit.ResponseErrorTypes
>(AddPhotoInit.endpoint, AddPhotoInit.tokenAuth);
