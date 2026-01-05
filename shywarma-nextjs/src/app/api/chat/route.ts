import { NextRequest, NextResponse } from "next/server";
import { Groq } from "groq-sdk";
import { Pinecone } from "@pinecone-database/pinecone";
import { getCoordinates, getWeather, getWeatherDescription } from "@/lib/weather";
import { destinations } from "@/data/destinations"; // Import destinations to check against user query
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
        const cacheKey = `chat: context:${queryHash} `;

        let context: string | null = null;

        // Check Redis Cache
        if (redis) {
            try {
                const cached = await redis.get(cacheKey);
                if (cached) {
                    console.log(`[CACHE HIT] Redis Key: ${cacheKey} `);
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
                topK: 5, // Reduced from 8 for faster response times
                includeMetadata: true
            });

            console.log(`[PINECONE] Matches Found: ${queryResponse.matches.length} `);

            // 3. Extract Context
            context = queryResponse.matches
                .map((match: any) => match.metadata?.text || "")
                .filter((text: string) => text.length > 0)
                .join("\n\n---\n\n");

            console.log(`[SEARCH + EMBED] ${Date.now() - searchStart} ms`);

            // Save to Redis (7 days TTL)
            if (redis) {
                try {
                    await redis.setex(cacheKey, 7 * 24 * 60 * 60, context);
                } catch (err) {
                    console.error("Redis Set Error:", err);
                }
            }
        }

        // 3. Weather Integration
        const weatherPromises = destinations
            .filter(d => userQuery.toLowerCase().includes(d.name.toLowerCase()))
            .map(async (d) => {
                const coords = await getCoordinates(d.name);
                if (coords) {
                    const weather = await getWeather(coords.lat, coords.lon);
                    if (weather && weather.current) {
                        const desc = getWeatherDescription(weather.current.weather_code);
                        // Get daily forecast if available
                        let forecastStr = "";
                        if (weather.daily) {
                            forecastStr = "\nForecast:\n" + weather.daily.time.slice(0, 5).map((t: string, i: number) =>
                                `- ${t}: ${getWeatherDescription(weather.daily.weather_code[i])}, Max: ${weather.daily.temperature_2m_max[i]}°C, Min: ${weather.daily.temperature_2m_min[i]}°C`
                            ).join("\n");
                        }
                        return `CURRENT WEATHER in ${d.name.toUpperCase()}: \nTemp: ${weather.current.temperature_2m}°C, Condition: ${desc}${forecastStr} `;
                    }
                }
                return null;
            });

        const weatherResults = await Promise.all(weatherPromises);
        const weatherContext = weatherResults.filter(Boolean).join("\n\n");

        if (weatherContext) {
            context = (context ? context + "\n\n---\n\n" : "") + weatherContext;
        }

        // 4. Construct System Prompt (Static part for Caching)
        const staticSystemPrompt = `You are Shyla, the personal AI Travel Concierge for Shywarma Hotels.
            
            ABSOLUTE RULE - NO HALLUCINATIONS:
            - You may ONLY mention hotels, packages, destinations, prices, and amenities that are EXPLICITLY written in the CONTEXT section below.
            - If a hotel name or detail is NOT in the CONTEXT, you MUST say "I don't have that information."
                - NEVER invent or make up hotel names, prices, or features.This is critical.Making up information is a failure.
            
            KNOWN DESTINATIONS(CRITICAL - You MUST mention ALL 5 destinations when asked, never skip any):
            - ** Maldives ** - Paradise on Earth, overwater villas
                - ** Santorini ** - Greek island, caldera views, sunsets
                    - ** Dubai ** - Luxury city, desert adventures, shopping
                        - ** Bali ** - Island of the Gods, temples, rice terraces
                            - ** Paris ** - City of Light & Love, art, gastronomy
            IMPORTANT: When asked about destinations, ALWAYS list ALL FIVE above. Missing any is a critical error.

            WEATHER CONTEXT:
            The user has provided real-time weather data. You MUST use the specific DATES provided in the weather context when generating the itinerary.
            If weather says "Forecast for Oct 12", your itinerary Day 1 must be "Oct 12".
            
                PERSONA:
            - Warm, friendly, and CONFIDENT.Never use uncertain phrases like "I think", "might be", "perhaps".
            - Be direct: "This is..." not "I think this might be..."
                    - Use "I" and "we"
            
            MANDATORY FORMATTING RULES:
            1. Use ** bold ** for EVERY hotel, destination, or package name.Example: ** Azure Lagoon Resort **.
            2. DO NOT use numbered lists(1. 2. 3.).Instead, write each item as its own paragraph separated by blank lines.
            3. PARAGRAPH BREAKS: After EVERY item or 1 - 2 sentences, insert TWO blank lines.
            4. BE CONCISE: 2 - 3 sentences max per response section.
            
            ITINERARY GENERATION RULE(CRITICAL):
            If the user asks for an "itinerary", "plan", or "schedule", OR asks to "update", "change", or "edit" the current plan, you MUST OUTPUT A NEW JSON BLOCK for the itinerary at the end of your text response.
            You must RE-PRINT the entire updated JSON structure. Do not just describe changes.
                Format:
                \`\`\`json
                {
                  "title": "3 Days in Paris",
                  "days": [
                    { 
                      "day": 1, 
                      "date": "Oct 12, 2025",
                      "title": "Arrival & Art", 
                      "activities": [
                        { "time": "10:00 AM", "description": "Check-in at Le Maison Royale and freshen up.", "distance": "2km from airport" },
                        { "time": "02:00 PM", "description": "Visit Louvre Museum to see the Mona Lisa.", "distance": "500m walk" },
                        { "time": "08:00 PM", "description": "Dinner at Seine Cruise with live music.", "distance": "1km from hotel" }
                      ] 
                    }
                  ]
                }
                \`\`\`
            DO NOT print the JSON inside the text flow. Print it as a separate code block at the VERY END.
            
            CRITICAL - SUGGESTED QUESTION (ALWAYS REQUIRED):
            You MUST ALWAYS end EVERY response with exactly this format on its own line:
            SUGGESTED_QUESTION: [a follow-up question]
            
            Example ending: "...wonderful amenities.\n\nSUGGESTED_QUESTION: What are the room rates?"
            Failing to include SUGGESTED_QUESTION is a critical error. NEVER forget it.`;

        // 4. Construct Groq Messages
        const groqMessages: any[] = [
            { role: "system", content: staticSystemPrompt }, // Static prefix = CACHE HIT
            {
                role: "user",
                content: `CONTEXT FROM KNOWLEDGE BASE: \n${context} \n\n-- -\nUSER QUESTION: ${lastMessage.content}`
            }
        ];

        // 5. Intent Detection & Reinforcement
        // If the user wants a plan, we FORCE the model to pay attention to the JSON rule
        // by appending a fresh system instruction at the end.
        if (/itinerary|plan|schedule|trip/i.test(lastMessage.content)) {
            groqMessages.push({
                role: "system",
                content: "CRITICAL: The user is asking for a travel plan. You MUST include the defined JSON itinerary block at the end of your response."
            });
        }

        // 6. Call Groq API
        const { data: chatCompletion, response: rawResponse } = await groq.chat.completions.create({
            messages: groqMessages,
            model: "llama-3.1-8b-instant", // Best rate limits: 14.4K RPD
            temperature: 0.3, // Lower for more consistent instruction following
            max_tokens: 800, // Increased to ensure SUGGESTED_QUESTION isn't cut off
            stream: true, // We want streaming
        }).withResponse();

        const region = rawResponse.headers.get("x-groq-region");
        console.log(`[GROQ] Region: ${region} `);

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

                    console.log(`[PERF] Client Latency: ${clientLatency.toFixed(2)} s`);
                    console.log(`[PERF] Server Latency: ${serverLatency.toFixed(2)} s`);
                    console.log(`[PERF] Network Overhead: ${networkOverhead.toFixed(2)} s`);

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
