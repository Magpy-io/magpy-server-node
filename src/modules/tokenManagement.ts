import jwt from 'jsonwebtoken';

import { jwtUserExp } from '../config/config';

export type TokenUserData = { id: string };

export function generateUserToken(userId: string, key: string) {
  const tokenData: TokenUserData = { id: userId };
  const token = jwt.sign(tokenData, key, {
    expiresIn: jwtUserExp,
  });
  return token;
}

export function verifyUserToken(
  token: string,
  key: string,
):
  | {
      ok: true;
      data: TokenUserData;
    }
  | {
      ok: false;
      error: ErrorTypes;
      message?: String;
    } {
  const ret = verifyToken(token, key);

  if (ret.ok) {
    if (!ret.data.id) {
      return {
        ok: false,
        error: 'TOKEN_NOT_A_USER_TOKEN',
        message: 'Token invalid format for a user token',
      };
    }
  }

  return ret;
}

export function verifyToken(
  token: string,
  key: string,
):
  | {
      ok: true;
      data: any;
    }
  | {
      ok: false;
      error: ErrorTypes;
      message?: String;
    } {
  try {
    const decoded = jwt.verify(token, key);
    return { ok: true, data: decoded };
  } catch (err: any) {
    if (err.name == 'TokenExpiredError') {
      return { ok: false, error: 'TOKEN_EXPIRED_ERROR', message: err.message };
    }
    if (err.name == 'JsonWebTokenError') {
      return { ok: false, error: 'TOKEN_VERIFICATION_ERROR', message: err.message };
    }
    if (err.name == 'SyntaxError') {
      return { ok: false, error: 'TOKEN_SYNTAX_ERROR', message: err.message };
    }

    return { ok: false, error: 'UKNOWN_ERROR', message: err.message };
  }
}

export type ErrorTypes =
  | 'TOKEN_NOT_A_USER_TOKEN'
  | 'TOKEN_EXPIRED_ERROR'
  | 'TOKEN_VERIFICATION_ERROR'
  | 'TOKEN_SYNTAX_ERROR'
  | 'UKNOWN_ERROR';
