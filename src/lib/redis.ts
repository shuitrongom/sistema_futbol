import Redis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedisClient(): Redis {
  const url = process.env.REDIS_URL || "redis://localhost:6379";

  const client = new Redis(url, {
    maxRetriesPerRequest: null,
    retryStrategy() {
      // Never retry — app works fine without Redis
      return null;
    },
    lazyConnect: true,
    enableOfflineQueue: false,
    connectTimeout: 2000,
    showFriendlyErrorStack: false,
  });

  // Completely silence all Redis errors
  client.on("error", () => {});

  return client;
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;

export default redis;
