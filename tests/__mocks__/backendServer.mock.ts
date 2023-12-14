import { timeout } from "@src/modules/functions";

const userId = "userId";
const serverId = "657a43a9e311e932728ba516";

const validUserToken = "validUserToken";
const invalidUserToken = "invalidUserToken";

const validKey = "validKey";
const invalidKey = "invalidKey";

const validServerToken = "validServerToken";
const invalidServerToken = "invalidServerToken";

async function registerServer(userToken: string, serverKey: string) {
  await timeout(10);
  if (userToken != validUserToken) {
    return {
      ok: false,
      errorCode: "AUTHORIZATION_FAILED",
    };
  }

  if (serverKey != validKey) {
    return {
      ok: false,
      errorCode: "INVALID_KEY_FORMAT",
    };
  }

  return {
    ok: true,
    data: {
      server: {
        _id: serverId,
      },
    },
  };
}

async function getServerToken(serverId_p: string, serverKey: string) {
  await timeout(10);
  if (serverId_p != serverId || serverKey != validKey) {
    return {
      ok: false,
      errorCode: "INVALID_CREDENTIALS",
    };
  }
  return {
    ok: true,
    message: "",
    token: validServerToken,
  };
}

async function getServerInfo(serverToken: string) {
  await timeout(10);
  if (serverToken != validServerToken) {
    return {
      ok: false,
      errorCode: "AUTHORIZATION_FAILED",
    };
  }
  return {
    ok: true,
    data: {
      server: {
        _id: serverId,
        name: "MyLocalServer",
        owner: userId,
      },
    },
  };
}

async function whoAmI(userToken: string) {
  await timeout(10);
  if (userToken != validUserToken) {
    return {
      ok: false,
      errorCode: "AUTHORIZATION_FAILED",
    };
  }
  return {
    ok: true,
    data: {
      user: {
        _id: userId,
        email: "issam@gg.io",
      },
    },
  };
}
