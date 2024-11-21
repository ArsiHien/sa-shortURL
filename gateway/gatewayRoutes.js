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

services.forEach(({ route, target }) => {
  console.log(`Setting up proxy for ${route} -> ${target}`);
  router.use(
    route,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: {
        // Keep the full route for forwarding
        // Remove this line if you want the target to see the original route as-is
        [`^${route}`]: route,
      },
      onProxyReq: (proxyReq, req) => {
        console.log(
          `Forwarding ${req.method} request for ${req.originalUrl} to ${target}`
        );
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log(
          `Response received for ${req.originalUrl} from ${target} with status ${proxyRes.statusCode}`
        );
      },
    })
  );
});

module.exports = router;
