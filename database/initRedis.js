require("dotenv").config();
const { createClient } = require("redis");

const redisClient = createClient({ url: process.env.REDIS_URI });

redisClient.ping((err, res) => {
  console.log(res);
});

redisClient.on("connect", () => {
  console.log("Redis client connected with URI");
});

redisClient.on("error", (error) => {
  console.error(error);
});

module.exports = redisClient;
