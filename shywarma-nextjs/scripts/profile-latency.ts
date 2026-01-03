
import { Pinecone } from "@pinecone-database/pinecone";
import { CohereEmbeddings } from "@langchain/cohere";
import { PineconeStore } from "@langchain/pinecone";
import { Groq } from "groq-sdk";
import Redis from 'ioredis';
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX!;
const QUERY = "What are the luxury hotels in Maldives?";

async function runProfile() {
    console.log("🚀 Starting Latency Profile...\n");

    // 1. Redis Connection
    let start = Date.now();
    let redis: Redis | null = null;
    try {
        if (process.env.REDIS_URL) {
            redis = new Redis(process.env.REDIS_URL, {
                connectTimeout: 5000,
                maxRetriesPerRequest: 1
            });
            await redis.get("test-key");
            console.log(`✅ Redis Connect & Ping: ${(Date.now() - start).toFixed(0)}ms`);
        } else {
            console.log("⚠️ Redis skipped (no URL)");
        }
    } catch (e) {
        console.log(`❌ Redis Connect Failed: ${(Date.now() - start).toFixed(0)}ms`, e);
    } finally {
        if (redis) redis.disconnect();
    }

    // 2. Cohere Embedding
    start = Date.now();
    let embeddings: CohereEmbeddings;
    try {
        embeddings = new CohereEmbeddings({
            apiKey: process.env.COHERE_API_KEY,
            model: "embed-english-v3.0",
        });
        const vector = await embeddings.embedQuery(QUERY);
        console.log(`✅ Cohere Embedding: ${(Date.now() - start).toFixed(0)}ms (Size: ${vector.length})`);
    } catch (e) {
        console.error(`❌ Cohere Failed: ${(Date.now() - start).toFixed(0)}ms`, e);
        return;
    }

    // 3. Pinecone Search
    try {
        start = Date.now();
        const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
        const pineconeIndex = pinecone.Index(PINECONE_INDEX_NAME);

        // Pure ID search check first
        await pineconeIndex.describeIndexStats();
        console.log(`✅ Pinecone Connect/Stats: ${(Date.now() - start).toFixed(0)}ms`);

        start = Date.now();
        const vectorStore = await PineconeStore.fromExistingIndex(embeddings, { pineconeIndex });
        const results = await vectorStore.similaritySearch(QUERY, 3);
        console.log(`✅ Pinecone Vector Search: ${(Date.now() - start).toFixed(0)}ms (Found: ${results.length})`);
    } catch (e) {
        console.error(`❌ Pinecone Failed: ${(Date.now() - start).toFixed(0)}ms`, e);
    }

    // 4. Groq LLM
    try {
        start = Date.now();
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: "Say hello!" }],
            model: "llama-3.1-8b-instant",
        });
        console.log(`✅ Groq LLM (First Token/Complete): ${(Date.now() - start).toFixed(0)}ms`);
    } catch (e) {
        console.error(`❌ Groq Failed: ${(Date.now() - start).toFixed(0)}ms`, e);
    }
}

runProfile();
