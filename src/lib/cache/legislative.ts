/**
 * Redis caching for legislative data
 * Improves performance by caching frequently accessed data
 */

import { Redis } from '@upstash/redis';

interface CacheConfig {
  redis: Redis;
  defaultTTL: number;
}

class LegislativeCache {
  private redis: Redis;
  private defaultTTL: number;

  constructor() {
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    this.defaultTTL = 3600; // 1 hour default
  }

  /**
   * Cache user feed for 15 minutes
   */
  async getUserFeed(userId: string, filtersHash: string): Promise<any[] | null> {
    try {
      const key = `feed:user:${userId}:${filtersHash}`;
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached as string) : null;
    } catch (error) {
      console.error('Error getting cached user feed:', error);
      return null;
    }
  }

  async setUserFeed(userId: string, filtersHash: string, items: any[]): Promise<void> {
    try {
      const key = `feed:user:${userId}:${filtersHash}`;
      await this.redis.setex(key, 900, JSON.stringify(items)); // 15 minutes
    } catch (error) {
      console.error('Error caching user feed:', error);
    }
  }

  /**
   * Cache bill details for 4 hours
   */
  async getBill(billId: number): Promise<any | null> {
    try {
      const key = `bill:${billId}`;
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached as string) : null;
    } catch (error) {
      console.error('Error getting cached bill:', error);
      return null;
    }
  }

  async setBill(billId: number, bill: any): Promise<void> {
    try {
      const key = `bill:${billId}`;
      await this.redis.setex(key, 14400, JSON.stringify(bill)); // 4 hours
    } catch (error) {
      console.error('Error caching bill:', error);
    }
  }

  /**
   * Cache legislator details for 24 hours (less frequently updated)
   */
  async getLegislator(peopleId: number): Promise<any | null> {
    try {
      const key = `legislator:${peopleId}`;
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached as string) : null;
    } catch (error) {
      console.error('Error getting cached legislator:', error);
      return null;
    }
  }

  async setLegislator(peopleId: number, legislator: any): Promise<void> {
    try {
      const key = `legislator:${peopleId}`;
      await this.redis.setex(key, 86400, JSON.stringify(legislator)); // 24 hours
    } catch (error) {
      console.error('Error caching legislator:', error);
    }
  }

  /**
   * Cache session data for 12 hours
   */
  async getSession(sessionId: number): Promise<any | null> {
    try {
      const key = `session:${sessionId}`;
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached as string) : null;
    } catch (error) {
      console.error('Error getting cached session:', error);
      return null;
    }
  }

  async setSession(sessionId: number, session: any): Promise<void> {
    try {
      const key = `session:${sessionId}`;
      await this.redis.setex(key, 43200, JSON.stringify(session)); // 12 hours
    } catch (error) {
      console.error('Error caching session:', error);
    }
  }

  /**
   * Cache roll call details for 1 hour
   */
  async getRollCall(rollCallId: number): Promise<any | null> {
    try {
      const key = `rollcall:${rollCallId}`;
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached as string) : null;
    } catch (error) {
      console.error('Error getting cached roll call:', error);
      return null;
    }
  }

  async setRollCall(rollCallId: number, rollCall: any): Promise<void> {
    try {
      const key = `rollcall:${rollCallId}`;
      await this.redis.setex(key, 3600, JSON.stringify(rollCall)); // 1 hour
    } catch (error) {
      console.error('Error caching roll call:', error);
    }
  }

  /**
   * Cache LegiScan API responses to reduce API calls
   */
  async getLegiScanResponse(endpoint: string, params: Record<string, any>): Promise<any | null> {
    try {
      const paramsKey = Object.keys(params).sort().map(k => `${k}:${params[k]}`).join('|');
      const key = `legiscan:${endpoint}:${paramsKey}`;
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached as string) : null;
    } catch (error) {
      console.error('Error getting cached LegiScan response:', error);
      return null;
    }
  }

  async setLegiScanResponse(endpoint: string, params: Record<string, any>, data: any, ttl?: number): Promise<void> {
    try {
      const paramsKey = Object.keys(params).sort().map(k => `${k}:${params[k]}`).join('|');
      const key = `legiscan:${endpoint}:${paramsKey}`;
      await this.redis.setex(key, ttl || this.defaultTTL, JSON.stringify(data));
    } catch (error) {
      console.error('Error caching LegiScan response:', error);
    }
  }

  /**
   * Cache user's legislative interests for quick access
   */
  async getUserInterests(userId: string): Promise<any | null> {
    try {
      const key = `interests:${userId}`;
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached as string) : null;
    } catch (error) {
      console.error('Error getting cached user interests:', error);
      return null;
    }
  }

  async setUserInterests(userId: string, interests: any): Promise<void> {
    try {
      const key = `interests:${userId}`;
      await this.redis.setex(key, 7200, JSON.stringify(interests)); // 2 hours
    } catch (error) {
      console.error('Error caching user interests:', error);
    }
  }

  /**
   * Cache district information for geographic lookups
   */
  async getDistrictInfo(district: string): Promise<any | null> {
    try {
      const key = `district:${district}`;
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached as string) : null;
    } catch (error) {
      console.error('Error getting cached district info:', error);
      return null;
    }
  }

  async setDistrictInfo(district: string, info: any): Promise<void> {
    try {
      const key = `district:${district}`;
      await this.redis.setex(key, 86400, JSON.stringify(info)); // 24 hours
    } catch (error) {
      console.error('Error caching district info:', error);
    }
  }

  /**
   * Invalidate all user feed caches (call when new feed items are created)
   */
  async invalidateUserFeeds(): Promise<void> {
    try {
      const pattern = 'feed:user:*';
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Error invalidating user feeds:', error);
    }
  }

  /**
   * Invalidate specific user's feed cache
   */
  async invalidateUserFeed(userId: string): Promise<void> {
    try {
      const pattern = `feed:user:${userId}:*`;
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Error invalidating user feed:', error);
    }
  }

  /**
   * Invalidate cached data when bill changes
   */
  async invalidateBillData(billId: number): Promise<void> {
    try {
      const keysToDelete = [
        `bill:${billId}`,
        // Also invalidate any related roll calls
        // This would require tracking which roll calls belong to which bills
      ];
      
      await this.redis.del(...keysToDelete);
      
      // Invalidate all user feeds since bill data changed
      await this.invalidateUserFeeds();
    } catch (error) {
      console.error('Error invalidating bill data:', error);
    }
  }

  /**
   * Get cache statistics for monitoring
   */
  async getCacheStats(): Promise<{
    health: boolean;
    key_count: number;
  } | null> {
    try {
      // Use a simpler approach since Upstash Redis REST API has limited commands
      const health = await this.healthCheck();
      
      // Get approximate key count by checking some common patterns
      const feedKeys = await this.redis.keys('feed:*');
      const billKeys = await this.redis.keys('bill:*');
      const legislatorKeys = await this.redis.keys('legislator:*');
      
      return {
        health,
        key_count: feedKeys.length + billKeys.length + legislatorKeys.length
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return null;
    }
  }

  /**
   * Health check for Redis connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  }

  /**
   * Clean up expired keys (manual cleanup if needed)
   */
  async cleanup(): Promise<number> {
    try {
      // Get all keys that might be expired
      const allKeys = await this.redis.keys('*');
      let deletedCount = 0;
      
      // Check TTL for each key and delete if expired
      for (const key of allKeys) {
        const ttl = await this.redis.ttl(key);
        if (ttl === -2) { // Key is expired
          await this.redis.del(key);
          deletedCount++;
        }
      }
      
      return deletedCount;
    } catch (error) {
      console.error('Error during cache cleanup:', error);
      return 0;
    }
  }

  /**
   * Generate cache key hash for complex filters
   */
  generateFiltersHash(filters: any): string {
    // Create a deterministic hash of the filters for caching
    const filterString = JSON.stringify(filters, Object.keys(filters).sort());
    return Buffer.from(filterString).toString('base64').replace(/[=+/]/g, '').substring(0, 16);
  }

  /**
   * Static method for generating filters hash
   */
  static generateFiltersHash(filters: any): string {
    return legislativeCache.generateFiltersHash(filters);
  }
}

// Export singleton instance
export const legislativeCache = new LegislativeCache();

// Helper function to wrap database calls with caching
export async function withCache<T>(
  cacheKey: string,
  fetchFunction: () => Promise<T>,
  setCache: (data: T) => Promise<void>,
  getCache: () => Promise<T | null>,
  ttl?: number
): Promise<T> {
  try {
    // Try to get from cache first
    const cached = await getCache();
    if (cached !== null) {
      return cached;
    }
    
    // Fetch from database
    const data = await fetchFunction();
    
    // Cache the result
    await setCache(data);
    
    return data;
  } catch (error) {
    // If caching fails, still return the data
    console.error('Cache operation failed:', error);
    return await fetchFunction();
  }
}