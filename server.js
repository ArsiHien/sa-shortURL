const express = require("express");
const lib = require("./utils");
require("dotenv").config();
const app = express();
const cors = require("cors");
const path = require("path");
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, "public"))); // Serve static files from 'public'

// Routes
app.get("/hello", (req, res) => {
  return res.json("Hello WORLD!!!");
});

app.get("/short/:id", async (req, res) => {
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

app.post("/create", async (req, res) => {
  try {
    const url = req.query.url;
    const newID = await lib.shortUrl(url);
    res.send(newID);
  } catch (err) {
    res.status(500).send(err);
  }
});

// Fallback to index.html for non-API routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start server
app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
