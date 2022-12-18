// Set src dir absolute path
global.__srcdir = __dirname;

// IMPORTS
const express = require("express");
const bodyParser = require("body-parser");

const { host, port } = require(global.__srcdir + "/config/config");
const loadEndpoints = require(global.__srcdir + "/api/endpointsLoader");
const { initDB } = require(global.__srcdir + "/db/databaseFunctions");

initDB();
// Create app
const app = express();

// Use bodyParser to automatically parse request bodies to json
app.use(bodyParser.json({ limit: "50mb" }));

// Load all endpoints present in src/api/endpoints
loadEndpoints(app);

// Listen to requests
app.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
});
