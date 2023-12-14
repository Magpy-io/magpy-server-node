export {};

declare global {
  namespace Express {
    export interface Request {
      hasValidCredentials: boolean;
    }
  }
}
