require("dotenv").config();
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

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
const interval = 60 * 1000;  //1 min
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

services.forEach(({ route, target }) => {
  const proxyOptions = {
    target,
    changeOrigin: true,
    pathRewrite: {
      [`^${route}`]: "",
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[Proxy] ${req.method} request to: ${req.originalUrl}`);
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log(`[Proxy] Response from target: ${target}`);
    },
  };

  router.use(route, createProxyMiddleware(proxyOptions));
});

module.exports = router;
