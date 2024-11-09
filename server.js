require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const http = require('http');
const app = express();
const server = http.createServer(app);
require("./config/mongoose");


app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());


app.get("/", async (req, res) => {
  res.send("<h2>Haat Bangla API</h2>");
});

const routes = require("./routes");

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  console.log(`Server running at: http://localhost:${PORT}/`);
});
