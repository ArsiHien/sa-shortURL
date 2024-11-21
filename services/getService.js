const express = require("express");
const lib = require("../utils");
require("dotenv").config();
const app = express();
const port = process.env.GET_SERVICE_PORT || 3001;

app.get("/short/:id", async (req, res) => {
  console.log("Here is get");
  try {
    const id = req.params.id;
    const url = await lib.findOrigin(id);
    if (url == null) {
      res.status(404).send("<h1>404 - URL Not Found</h1>");
    } else {
      res.send(url);
    }
  } catch (err) {
    res.status(500).send(err);
  }
});

// Start service
app.listen(port, () => {
  console.log(`Get service is listening on port ${port}`);
});
