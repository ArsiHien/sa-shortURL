require("dotenv").config();
const { createClient } = require("redis");

const redisClient = createClient({
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
});

// Add event listeners
redisClient.on("connect", () => {
  console.log("Redis client connected.");
});

redisClient.on("error", (err) => {
  console.error("Redis client connection error:", err);
});

// Connect the client and handle errors during initialization
(async () => {
  try {
    await redisClient.connect();
    console.log("Redis client initialized.");
  } catch (err) {
    console.error("Failed to connect to Redis:", err);
  }
})();

module.exports = redisClient;
