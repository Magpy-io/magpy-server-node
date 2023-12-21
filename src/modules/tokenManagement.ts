import { GetServerData } from "@src/modules/serverDataManager";
import jwt from "jsonwebtoken";
import { jwtUserExp } from "@src/config/config";

type TokenData = { id: string };

async function generateUserToken(userId: string) {
  const serverData = await GetServerData();
  if (!serverData.serverKey) {
    throw new Error("Server key not defined");
  }

  const tokenData: TokenData = { id: userId };
  const token = jwt.sign(tokenData, serverData.serverKey, {
    expiresIn: jwtUserExp,
  });
  return token;
}

function verifyUserToken(
  token: string,
  key: string
):
  | {
      ok: true;
      data: TokenData;
    }
  | {
      ok: false;
      error: ErrorTypes;
    } {
  try {
    const decoded: any = jwt.verify(token, key);
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
