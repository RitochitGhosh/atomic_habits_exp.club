import { createClient } from 'redis';

const globalForRedis = globalThis as unknown as {
  redis: ReturnType<typeof createClient> | undefined;
};

export const redis = globalForRedis.redis ?? createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

redis.on('error', (err) => console.log('Redis Client Error', err));
redis.on('connect', () => console.log('Redis Client Connected'));

export const connectRedis = async () => {
  if (!redis.isOpen) {
    await redis.connect();
  }
};
