import { AddPhotoType } from "@src/db/sequelizeDb";

export type FilesWaitingType = {
  received: number;
  dataParts: Map<number, string>;
  image64Len: number;
  photo: AddPhotoType;
  timeout: NodeJS.Timeout;
};

const FilesWaiting = new Map<string, FilesWaitingType>();

export default FilesWaiting;
