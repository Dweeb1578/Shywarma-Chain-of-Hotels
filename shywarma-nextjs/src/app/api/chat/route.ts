
import { NextRequest, NextResponse } from "next/server";
import { Groq } from "groq-sdk";
import { Pinecone } from "@pinecone-database/pinecone";
import { CohereEmbeddings } from "@langchain/cohere";
import { PineconeStore } from "@langchain/pinecone";
import { logChatInteraction } from "@/lib/supabase";

// Initialize clients ONCE (singleton pattern)
import Redis from 'ioredis';
import crypto from 'crypto';

// Initialize clients ONCE (singleton pattern)
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
});

// Remove Cohere initialization - using Integrated Inference now
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX!;
const EMBEDDING_MODEL = "multilingual-e5-large";

// Initialize Redis if URL is available
let redis: Redis | null = null;
if (process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL);
}

export async function POST(req: NextRequest) {
    const startTime = Date.now();
    try {
        const { messages } = await req.json();
        const lastMessage = messages[messages.length - 1];
        const userQuery = lastMessage.content;

        // Hash query for cache key
        const queryHash = crypto.createHash('md5').update(userQuery.toLowerCase().trim()).digest('hex');
        const cacheKey = `chat:context:${queryHash}`;

        let context: string | null = null;

        // Check Redis Cache
        if (redis) {
            try {
                const cached = await redis.get(cacheKey);
                if (cached) {
                    console.log(`[CACHE HIT] Redis Key: ${cacheKey}`);
                    context = cached;
                }
            } catch (err) {
                console.error("Redis Get Error:", err);
            }
        }

        if (!context) {
            const searchStart = Date.now();

            // 1. Generate Embedding via Pinecone Inference (Server-Side)
            const embeddingResult = await pinecone.inference.embed(
                EMBEDDING_MODEL,
                [userQuery],
                { inputType: 'query', truncate: 'END' }
            );

            const embeddingData = (embeddingResult as any).data || embeddingResult;
            const queryVector = embeddingData[0].values;

            // 2. Search Index using generated vector
            const index = pinecone.Index(PINECONE_INDEX_NAME);
            const queryResponse = await index.query({
                vector: queryVector,
                topK: 3,
                includeMetadata: true
            });

            console.log(`[PINECONE] Matches Found: ${queryResponse.matches.length}`);

            // 3. Extract Context
            context = queryResponse.matches
                .map((match: any) => match.metadata?.text || "")
                .filter((text: string) => text.length > 0)
                .join("\n\n---\n\n");

            console.log(`[SEARCH + EMBED] ${Date.now() - searchStart}ms`);

            // Save to Redis (7 days TTL)
            if (redis) {
                try {
                    await redis.setex(cacheKey, 7 * 24 * 60 * 60, context);
                } catch (err) {
                    console.error("Redis Set Error:", err);
                }
            }
        }

        // 3. Construct System Prompt (Static part for Caching)
        const staticSystemPrompt = `You are Shyla, the personal AI Travel Concierge for Shywarma Hotels.

CRITICAL RULE: ONLY mention things from the CONTEXT below. If something is NOT in the context at all, say "I don't have that information." But if you FOUND an answer, just give it - NO disclaimers like "I don't have info about other destinations" or "that's all I have".

PERSONA:
- Warm, friendly, and CONFIDENT. Never use uncertain phrases like "I think", "might be", "perhaps".
- Be direct: "This is..." not "I think this might be..."
- Use "I" and "we"

INSTRUCTIONS:
1. FORMATTING IS CRITICAL:
   - Use **bold** for EVERY hotel, destination, or package name. Example: **Azure Lagoon Resort**.
   - SEPARATE paragraphs with a BLANK LINE (double newline). This splits the message into bubbles.
2. BE CONCISE: 2-3 sentences max per paragraph.
3. GROUNDING: ONLY use info from the CONTEXT provided.
4. SUGGESTED_QUESTION RULE (REQUIRED):
   You MUST end your response with this exact format:
   SUGGESTED_QUESTION: [Your suggestion here]
   
   The suggestion MUST be a question the USER would ask (e.g., "Tell me about prices", "Show me photos").
   NEVER ask the user a question directly.
   Example: "SUGGESTED_QUESTION: What are the room rates?"`;

        // 4. Call Groq API with headers access
        const { data: chatCompletion, response: rawResponse } = await groq.chat.completions.create({
            messages: [
                { role: "system", content: staticSystemPrompt }, // Static prefix = CACHE HIT
                {
                    role: "user",
                    content: `CONTEXT FROM KNOWLEDGE BASE:\n${context}\n\n---\nUSER QUESTION: ${lastMessage.content}`
                } // Dynamic suffix
            ],
            model: "llama-3.1-8b-instant", // Best rate limits: 14.4K RPD
            temperature: 0.5,
            max_tokens: 600,
            stream: true, // We want streaming
        }).withResponse();

        const region = rawResponse.headers.get("x-groq-region");
        console.log(`[GROQ] Region: ${region}`);

        // 5. Stream Response
        // Next.js App Router streaming text response
        let fullResponse = "";
        let serverLatency = 0;

        const stream = new ReadableStream({
            async start(controller) {
                const clientStart = Date.now();

                try {
                    for await (const chunk of chatCompletion) {
                        const content = chunk.choices[0]?.delta?.content || "";
                        if (content) {
                            fullResponse += content;
                            controller.enqueue(new TextEncoder().encode(content));
                        }

                        // Check for usage stats in the chunk (Groq specific)
                        const usage = (chunk as any).x_groq?.usage;
                        if (usage) {
                            serverLatency = usage.total_time || 0;
                        }
                    }
                } catch (e) {
                    console.error("Error streaming chunks:", e);
                } finally {
                    controller.close();

                    // Calculate and log network stats
                    const clientLatency = (Date.now() - clientStart) / 1000; // seconds
                    const networkOverhead = clientLatency - serverLatency;

                    console.log(`[PERF] Client Latency: ${clientLatency.toFixed(2)}s`);
                    console.log(`[PERF] Server Latency: ${serverLatency.toFixed(2)}s`);
                    console.log(`[PERF] Network Overhead: ${networkOverhead.toFixed(2)}s`);

                    // Log to Supabase after stream completes
                    const responseTimeMs = Date.now() - startTime;
                    await logChatInteraction({
                        session_id: "anonymous-session", // Ideally pass this from client
                        user_query: userQuery,
                        bot_response: fullResponse,
                        response_time_ms: responseTimeMs
                    });
                }
            },
        });

        return new NextResponse(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        });

    } catch (error) {
        console.error("Error in Chat API:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
