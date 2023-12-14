import { GetServerData } from "@src/modules/serverDataManager";
import jwt from "jsonwebtoken";
import { jwtUserExp } from "@src/config/config";

async function generateUserToken(userId: string) {
  const serverData = await GetServerData();
  if (!serverData.serverKey) {
    throw new Error("Server key not defined");
  }
  const token = jwt.sign({ id: userId }, serverData.serverKey, {
    expiresIn: jwtUserExp,
  });
  return token;
}

async function verifyUserToken(token: string): Promise<{
  ok: boolean;
  data?: any;
  error?: ErrorTypes;
}> {
  const serverData = await GetServerData();
  try {
    if (!serverData.serverKey) {
      throw new Error("Server key not defined");
    }
    const decoded = jwt.verify(token, serverData.serverKey);
    return { ok: true, data: decoded };
  } catch (err: any) {
    if (err.name == "TokenExpiredError") {
      return { ok: false, error: "TOKEN_EXPIRED_ERROR" };
    }
    if (err.name == "JsonWebTokenError") {
      return { ok: false, error: "TOKEN_VERIFICATION_ERROR" };
    }
    if (err.name == "SyntaxError") {
      return { ok: false, error: "TOKEN_SYNTAX_ERROR" };
    }

    return { ok: false, error: "UKNOWN_ERROR" };
  }
}

type ErrorTypes =
  | "TOKEN_EXPIRED_ERROR"
  | "TOKEN_VERIFICATION_ERROR"
  | "TOKEN_SYNTAX_ERROR"
  | "UKNOWN_ERROR";
export type { ErrorTypes };

export { generateUserToken, verifyUserToken };
