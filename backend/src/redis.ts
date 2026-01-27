import { Redis } from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export const connection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

export const workerConnection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

console.log(`🔌 Redis Connecting to ${REDIS_URL.substring(0, 20)}...`);
