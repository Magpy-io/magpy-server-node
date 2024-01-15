import { AddPhotoPart } from "../types/";
import { GeneratePostRequest } from "../RequestsManager";

export const Post = GeneratePostRequest<
  AddPhotoPart.RequestData,
  AddPhotoPart.ResponseData,
  AddPhotoPart.ResponseErrorTypes
>(AddPhotoPart.endpoint, AddPhotoPart.tokenAuth);
