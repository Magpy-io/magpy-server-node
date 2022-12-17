// IMPORTS

function sendResponse(res, ok, status, data) {
  let jsonResponse = {
    ok: ok,
    data: data,
  };

  res.status(status).json(jsonResponse);
}

function sendSuccessfulResponse(res, msg, status = 200) {
  let jsonResponse = {
    ok: true,
    message: msg,
  };

  res.status(status).json(jsonResponse);
}

function sendFailedResponse(res, msg, status = 500) {
  let jsonResponse = {
    ok: false,
    message: msg,
  };

  res.status(status).json(jsonResponse);
}

module.exports = {
  sendResponse,
  sendSuccessfulResponse,
  sendFailedResponse,
};
