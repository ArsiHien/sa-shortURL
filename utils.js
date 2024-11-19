const { MongoClient } = require("mongodb");
require("dotenv").config();
const uri = process.env.AZURE_COSMOS_CONNECTIONSTRING || process.env.MONGODB_URI;
const client = new MongoClient(uri);
let collection;

async function run() {
  try {
    const database = client.db("data");
    collection = database.collection("urls");
    console.log("Connected to MongoDB...");
  } catch (error) {
    console.error("Connect database error: ", error);
  }
}

function makeID(length) {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

async function findOrigin(id) {
  try {
    const res = await collection.findOne({ id });
    return res ? res.url : null;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function create(id, url) {
  try {
    await collection.insertOne({ id, url });
    return id;
  } catch (error) {
    console.error("Error creating entry:", error.message);
    throw error;
  }
}

async function shortUrl(url) {
  while (true) {
    let newID = makeID(5);
    let originUrl = await findOrigin(newID);
    if (originUrl == null);
    await create(newID, url);
    return newID;
  }
}

run().catch(console.dir);

module.exports = {
  findOrigin,
  shortUrl,
};
