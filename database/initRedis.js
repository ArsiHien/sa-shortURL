require('dotenv').config();
const { createClient } = require('redis');

const redisClient = createClient({
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
});

// Add event listeners
redisClient.on('connect', () => {
  console.log('Redis client connected.');
});

redisClient.on('ready', () => {
  console.log('Redis client ready.');
});

redisClient.on('error', (err) => {
  console.error('Redis client connection error:', err);
});

redisClient.on('end', () => {
  console.log('Redis client disconnected.');
});

// Connect the client
(async () => {
  try {
    await redisClient.connect();
    console.log('Redis client initialized.');
  } catch (err) {
    console.error('Failed to connect to Redis:', err);
  }
})();

// Using async/await instead of promisify for get and setEx
const getAsync = async (key) => {
  try {
    const value = await redisClient.get(key);
    return value;
  } catch (err) {
    console.error('Error getting value from Redis:', err);
    throw err;
  }
};

const setExAsync = async (key, ttl, value) => {
  try {
    await redisClient.setEx(key, ttl, value);
  } catch (err) {
    console.error('Error setting value in Redis:', err);
    throw err;
  }
};

module.exports = { redisClient, getAsync, setExAsync };
