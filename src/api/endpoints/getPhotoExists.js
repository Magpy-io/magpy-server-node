const helpers = require(global.__srcdir + "/helpers");

const databaseFunctions = require(global.__srcdir + "/db/databaseFunctions");

// get photo exists : returns whether or not a photo exists in the server
const endpoint = "/photoExists";
const callback = (req, res) => {
  console.log(`[GET photoExists]`);

  const hash = databaseFunctions.findPhotoDB(req.body.fileSize, req.body.name);

  const jsonResponse = {
    name: req.body.name,
    fileSize: req.body.fileSize,
    exists: Boolean(hash),
    hash: hash ?? "",
  };

  helpers.sendResponse(res, true, 200, jsonResponse);
};

module.exports = { endpoint: endpoint, callback: callback, method: "get" };
