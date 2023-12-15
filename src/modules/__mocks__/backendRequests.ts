import { timeout } from "@src/modules/functions";

import * as mockValues from "@tests/mockHelpers/backendRequestsMockValues";

async function registerServer(
  userToken: string,
  serverKey: string,
  serverName: string,
  serverIp: string
) {
  await timeout(10);
  const f = mockValues.checkFails();
  if (f) {
    return f;
  }

  if (userToken != mockValues.validUserToken) {
    return {
      ok: false,
      errorCode: "AUTHORIZATION_FAILED",
    };
  }

  mockValues.setRandomValidKey(serverKey);

  return {
    ok: true,
    data: {
      server: {
        _id: mockValues.serverId,
      },
    },
  };
}

async function getServerToken(serverId_p: string, serverKey: string) {
  await timeout(10);
  const f = mockValues.checkFails();
  if (f) {
    return f;
  }

  if (serverId_p != mockValues.serverId) {
    return {
      ok: false,
      errorCode: "INVALID_ID_FORMAT",
    };
  }

  if (
    serverKey != mockValues.validKey &&
    serverKey != mockValues.validRandomKey
  ) {
    return {
      ok: false,
      errorCode: "INVALID_CREDENTIALS",
    };
  }

  return {
    ok: true,
    message: "",
    token: mockValues.validServerToken,
  };
}

async function getServerInfo(serverToken: string) {
  await timeout(10);
  const f = mockValues.checkFails();
  if (f) {
    return f;
  }

  if (serverToken != mockValues.validServerToken) {
    return {
      ok: false,
      errorCode: "AUTHORIZATION_FAILED",
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

async function whoAmI(userToken: string) {
  await timeout(10);
  const f = mockValues.checkFails();
  if (f) {
    return f;
  }

  if (userToken != mockValues.validUserToken) {
    return {
      ok: false,
      errorCode: "AUTHORIZATION_FAILED",
    };
  }

  return {
    ok: true,
    data: {
      user: {
        _id: mockValues.userId,
        email: "issam@gg.io",
      },
    },
  };
}

export { registerServer, getServerToken, getServerInfo, whoAmI };
