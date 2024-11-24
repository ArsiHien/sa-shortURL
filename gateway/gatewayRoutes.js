require("dotenv").config();
const express = require("express");
const amqp = require("amqplib/callback_api");
const CircuitBreaker = require("opossum");
const rateLimit = require("express-rate-limit");
const uuid = require("uuid");

const router = express.Router();

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 20 requests per windowMs
  message: {
    code: 429,
    status: "Error",
    message: "Rate limit exceeded.",
    data: null,
  },
});

// Apply rate limiting to all requests
router.use(limiter);

const BASE_URL = "http://localhost";

const services = [
  {
    route: "/create",
    target: `${BASE_URL}:${process.env.CREATE_SERVICE_PORT}/create`,
  },
  {
    route: "/short",
    queue: "get_queue",
  },
];

// Function to send messages to RabbitMQ queue and wait for a response
function sendRpc(queue, message, callback) {
  amqp.connect(process.env.RABBITMQ_URL, (err, conn) => {
    if (err) throw err;
    conn.createChannel((err, ch) => {
      if (err) throw err;
      const correlationId = uuid.v4(); // Unique ID for this request
      const replyQueue = "amq.rabbitmq.reply-to"; // Use RabbitMQ's reply-to mechanism
      // Set up consumer for reply messages
      ch.consume(
        replyQueue,
        (msg) => {
          if (msg.properties.correlationId === correlationId) {
            const parsedMessage = JSON.parse(msg.content.toString());
            callback(parsedMessage); // Call the callback with the response message
          }
        },
        { noAck: true }
      ); // Send the request message
      const messageString = JSON.stringify(message);
      ch.sendToQueue(queue, Buffer.from(messageString), {
        correlationId: correlationId,
        replyTo: replyQueue,
      });
    });
  });
}

// Process each service configuration
services.forEach(({ route, target, queue }) => {
  if (target) {
    // For synchronous create service with circuit breaker
    const breaker = new CircuitBreaker(
      async (req, res) => {
        const response = await fetch(target, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: req.query.url }),
        });
        const data = await response.text();
        res.send(data);
      },
      {
        timeout: 5000, // Timeout for the circuit breaker
        errorThresholdPercentage: 50, // Percentage of errors to open the circuit
        resetTimeout: 30000, // Time to wait before closing the circuit
      }
    ); // Fallback for circuit breaker
    breaker.fallback(() => ({ status: 503, message: "Service Unavailable" })); // Apply circuit breaker middleware
    router.post(route, (req, res) => {
      breaker.fire(req, res).catch((error) => {
        res.status(503).json({ message: "Service Unavailable", error });
      });
    });
  } else if (queue) {
    // For asynchronous get service using RabbitMQ RPC
    const breaker = new CircuitBreaker(
      async (req, res) => {
        const id = req.params.id;
        const message = { id };
        sendRpc(queue, message, (response) => {
          res.json(response); // Send the response back to the client
        });
      },
      {
        timeout: 5000, // Timeout for the circuit breaker
        errorThresholdPercentage: 50, // Percentage of errors to open the circuit
        resetTimeout: 30000, // Time to wait before closing the circuit
      }
    );

    // Fallback for circuit breaker
    breaker.fallback(() => ({
      status: 503,
      message: "Service Unavailable",
    }));

    // Apply circuit breaker middleware
    router.get(`${route}/:id`, (req, res) => {
      breaker.fire(req, res).catch((error) => {
        res.status(503).json({ message: "Service Unavailable", error });
      });
    });
  }
});

module.exports = router;
