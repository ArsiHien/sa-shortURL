const express = require("express");
const amqp = require("amqplib/callback_api");
const { getAsync, setExAsync } = require("../database/initRedis");
const lib = require("../utils");
const { config } = require("dotenv");
require("dotenv").config();

const app = express();
const queue = "get_queue";
const port = process.env.GET_SERVICE_A_PORT || 6001;

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
            const cachedData = await getAsync(cacheKey);
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
            await setExAsync(cacheKey, 3600, url);
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
  console.log(`Get service A is listening on port ${port}`);
});
