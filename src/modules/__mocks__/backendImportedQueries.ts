import axios, { AxiosResponse } from "axios";

import * as mockValues from "./backendRequestsMockValues";

function timeout(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function SetPath(path_p: string) {
  if (typeof path_p !== "string") {
    throw new Error("path_p parameter must be astring");
  }

  if (path_p[path_p.length - 1] != "/") {
    path_p += "/";
  }

  path = path_p;
}

let path: string = "";

let UserToken = "";
let ServerToken = "";

export function GetUserToken(): string {
  if (!UserToken) {
    throw new ErrorNoUserToken();
  }
  return UserToken;
}

export function SetUserToken(token: string) {
  if (typeof token !== "string") {
    throw new Error("token parameter must be a string");
  }
  UserToken = token;
}

export function HasUserToken(): boolean {
  if (UserToken) {
    return true;
  }
  return false;
}

export function GetServerToken(): string {
  if (!ServerToken) {
    throw new ErrorNoServerToken();
  }
  return ServerToken;
}

export function SetServerToken(token: string) {
  if (typeof token !== "string") {
    throw new Error("token parameter must be a string");
  }
  ServerToken = token;
}

export function HasServerToken(): boolean {
  if (ServerToken) {
    return true;
  }
  return false;
}

type ErrorBadRequest = "BAD_REQUEST";
type ErrorServerError = "SERVER_ERROR";
type ErrorInvalidCredentials = "INVALID_CREDENTIALS";
type ErrorEmailTaken = "EMAIL_TAKEN";
type ErrorInvalidEmail = "INVALID_EMAIL";
type ErrorInvalidName = "INVALID_NAME";
type ErrorInvalidPassword = "INVALID_PASSWORD";
type ErrorInvalidIpAddress = "INVALID_IP_ADDRESS";
type ErrorInvalidKeyFormat = "INVALID_KEY_FORMAT";
type ErrorNoAssociatedServer = "NO_ASSOCIATED_SERVER";
type ErrorAuthorizationFailed = "AUTHORIZATION_FAILED";
type ErrorAuthorizationMissing = "AUTHORIZATION_MISSING";
type ErrorAuthorizationExpired = "AUTHORIZATION_EXPIRED";
type ErrorAuthorizationWrongFormat = "AUTHORIZATION_WRONG_FORMAT";

type ErrorsAuthorization =
  | ErrorAuthorizationFailed
  | ErrorAuthorizationMissing
  | ErrorAuthorizationExpired
  | ErrorAuthorizationWrongFormat;

export type ServerResponseMessage = {
  ok: true;
  message: string;
};

export type ServerResponseData<T> = {
  ok: true;
  data: T;
};

export type ServerResponseError<Errors> = {
  ok: false;
  message: string;
  errorCode: Errors | ErrorBadRequest | ErrorServerError;
};

export type EndpointMethodsResponseType<T, U> = T | ServerResponseError<U>;

// Register
export type RegisterRequestData = {
  email: string;
  name: string;
  password: string;
};

export type RegisterResponseData = ServerResponseMessage;

export type RegisterResponseErrorTypes =
  | ErrorEmailTaken
  | ErrorInvalidEmail
  | ErrorInvalidName
  | ErrorInvalidPassword;

export type RegisterResponseType = EndpointMethodsResponseType<
  RegisterResponseData,
  RegisterResponseErrorTypes
>;
export async function registerPost(
  data: RegisterRequestData
): Promise<RegisterResponseType> {
  await timeout(10);
  const f = mockValues.checkFails();
  if (f) {
    return f as any;
  }

  if (data.email == mockValues.userEmailTaken) {
    return {
      ok: false,
      errorCode: "EMAIL_TAKEN",
      message: "",
    };
  }

  if (
    data.email != mockValues.validUserEmail ||
    data.password != mockValues.validUserPassword
  ) {
    return {
      ok: false,
      errorCode: "INVALID_EMAIL",
      message: "",
    };
  }

  return {
    ok: true,
    message: "",
  };
}

// Login
export type LoginRequestData = {
  email: string;
  password: string;
};

export type LoginResponseData = ServerResponseMessage;

export type LoginResponseErrorTypes = ErrorInvalidCredentials;

export type LoginResponseType = EndpointMethodsResponseType<
  LoginResponseData,
  LoginResponseErrorTypes
>;

export async function loginPost(
  data: LoginRequestData
): Promise<LoginResponseType> {
  await timeout(10);
  const f = mockValues.checkFails();
  if (f) {
    return f as any;
  }

  if (
    data.email != mockValues.validUserEmail ||
    data.password != mockValues.validUserPassword
  ) {
    return {
      ok: false,
      errorCode: "INVALID_CREDENTIALS",
      message: "",
    };
  }

  return {
    ok: true,
    message: "",
  };
}

// WhoAmI
export type WhoAmIRequestData = void;

export type WhoAmIResponseData = ServerResponseData<{
  user: { _id: string; email: string };
}>;

export type WhoAmIResponseErrorTypes = ErrorsAuthorization;

export type WhoAmIResponseType = EndpointMethodsResponseType<
  WhoAmIResponseData,
  WhoAmIResponseErrorTypes
>;

export async function whoAmIPost(
  data: WhoAmIRequestData
): Promise<WhoAmIResponseType> {
  await timeout(10);
  const f = mockValues.checkFails();
  if (f) {
    return f as any;
  }

  if (UserToken == mockValues.expiredUserToken) {
    return {
      ok: false,
      errorCode: "AUTHORIZATION_EXPIRED",
      message: "",
    };
  }

  if (
    UserToken != mockValues.validUserToken &&
    UserToken != mockValues.validUserToken2
  ) {
    return {
      ok: false,
      errorCode: "AUTHORIZATION_FAILED",
      message: "",
    };
  }

  return {
    ok: true,
    data: {
      user: {
        _id:
          UserToken == mockValues.validUserToken
            ? mockValues.userId
            : mockValues.userId2,
        email: "issam@gg.io",
      },
    },
  };
}

// GetMyServerInfo
export type GetMyServerInfoRequestData = void;

export type GetMyServerInfoResponseData = ServerResponseData<{
  server: { _id: string; name: string; ip: string };
}>;

export type GetMyServerInfoResponseErrorTypes =
  | ErrorNoAssociatedServer
  | ErrorsAuthorization;

export type GetMyServerInfoResponseType = EndpointMethodsResponseType<
  GetMyServerInfoResponseData,
  GetMyServerInfoResponseErrorTypes
>;

export async function getMyServerInfoPost(
  data: GetMyServerInfoRequestData
): Promise<GetMyServerInfoResponseType> {
  await timeout(10);
  const f = mockValues.checkFails();
  if (f) {
    return f as any;
  }

  if (UserToken == mockValues.expiredUserToken) {
    return {
      ok: false,
      errorCode: "AUTHORIZATION_EXPIRED",
      message: "",
    };
  }

  if (
    UserToken != mockValues.validUserToken &&
    UserToken != mockValues.validUserToken2
  ) {
    return {
      ok: false,
      errorCode: "AUTHORIZATION_FAILED",
      message: "",
    };
  }

  return {
    ok: true,
    data: {
      server: {
        _id: mockValues.serverId,
        name: "MyLocalServer",
        ip: "0.0.0.0",
      },
    },
  };
}

// RegisterServer
export type RegisterServerRequestData = {
  name: string;
  ipAddress: string;
  serverKey: string;
};

export type RegisterServerResponseData = ServerResponseData<{
  server: { _id: string };
}>;

export type RegisterServerResponseErrorTypes =
  | ErrorInvalidIpAddress
  | ErrorInvalidKeyFormat
  | ErrorsAuthorization;

export type RegisterServerResponseType = EndpointMethodsResponseType<
  RegisterServerResponseData,
  RegisterServerResponseErrorTypes
>;

export async function registerServerPost(
  data: RegisterServerRequestData
): Promise<RegisterServerResponseType> {
  await timeout(10);
  const f = mockValues.checkFails();
  if (f) {
    return f as any;
  }

  if (UserToken == mockValues.expiredUserToken) {
    return {
      ok: false,
      errorCode: "AUTHORIZATION_EXPIRED",
      message: "",
    };
  }

  if (UserToken != mockValues.validUserToken) {
    return {
      ok: false,
      errorCode: "AUTHORIZATION_FAILED",
      message: "",
    };
  }

  mockValues.setRandomValidKey(data.serverKey);

  return {
    ok: true,
    data: {
      server: {
        _id: mockValues.serverId,
      },
    },
  };
}

// GetServerToken
export type GetServerTokenRequestData = {
  id: string;
  key: string;
};

export type GetServerTokenResponseData = ServerResponseMessage;

export type GetServerTokenResponseErrorTypes = ErrorInvalidCredentials;

export type GetServerTokenResponseType = EndpointMethodsResponseType<
  GetServerTokenResponseData,
  GetServerTokenResponseErrorTypes
>;

export async function getServerTokenPost(
  data: GetServerTokenRequestData
): Promise<GetServerTokenResponseType> {
  await timeout(10);
  const f = mockValues.checkFails();
  if (f) {
    return f as any;
  }

  if (
    data.key != mockValues.validKey &&
    data.key != mockValues.validRandomKey
  ) {
    return {
      ok: false,
      errorCode: "INVALID_CREDENTIALS",
      message: "",
    };
  }

  ServerToken = mockValues.validServerToken;

  return {
    ok: true,
    message: "",
  };
}

// GetServerInfo
export type GetServerInfoRequestData = void;

export type GetServerInfoResponseData = ServerResponseData<{
  server: { _id: string; name: string; owner: string };
}>;

export type GetServerInfoResponseErrorTypes = ErrorsAuthorization;

export type GetServerInfoResponseType = EndpointMethodsResponseType<
  GetServerInfoResponseData,
  GetServerInfoResponseErrorTypes
>;

export async function getServerInfoPost(
  data: GetServerInfoRequestData
): Promise<GetServerInfoResponseType> {
  await timeout(10);
  const f = mockValues.checkFails();
  if (f) {
    return f as any;
  }

  if (ServerToken == mockValues.expiredServerToken) {
    return {
      ok: false,
      errorCode: "AUTHORIZATION_EXPIRED",
      message: "",
    };
  }

  if (ServerToken != mockValues.validServerToken) {
    return {
      ok: false,
      errorCode: "AUTHORIZATION_FAILED",
      message: "",
    };
  }

  return {
    ok: true,
    data: {
      server: {
        _id: mockValues.serverId,
        name: "MyLocalServer",
        owner: mockValues.userId,
      },
    },
  };
}

// DeleteServer
export type DeleteServerRequestData = void;

export type DeleteServerResponseData = ServerResponseMessage;

export type DeleteServerResponseErrorTypes = ErrorsAuthorization;

export type DeleteServerResponseType = EndpointMethodsResponseType<
  DeleteServerResponseData,
  DeleteServerResponseErrorTypes
>;

export async function DeleteServerPost(
  data: DeleteServerRequestData
): Promise<DeleteServerResponseType> {
  await timeout(10);
  const f = mockValues.checkFails();
  if (f) {
    return f as any;
  }

  if (ServerToken == mockValues.expiredServerToken) {
    return {
      ok: false,
      errorCode: "AUTHORIZATION_EXPIRED",
      message: "",
    };
  }

  if (ServerToken != mockValues.validServerToken) {
    return {
      ok: false,
      errorCode: "AUTHORIZATION_FAILED",
      message: "",
    };
  }

  return {
    ok: true,
    message: "",
  };
}

// Functions
function handleAxiosError(err: any): ServerResponseError<any> {
  if (err.response) {
    return err.response.data;
  } else if (err.request) {
    throw new ErrorBackendUnreachable();
  } else {
    throw err;
  }
}

function extractToken(response: AxiosResponse<any, any>) {
  return response.headers["authorization"].toString().split(" ")[1];
}

function userAuthorizationObject() {
  return {
    headers: {
      Authorization: `Bearer ${UserToken}`,
    },
  };
}

function verifyHasUserToken() {
  if (!UserToken) {
    throw new ErrorNoUserToken();
  }
}

function serverAuthorizationObject() {
  return {
    headers: {
      Authorization: `Bearer ${ServerToken}`,
    },
  };
}

function verifyHasServerToken() {
  if (!ServerToken) {
    throw new ErrorNoServerToken();
  }
}

export class ErrorBackendUnreachable extends Error {
  constructor() {
    super();
    this.message = "Backend server is unreachable";
  }
}

export class ErrorNoUserToken extends Error {
  constructor() {
    super();
    this.message = "You need to log in first to get a user token";
  }
}

export class ErrorNoServerToken extends Error {
  constructor() {
    super();
    this.message = "You need to connect server first to get a server token";
  }
}

export class ErrorPathNotSet extends Error {
  constructor() {
    super();
    this.message = "You need to set a path before runing any requests";
  }
}
