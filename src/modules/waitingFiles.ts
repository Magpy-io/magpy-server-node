import { Photo } from "@src/types/photoType";

export type FilesWaitingType = {
  received: number;
  dataParts: Map<number, string>;
  image64Len: number;
  photo: Photo;
  timeout: NodeJS.Timeout;
};

const FilesWaiting = new Map<string, FilesWaitingType>();

export default FilesWaiting;
