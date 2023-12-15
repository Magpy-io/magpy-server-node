const userId = "userId";
const serverId = "657a43a9e311e932728ba516";

const validUserToken = "validUserToken";
const invalidUserToken = "invalidUserToken";

const validKey = "validKey";
const invalidKey = "invalidKey";
let validRandomKey = "";

const validServerToken = "validServerToken";
const invalidServerToken = "invalidServerToken";

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

function setRandomValidKey(key: string) {
  validRandomKey = key;
}

export {
  userId,
  serverId,
  validUserToken,
  invalidUserToken,
  validKey,
  invalidKey,
  validRandomKey,
  setRandomValidKey,
  validServerToken,
  invalidServerToken,
  failNextRequest,
  failNextRequestServerUnreachable,
  checkFails,
};
