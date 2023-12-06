type Photo = {
  id: string;
  name: string;
  fileSize: number;
  width: number;
  height: number;
  date: string;
  syncDate: string;
  serverPath: string;
  clientPath: string;
  hash: string;
  image64?: string;
};

export type { Photo };
