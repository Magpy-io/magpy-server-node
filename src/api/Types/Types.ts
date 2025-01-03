export const PhotoTypesArray = ['data', 'thumbnail', 'compressed', 'original'] as const;

export type PhotoTypes = (typeof PhotoTypesArray)[number];

export type APIPhoto = {
  id: string;
  meta: {
    name: string;
    fileSize: number;
    width: number;
    height: number;
    date: string;
    syncDate: string;
    serverPath: string;
    mediaIds: Array<{ deviceUniqueId: string; mediaId: string }>;
  };
  image64: string;
};

export type TokenAuthentification = 'no' | 'yes' | 'set-token' | 'optional';
