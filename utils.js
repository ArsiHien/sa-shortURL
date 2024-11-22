require("dotenv").config();
const mongoClient = require("./database/initMongo");

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
    const database = mongoClient.db("data");
    const collection = database.collection("urls");
    const res = await collection.findOne({ id });
    return res ? res.url : null;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function create(id, url) {
  try {
    const database = mongoClient.db("data");
    const collection = database.collection("urls");
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

module.exports = {
  makeID,
  findOrigin,
  shortUrl,
};
