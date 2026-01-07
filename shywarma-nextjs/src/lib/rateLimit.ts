import Redis from 'ioredis';

// Rate limit configuration
const RATE_LIMIT_WINDOW = 60; // 60 seconds
const RATE_LIMIT_MAX_REQUESTS = 20; // 20 requests per window for anonymous users
const RATE_LIMIT_MAX_REQUESTS_AUTH = 50; // 50 requests per window for authenticated users

// Get Redis client from existing connection or create new
let redis: Redis | null = null;

function getRedis(): Redis | null {
    if (!process.env.REDIS_URL) return null;
    if (!redis) {
        redis = new Redis(process.env.REDIS_URL);
    }
    return redis;
}

interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetIn: number; // seconds until reset
}

/**
 * Check if a request is allowed under rate limiting rules
 * @param identifier - IP address or user ID
 * @param isAuthenticated - Whether user is logged in (higher limit)
 */
export async function checkRateLimit(
    identifier: string,
    isAuthenticated: boolean = false
): Promise<RateLimitResult> {
    const redisClient = getRedis();

    // If Redis is not configured, allow all requests (development mode)
    if (!redisClient) {
        return { allowed: true, remaining: 999, resetIn: 0 };
    }

    const maxRequests = isAuthenticated ? RATE_LIMIT_MAX_REQUESTS_AUTH : RATE_LIMIT_MAX_REQUESTS;
    const key = `ratelimit:${identifier}`;

    try {
        const multi = redisClient.multi();
        multi.incr(key);
        multi.ttl(key);
        const results = await multi.exec();

        if (!results) {
            return { allowed: true, remaining: maxRequests, resetIn: RATE_LIMIT_WINDOW };
        }

        const currentCount = results[0][1] as number;
        let ttl = results[1][1] as number;

        // Set expiry if this is a new key
        if (ttl === -1) {
            await redisClient.expire(key, RATE_LIMIT_WINDOW);
            ttl = RATE_LIMIT_WINDOW;
        }

        const allowed = currentCount <= maxRequests;
        const remaining = Math.max(0, maxRequests - currentCount);

        return { allowed, remaining, resetIn: ttl };
    } catch (error) {
        console.error('Rate limit check error:', error);
        // Fail open - allow request if Redis fails
        return { allowed: true, remaining: maxRequests, resetIn: RATE_LIMIT_WINDOW };
    }
}

/**
 * Get client identifier from request headers
 */
export function getClientIdentifier(headers: Headers): string {
    // Try X-Forwarded-For first (for proxied requests)
    const forwarded = headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    // Fall back to X-Real-IP
    const realIp = headers.get('x-real-ip');
    if (realIp) {
        return realIp;
    }

    // Default fallback
    return 'unknown';
}
