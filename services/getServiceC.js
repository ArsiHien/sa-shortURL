const express = require("express");
const amqp = require("amqplib/callback_api");
const redisClient = require("../database/initRedis");
const lib = require("../utils");
require("dotenv").config();

const app = express();
const queue = "get_queue";
const port = process.env.GET_SERVICE_C_PORT || 6003;

function consumeQueue() {
  amqp.connect(process.env.RABBITMQ_URL, (err, conn) => {
    if (err) {
      console.error("Error connecting to RabbitMQ:", err);
      return;
    }
    conn.createChannel((err, ch) => {
      if (err) {
        console.error("Error creating RabbitMQ channel:", err);
        return;
      }
      ch.assertQueue(queue, { durable: true });
      ch.consume(
        queue,
        async (msg) => {
          const { id } = JSON.parse(msg.content.toString());
          const correlationId = msg.properties.correlationId;
          const replyTo = msg.properties.replyTo;
          const cacheKey = `id:${id}`;
          try {
            // Check the cache
            const cachedData = await redisClient.getData(cacheKey);
            if (cachedData) {
              const response = cachedData;
              ch.sendToQueue(replyTo, Buffer.from(JSON.stringify(response)), {
                correlationId,
              });
              return ch.ack(msg);
            }

            // Fetch data from the database
            const url = await lib.findOrigin(id);
            if (!url) {
              const response = { status: 404, message: "URL not found" };
              ch.sendToQueue(replyTo, Buffer.from(JSON.stringify(response)), {
                correlationId,
              });
              return ch.ack(msg);
            }

            // Cache the data and set expiration (e.g., 1 hour)
            await redisClient.setData(cacheKey, url, 3600);
            const response = url;
            ch.sendToQueue(replyTo, Buffer.from(JSON.stringify(response)), {
              correlationId,
            });
            ch.ack(msg);
          } catch (error) {
            console.error("Error handling request:", error);
            const response = { status: 500, message: "Internal Server Error" };
            ch.sendToQueue(replyTo, Buffer.from(JSON.stringify(response)), {
              correlationId,
            });
            ch.nack(msg);
          }
        },
        { noAck: false }
      );
    });
  });
}

consumeQueue();

app.listen(port, () => {
  console.log(`Get service C is listening on port ${port}`);
});
