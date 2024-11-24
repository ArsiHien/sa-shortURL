require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const crypto = require('crypto');

const prisma = new PrismaClient();

function makeID(url) {
    // Create a hash of the URL
    const hash = crypto.createHash('sha256')
        .update(url)
        .digest('base64')
        .replace(/[+/=]/g, '') // Remove +, / and = characters
        .slice(0, 5);          // Take first 5 characters
    return hash;
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
