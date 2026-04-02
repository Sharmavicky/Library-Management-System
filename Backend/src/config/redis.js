const { createClient } = require("redis");

// create a redis client
const redisClient = createClient({
    url: process.env.REDIS_URL,
});

redisClient.on("error", (err) => {
    console.error("Redis Client Error: ", err);
});

redisClient.on("reconnecting", () => {
    console.log("Attempting to reconnect to Redis server...");
});

redisClient.on("ready", () => {
    console.log("Redis client is ready to use.");
});

// connect to redis server
const connectRedis = async () => {
    try {
        await redisClient.connect();
        console.log("Connected to Redis server successfully");
    } catch (err) {
        console.error("Error connecting to Redis server:", err);
    }
};

// export the redis client and the connect function
module.exports = {
    redisClient,
    connectRedis
};