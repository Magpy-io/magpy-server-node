import { ServerData } from "@src/modules/serverDataManager";
export {};

declare global {
  namespace Express {
    export interface Request {
      serverData?: ServerData;
      hasValidCredentials?: boolean;
      userId?: string;
      token?: string;
    }
  }
}
