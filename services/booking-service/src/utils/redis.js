const redis = require("redis");

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const redisClient = redis.createClient({ url: REDIS_URL });

redisClient.on("error", (error) =>
  console.log("Redis connection error", error),
);

const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log("✅ Redis Connected");
  }
};

module.exports = { redisClient, connectRedis };
