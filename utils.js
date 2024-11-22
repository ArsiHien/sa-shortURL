require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

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
    const url = await prisma.uRL.findUnique({ where: { shortId: id } });
    return url ? url.originalUrl : null;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function create(id, url) {
  try {
    const newUrl = await prisma.uRL.create({
      data: { shortId: id, originalUrl: url },
    });
    return newUrl.shortId;
  } catch (error) {
    console.error("Error creating entry:", error.message);
    throw error;
  }
}

async function shortUrl(url) {
  while (true) {
    const newID = makeID(5);
    const originUrl = await findOrigin(newID);
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
