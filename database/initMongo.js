require("dotenv").config();
const { MongoClient } = require("mongodb");

const mongoClient = new MongoClient(process.env.MONGODB_URI);

mongoClient.on("serverOpening", () => {
  console.log("MongoDB client connected successfully.");
});

mongoClient.on("serverClosed", () => {
  console.log("MongoDB client connection closed.");
});

mongoClient.on("error", (error) => {
  console.error("MongoDB client error:", error);
});

module.exports = mongoClient;
