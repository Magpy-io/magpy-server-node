const fs = require("mz/fs");

function getEndpoints() {
  const endpoints = [];
  fs.readdirSync(global.__srcdir + "/api/endpoints").forEach(function (file) {
    endpoints.push(require(global.__srcdir + "/api/endpoints/" + file));
  });
  return endpoints;
}

function loadEndpoints(app) {
  const endpoints = getEndpoints();

  endpoints.forEach(({ endpoint, callback, method }) => {
    app[method](endpoint, callback);
  });
}

module.exports = loadEndpoints;
