function checkParamMissing(body, param, type) {
  if (type === "Array") return !(body[param] instanceof Array);

  if (type == "Array string") {
    if (!(body[param] instanceof Array)) return true;

    return body[param].some((e) => !(typeof e === "string"));
  }

  if (type == "Array number") {
    if (!(body[param] instanceof Array)) return true;

    return body[param].some((e) => !(typeof e === "number"));
  }

  if (type === "Date")
    return !(typeof body[param] === "string") || isNaN(new Date(body[param]));

  if (type === "number" || type === "string")
    return !(typeof body[param] === type);

  throw "checkParamMissing: invalid parameter 'type'";
}

function checkReqBodyAttributeMissing(req, param, type) {
  return checkParamMissing(req.body, param, type);
}

module.exports = {
  checkParamMissing,
  checkReqBodyAttributeMissing,
};
