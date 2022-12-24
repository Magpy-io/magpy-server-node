// Set src dir absolute path
global.__srcdir = __dirname;

// IMPORTS
const express = require("express");
const bodyParser = require("body-parser");

const { host, port } = require(global.__srcdir + "/config/config");
const loadEndpoints = require(global.__srcdir + "/api/endpointsLoader");
const { initDB } = require(global.__srcdir + "/db/databaseFunctions");

initDB()
  .then(() => {
    console.log("Database initialized.");

    const app = express();

    app.use(bodyParser.json({ limit: "50mb" }));

    loadEndpoints(app);
    console.log("Endpoints loaded");

    app.listen(port, host, () => {
      console.log(`Server is running on http://${host}:${port}`);
    });
  })
  .catch((err) => {
    console.error("Error initializing database");
  });
