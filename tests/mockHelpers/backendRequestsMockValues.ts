const userId = "userId";
const userId2 = "userId2";
const serverId = "657ccaba54ac70b873e81f8f";

const validUserToken = "validUserToken";
const invalidUserToken = "invalidUserToken";
const validUserToken2 = "validUserToken2";

const validKey =
  "382e854a9a4294851f4a42e90dabbcd3e0969515d2f90c5de65f4e724c7cf05a";
const invalidKey = "invalidKey";
let validRandomKey = "";

const validServerToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NTdjY2FiYTU0YWM3MGI4NzNlODFmOGYiLCJpYXQiOjE3MDI2NzcxNzgsImV4cCI6MTcwMjc2MzU3OH0.G_oAm339tpuNPWVADzmNFj8nWohRZW0kZqHNUnB2_C8";
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
  userId2,
  serverId,
  validUserToken,
  validUserToken2,
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
