import jwt from 'jsonwebtoken';

import { jwtUserExp } from '../config/config';
import { GetServerConfigData } from './serverDataManager';

export type TokenUserData = { id: string };

export function generateUserToken(userId: string) {
  const serverData = GetServerConfigData();
  if (!serverData.serverKey) {
    throw new Error('Server key not defined');
  }

  const tokenData: TokenUserData = { id: userId };
  const token = jwt.sign(tokenData, serverData.serverKey, {
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
    } {
  const ret = verifyToken(token, key);

  if (ret.ok) {
    if (!ret.data.id) {
      return { ok: false, error: 'TOKEN_NOT_A_USER_TOKEN' };
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
    } {
  try {
    const decoded = jwt.verify(token, key);
    return { ok: true, data: decoded };
  } catch (err: any) {
    if (err.name == 'TokenExpiredError') {
      return { ok: false, error: 'TOKEN_EXPIRED_ERROR' };
    }
    if (err.name == 'JsonWebTokenError') {
      return { ok: false, error: 'TOKEN_VERIFICATION_ERROR' };
    }
    if (err.name == 'SyntaxError') {
      return { ok: false, error: 'TOKEN_SYNTAX_ERROR' };
    }

    return { ok: false, error: 'UKNOWN_ERROR' };
  }
}

export type ErrorTypes =
  | 'TOKEN_NOT_A_USER_TOKEN'
  | 'TOKEN_EXPIRED_ERROR'
  | 'TOKEN_VERIFICATION_ERROR'
  | 'TOKEN_SYNTAX_ERROR'
  | 'UKNOWN_ERROR';
