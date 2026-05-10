const { redisClient } = require("../src/config/redis");

// Function to set a token in Redis with an expiration time
const TOKEN_PREFIX = {
    refresh: "refresh_token",
    blacklist: "blacklist"
}

// save refresh token in redis with usedId as key for 7 days
const saveRefreshToken = async (userId, token) => {
    await redisClient.setEx(`${TOKEN_PREFIX.refresh}:${userId}`, 60 * 60 * 24 * 7, token);
}

// get refresh token from redis using userId
const getRefreshToken = async (userId) => {
    return await redisClient.get(`${TOKEN_PREFIX.refresh}:${userId}`);
}

// Delete refresh token from redis using userId on logout
const deleteRefreshToken = async (userId) => {
    await redisClient.del(`${TOKEN_PREFIX.refresh}:${userId}`);
}

// blacklist a jwt token by saving it in redis with an expiration time equal to the token's remaining validity
const blacklistToken = async (token, expiresIn) => {
    await redisClient.setEx(`${TOKEN_PREFIX.blacklist}:${token}`, expiresIn, "true");
}

// check if a token is blacklisted by looking it up in redis
const isTokenBlacklisted = async (token) => {
    const res = await redisClient.get(`${TOKEN_PREFIX.blacklist}:${token}`);
    return res === "true"; // returns true if token is blacklisted, otherwise false
}

module.exports = {
    saveRefreshToken,
    getRefreshToken,
    deleteRefreshToken,
    blacklistToken,
    isTokenBlacklisted
};