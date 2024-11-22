require("dotenv").config();
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const CircuitBreaker = require("opossum");
const router = express.Router();
const BASE_URL = "http://localhost";

const services = [
  {
    route: "/create",
    target: `${BASE_URL}:${process.env.CREATE_SERVICE_PORT}/create`,
  },
  {
    route: "/short",
    target: `${BASE_URL}:${process.env.GET_SERVICE_PORT}/short`,
  },
];

const rateLimit = 60; //req/min
const interval = 60 * 1000; //1 min
const requestCounts = {};

setInterval(() => {
  Object.keys(requestCounts).forEach((ip) => {
    requestCounts[ip] = 0;
  });
}, interval);

function rateLimitAndTimeout(req, res, next) {
  const ip = req.ip;
  requestCounts[ip] = (requestCounts[ip] || 0) + 1;

  if (requestCounts[ip] > rateLimit) {
    return res.status(429).json({
      code: 429,
      status: "Error",
      message: "Rate limit exceeded.",
      data: null,
    });
  }

  req.setTimeout(15000, () => {
    res.status(504).json({
      code: 504,
      status: "Error",
      message: "Gateway timeout.",
      data: null,
    });
    req.abort();
  });

  next();
}

router.use(rateLimitAndTimeout); // Apply rate limit and timeout once for all routes

const circuitBreakerOptions = {
  timeout: 5000, //longer than 5s => fails
  errorThresholdPercentage: 50, //when 50% req fail => open
  resetTimeout: 10000, //try again after 10s
};

const circuitBreakers = {};
services.forEach(({ route, target }) => {
  const breaker = new CircuitBreaker(async (req, res) => {
    return new Promise((resolve, reject) => {
      const proxyOptions = {
        target,
        changeOrigin: true,
        pathRewrite: {
          [`^${route}`]: "", // Remove the route prefix when forwarding the request
        },
      };
      const proxy = createProxyMiddleware(proxyOptions);
      proxy(req, res, (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  }, circuitBreakerOptions);
  breaker.fallback(() => {
    console.error(`Circuit breaker for ${target} is open`);
    return { status: 503, message: "Service Unavailable" };
  });
  circuitBreakers[route] = breaker;
  router.use(route, (req, res) => {
    breaker.fire(req, res).catch((error) => {
      res.status(503).json({ message: "Service Unavailable", error });
    });
  });
});

module.exports = router;
