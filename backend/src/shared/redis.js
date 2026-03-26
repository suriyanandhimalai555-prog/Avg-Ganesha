import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const client = createClient({
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('Redis: Max reconnection attempts reached. Giving up.');
        return new Error('Max reconnection attempts reached');
      }
      return Math.min(retries * 100, 3000);
    }
  }
});

client.on('error', (err) => console.error('Redis Client Error:', err));
client.on('connect', () => console.log('Redis Client Connecting...'));
client.on('ready', () => console.log('✅ Redis Client Ready'));

/**
 * Initialize connection
 */
export const connectRedis = async () => {
  if (!client.isOpen) {
    try {
      await client.connect();
    } catch (err) {
      console.error('Could not connect to Redis:', err);
    }
  }
};

// Auto-connect
connectRedis();

/**
 * Generic fetch-through cache helper
 * @param {string} key Cache key
 * @param {Function} fetchFn Function to fetch data if cache miss
 * @param {number} ttl Time to live in seconds
 */
export const getCachedData = async (key, fetchFn, ttl = 3600) => {
  try {
    if (!client.isOpen) return fetchFn();

    const cachedValue = await client.get(key);
    if (cachedValue) {
      console.log(`🚀 Redis: Cache HIT [${key}]`);
      return JSON.parse(cachedValue);
    }

    console.log(`🐢 Redis: Cache MISS [${key}] - Fetching from Source`);
    const freshData = await fetchFn();
    if (freshData !== undefined && freshData !== null) {
      await client.setEx(key, ttl, JSON.stringify(freshData));
    }
    return freshData;
  } catch (err) {
    console.error(`Redis Cache Error (${key}):`, err);
    return fetchFn(); // Fallback to source on Redis error
  }
};

/**
 * Invalidate a cache key
 * @param {string} key 
 */
export const invalidateCache = async (key) => {
  try {
    if (client.isOpen) {
      await client.del(key);
    }
  } catch (err) {
    console.error(`Redis Invalidation Error (${key}):`, err);
  }
};

export default client;
