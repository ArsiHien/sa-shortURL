const express = require("express");
const lib = require("../utils");
require("dotenv").config();

const app = express();
const port = process.env.CREATE_SERVICE_PORT || 8000;

app.use(express.json()); // Ensure the server can parse JSON requests

app.post("/create", async (req, res) => {
  try {
    const url = req.body.url;
    const newID = await lib.shortUrl(url);
    res.send(newID);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Start server
app.listen(port, () => {
  console.log(`Create service listening on port ${port}`);
});
