const express = require('express');
const gatewayRoutes = require('./gateway/gatewayRoutes');
require('dotenv').config();

const app = express();
const port = process.env.APP_PORT || 3000;

app.use(express.json());
app.use('/', gatewayRoutes);

app.listen(port, () => {
  console.log(`API Gateway listening on port ${port}`);
});
