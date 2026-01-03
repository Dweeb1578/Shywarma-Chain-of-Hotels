
import Redis from 'ioredis';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
    console.error("REDIS_URL not found in .env.local");
    process.exit(1);
}

const redis = new Redis(redisUrl);

async function checkCache() {
    try {
        console.log("Connecting to Redis...");

        // 1. Get all keys matching our pattern
        const keys = await redis.keys('chat:context:*');
        console.log(`\nFound ${keys.length} cached queries.`);

        let totalBytes = 0;
        let avgBytes = 0;

        if (keys.length > 0) {
            console.log("\n--- Latest Cached Keys & Sizes ---");
            // Check sizes
            for (const key of keys) {
                const val = await redis.get(key);
                if (val) {
                    const size = Buffer.byteLength(val, 'utf8');
                    totalBytes += size;
                    // Print details for first 5 only
                    if (keys.indexOf(key) < 5) {
                        const ttl = await redis.ttl(key);
                        console.log(`Key: ...${key.substring(key.length - 8)} | Size: ${(size / 1024).toFixed(2)} KB | TTL: ${(ttl / 3600).toFixed(1)}h`);
                    }
                }
            }

            avgBytes = totalBytes / keys.length;
            console.log('---');
            console.log(`Total Stored Content: ${(totalBytes / 1024).toFixed(2)} KB`);
            console.log(`Average Query Size: ${(avgBytes / 1024).toFixed(2)} KB`);

            // Capacity Calculation (30MB Limit)
            const limitBytes = 30 * 1024 * 1024; // 30 MB
            const capacity = avgBytes > 0 ? limitBytes / avgBytes : 0; // Avoid division by zero

            console.log(`\n--- 📊 Capacity Analysis (30MB Plan) ---`);
            console.log(`Used: ${((totalBytes / limitBytes) * 100).toFixed(4)}%`);
            console.log(`Estimated Capacity: ~${Math.floor(capacity).toLocaleString()} unique queries`);
        } else {
            console.log("Cache is empty. Try asking a question in the chat!");
        }

    } catch (error) {
        console.error("Redis Error:", error);
    } finally {
        redis.disconnect();
    }
}

checkCache();
