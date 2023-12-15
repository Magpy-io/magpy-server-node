import { timeout } from "@src/modules/functions";

const userId = "userId";
const serverId = "657a43a9e311e932728ba516";

const validIp = "validIp";
const invaidIp = "invalidIp";

const validUserToken = "validUserToken";
const invalidUserToken = "invalidUserToken";
const validUserTokenUserNotExisting = "validUserTokenUserNotExisting";

const validKey = "validKey";
const invalidKey = "invalidKey";

const validServerToken = "validServerToken";
const invalidServerToken = "invalidServerToken";
const validServerTokenServerNotExisting = "validServerTokenServerNotExisting";

let shouldNextRequestFail = false;
let shouldNextRequestFailServerUnreachable = false;

function failNextRequest() {
  shouldNextRequestFail = true;
}

function failNextRequestServerUnreachable() {
  shouldNextRequestFailServerUnreachable = true;
}

function checkFails() {
  if (shouldNextRequestFail) {
    shouldNextRequestFail = false;

    return { ok: false, errorCode: "SOME_ERROR_CODE" };
  }

  if (shouldNextRequestFailServerUnreachable) {
    throw new Error("Server unreachable");
  }

  return false;
}

async function registerServer(
  userToken: string,
  serverKey: string,
  serverName: string,
  serverIp: string
) {
  await timeout(10);
  const f = checkFails();
  if (f) {
    return f;
  }

  if (serverIp != validIp) {
    return {
      ok: false,
      errorCode: "INVALID_IP_ADDRESS",
    };
  }

  if (
    userToken != validUserToken &&
    userToken != validUserTokenUserNotExisting
  ) {
    return {
      ok: false,
      errorCode: "AUTHORIZATION_FAILED",
    };
  }

  if (userToken == validUserTokenUserNotExisting) {
    return {
      ok: false,
      errorCode: "AUTHORIZATION_USER_NOT_FOUND",
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
  const f = checkFails();
  if (f) {
    return f;
  }

  if (serverId_p != serverId) {
    return {
      ok: false,
      errorCode: "INVALID_ID_FORMAT",
    };
  }

  if (serverKey != validKey) {
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
  const f = checkFails();
  if (f) {
    return f;
  }

  if (
    serverToken != validServerToken &&
    serverToken != validServerTokenServerNotExisting
  ) {
    return {
      ok: false,
      errorCode: "AUTHORIZATION_FAILED",
    };
  }

  if (serverToken == validServerTokenServerNotExisting) {
    return {
      ok: false,
      errorCode: "AUTHORIZATION_SERVER_NOT_FOUND",
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
  const f = checkFails();
  if (f) {
    return f;
  }

  if (
    userToken != validUserToken &&
    userToken != validUserTokenUserNotExisting
  ) {
    return {
      ok: false,
      errorCode: "AUTHORIZATION_FAILED",
    };
  }

  if (userToken == validUserTokenUserNotExisting) {
    return {
      ok: false,
      errorCode: "AUTHORIZATION_USER_NOT_FOUND",
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
