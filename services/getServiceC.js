const express = require("express");
const redisClient = require("../database/initRedis");
const lib = require("../utils"); // Utility functions (e.g., `findOrigin`)
require("dotenv").config();

const app = express();
const port = process.env.GET_SERVICE_C_PORT || 6003;

app.get("/short/:id", async (req, res) => {
  const id = req.params.id;
  const cacheKey = `id:${id}`;

  try {
    // Check the cache
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      // console.log(`Cache hit for key: ${cacheKey}`);
      return res.send(cachedData); // Send the cached URL as plain text
    }

    // console.log(`Cache miss for key: ${cacheKey}. Fetching from database...`);
    // Fetch data from the database
    const url = await lib.findOrigin(id);

    if (!url) {
      return res.status(404).send("<h1>404 - URL Not Found</h1>");
    }

    // Cache the data and set expiration (e.g., 1 hour)
    await redisClient.setEx(cacheKey, 3600, url);

    return res.send(url); // Send the URL as plain text
  } catch (error) {
    // console.error("Error handling request:", error);
    return res.status(500).send("An unexpected error occurred.");
  }
});

// Start the service
app.listen(port, () => {
  console.log(`Get service C is listening on port ${port}`);
});
