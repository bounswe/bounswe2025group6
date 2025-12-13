// src/utils/cache.js
// Simple in-memory cache with TTL (Time To Live) support

class Cache {
  constructor(defaultTTL = 5 * 60 * 1000) { // Default 5 minutes
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  /**
   * Generate a cache key from arguments
   */
  generateKey(key, ...args) {
    if (args.length === 0) {
      return key;
    }
    return `${key}:${JSON.stringify(args)}`;
  }

  /**
   * Get cached value
   */
  get(key, ...args) {
    const cacheKey = this.generateKey(key, ...args);
    const item = this.cache.get(cacheKey);

    if (!item) {
      return null;
    }

    // Check if expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(cacheKey);
      return null;
    }

    return item.value;
  }

  /**
   * Set cached value
   */
  set(key, value, ttl = null, ...args) {
    const cacheKey = this.generateKey(key, ...args);
    const expiresAt = Date.now() + (ttl || this.defaultTTL);

    this.cache.set(cacheKey, {
      value,
      expiresAt,
      createdAt: Date.now()
    });
  }

  /**
   * Check if key exists and is valid
   */
  has(key, ...args) {
    const cacheKey = this.generateKey(key, ...args);
    const item = this.cache.get(cacheKey);

    if (!item) {
      return false;
    }

    if (Date.now() > item.expiresAt) {
      this.cache.delete(cacheKey);
      return false;
    }

    return true;
  }

  /**
   * Delete cached value
   */
  delete(key, ...args) {
    const cacheKey = this.generateKey(key, ...args);
    return this.cache.delete(cacheKey);
  }

  /**
   * Clear all cache or cache matching a pattern
   */
  clear(pattern = null) {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    // Clear cache entries matching pattern
    for (const key of this.cache.keys()) {
      if (key.startsWith(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear expired entries
   */
  clearExpired() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache size
   */
  size() {
    return this.cache.size;
  }
}

// Create singleton instances for different cache types
export const userCache = new Cache(5 * 60 * 1000); // 5 minutes for user data
export const recipeCache = new Cache(10 * 60 * 1000); // 10 minutes for recipes
export const postCache = new Cache(2 * 60 * 1000); // 2 minutes for posts (more dynamic)
export const commentCache = new Cache(2 * 60 * 1000); // 2 minutes for comments

// Clear expired entries every minute
if (typeof window !== 'undefined') {
  setInterval(() => {
    userCache.clearExpired();
    recipeCache.clearExpired();
    postCache.clearExpired();
    commentCache.clearExpired();
  }, 60 * 1000);
}

export default Cache;

