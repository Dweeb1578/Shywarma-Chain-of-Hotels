
import Redis from 'ioredis';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function flushCache() {
    if (!process.env.REDIS_URL) {
        console.log("No REDIS_URL configured.");
        return;
    }

    const redis = new Redis(process.env.REDIS_URL);

    try {
        // Delete all keys matching our chat context pattern
        const keys = await redis.keys('chat:context:*');

        if (keys.length > 0) {
            await redis.del(...keys);
            console.log(`✅ Flushed ${keys.length} cached responses.`);
        } else {
            console.log("Cache was already empty.");
        }
    } catch (e) {
        console.error("Failed to flush cache:", e);
    } finally {
        redis.disconnect();
    }
}

flushCache();
