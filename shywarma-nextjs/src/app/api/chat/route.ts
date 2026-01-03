
import { NextRequest, NextResponse } from "next/server";
import { Groq } from "groq-sdk";
import { Pinecone } from "@pinecone-database/pinecone";
import { CohereEmbeddings } from "@langchain/cohere";
import { PineconeStore } from "@langchain/pinecone";
import { logChatInteraction } from "@/lib/supabase";

// Initialize clients ONCE (singleton pattern)
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
});

const embeddings = new CohereEmbeddings({
    apiKey: process.env.COHERE_API_KEY,
    model: "embed-english-v3.0", // Must match the model used for ingestion
});

const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX!;

// Simple in-memory cache for repeated queries
const queryCache = new Map<string, string>();

// Reusable vector store instance
let vectorStore: PineconeStore | null = null;

async function getVectorStore() {
    if (!vectorStore) {
        const pineconeIndex = pinecone.Index(PINECONE_INDEX_NAME);
        vectorStore = await PineconeStore.fromExistingIndex(embeddings, { pineconeIndex });
    }
    return vectorStore;
}

export async function POST(req: NextRequest) {
    const startTime = Date.now();
    try {
        const { messages } = await req.json();
        const lastMessage = messages[messages.length - 1];
        const userQuery = lastMessage.content;

        // Check cache first
        const cacheKey = userQuery.toLowerCase().trim();
        const cachedContext = queryCache.get(cacheKey);

        let context: string;

        if (cachedContext) {
            console.log(`[CACHE HIT] Query: "${cacheKey.slice(0, 30)}..."`);
            context = cachedContext;
        } else {
            const searchStart = Date.now();
            const store = await getVectorStore();
            const results = await store.similaritySearch(userQuery, 3); // Balanced coverage
            context = results.map((r) => r.pageContent).join("\n\n---\n\n");
            console.log(`[SEARCH] ${Date.now() - searchStart}ms`);

            // Cache the result
            queryCache.set(cacheKey, context);
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
