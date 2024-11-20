const express = require("express");
const lib = require("./utils");
require("dotenv").config();
const app = express();
const cors = require("cors");
const port = process.env.APP_PORT || 3000;


app.use(cors());

app.get("/hello", (req, res) => {
  return res.json("Hello WORLD!!!");
});

app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
});

app.get("/short/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const url = await lib.findOrigin(id);
    if (url == null) {
      res.send("<h1>404</h1>");
    } else {
      res.send(url);
    }
  } catch (err) {
    res.send(err);
  }
});

app.post("/create", async (req, res) => {
  try {
    const url = req.query.url;
    const newID = await lib.shortUrl(url);
    res.send(newID);
  } catch (err) {
    res.send(err);
  }
});

app.listen(port, () => {
  console.log(`CS1 app listening on port ${port}`);
});
