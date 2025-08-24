import Redis from 'ioredis';
import { env } from '../../../config';
import { logger } from '../../logger';

// Interface for cache provider methods
export interface ICacheProvider {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: any, ttlSeconds: number): Promise<void>;
}

// Redis cache provider implementation
class RedisCacheProvider implements ICacheProvider {
  private client: Redis;

  // Initialize Redis client with connection URL
  constructor(redisUrl: string) {
    this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
    });

    // Log connection and error events
    this.client.on('connect', () => logger.info('Redis client connected'));
    this.client.on('error', (err) => logger.error(err, 'Redis client error'));
  }

  // Retrieve value from cache by key
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.client.get(key);
      return data ? (JSON.parse(data) as T) : null;
    } catch (error) {
        logger.error(error, `Failed to get key "${key}" from cache`);
        return null;
    }
  }

  // Set value in cache with TTL (time-to-live)
  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    try {
        await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (error) {
        logger.error(error, `Failed to set key "${key}" in cache`);
    }
  }
}

// Export a singleton cache provider instance
export const cacheProvider = new RedisCacheProvider(env.REDIS_URL);