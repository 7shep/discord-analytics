import { Redis } from "ioredis";
import { config } from "../config.js";

let redis: Redis | null = null;

if (config.redis.url) {
  redis = new Redis(config.redis.url, { maxRetriesPerRequest: 3 });
  redis.on("error", (err: Error) => console.error("[Redis] Connection error:", err.message));
  redis.on("connect", () => console.log("[Redis] Connected"));
} else {
  console.log("[Redis] No REDIS_URL set — caching disabled");
}

/** Get a cached value. Returns null on miss or if Redis is unavailable. */
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    const data = await redis.get(key);
    return data ? (JSON.parse(data) as T) : null;
  } catch {
    return null;
  }
}

/** Set a cached value with TTL in seconds. No-op if Redis is unavailable. */
export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    // Silently fail — caching is best-effort
  }
}
