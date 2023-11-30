// Set src dir absolute path
global.__srcdir = __dirname;

// IMPORTS
const express = require("express");
const bodyParser = require("body-parser");

const { port } = require(global.__srcdir + "/config/config");
const loadEndpoints = require(global.__srcdir + "/api/endpointsLoader");
const { initDB } = require(global.__srcdir + "/db/databaseFunctions");

initDB()
  .then(() => {
    console.log("Database initialized.");

    const app = express();

    app.use(bodyParser.json({ limit: "50mb" }));

    loadEndpoints(app);
    console.log("Endpoints loaded");

    app.listen(port, () => {
      console.log(`Server is listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Error initializing database");
    console.log(err);
  });
