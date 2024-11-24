require('dotenv').config();
const { createClient } = require('redis');

class RedisSingleton {
  constructor() {
    if (!RedisSingleton.instance) {
      this.initClient();
      RedisSingleton.instance = this;
    }

    return RedisSingleton.instance;
  }

  initClient() {
    this.redisClient = createClient({
      password: process.env.REDIS_PASSWORD,
      socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
      },
    });

    // Add event listeners
    this.redisClient.on('connect', () => {
      console.log('Redis client connected.');
    });

    this.redisClient.on('ready', () => {
      console.log('Redis client ready.');
    });

    this.redisClient.on('error', (err) => {
      console.error('Redis client connection error:', err);
    });

    this.redisClient.on('end', () => {
      console.log('Redis client disconnected.');
    });

    // Connect the client
    (async () => {
      try {
        await this.redisClient.connect();
        console.log('Redis client initialized.');
      } catch (err) {
        console.error('Failed to connect to Redis:', err);
      }
    })();
  }

  // Sample method to set data in Redis
  async setData(key, value, ttl) {
    try {
      await this.redisClient.setEx(key, ttl, value);
    } catch (err) {
      console.error('Error setting data in Redis:', err);
    }
  }

  // Sample method to get data from Redis
  async getData(key) {
    try {
      const value = await this.redisClient.get(key);
      return value;
    } catch (err) {
      console.error('Error getting data from Redis:', err);
      throw err;
    }
  }
}

// Creating and exporting the singleton instance
const redisSingletonInstance = new RedisSingleton();
Object.freeze(redisSingletonInstance); // Freezing instance to prevent modification

module.exports = redisSingletonInstance;
