import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { Groq } from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
    try {
        const { userId } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: "userId is required" }, { status: 400 });
        }

        // 1. Fetch last 5 messages from unified_messages
        // In a real app, you'd match the UUID. For the 'magic link' simulation, 
        // we'll assume the userId passed IS the UUID in the DB.
        const { data: history, error } = await supabase!
            .from('unified_messages')
            .select('role, content, source')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) {
            console.error("Db Fetch Error:", error);
            // Fallback if DB not ready or empty
            return NextResponse.json({
                greeting: "Welcome back! How can I help you today?",
                suggestions: ["Browse Hotels", "Check Prices", "Contact Support"]
            });
        }

        // If no history found, return generic
        if (!history || history.length === 0) {
            return NextResponse.json({
                greeting: "Welcome! I see you're new here. How can I help you plan your trip?",
                suggestions: ["Top Destinations", "Luxury Suites", "Travel Packages"]
            });
        }

        // 2. Reverse to chronological order for LLM
        const recentChats = history.reverse();

        // 3. Generate Context-Aware Greeting with LLM
        const systemPrompt = `
        You are Shyla, a helpful travel assistant.
        The user has just arrived on the website after chatting on WhatsApp.
        
        CONTEXT:
        ${recentChats.map(m => `[${m.source.toUpperCase()}] ${m.role}: ${m.content}`).join('\n')}
        
        TASK:
        1. Generate a brief, warm greeting (1 sentence) acknowledging their previous chat context.
        2. Generate 3 short, relevant suggested questions they might want to ask next on the website.
        
        OUTPUT FORMAT (JSON):
        {
            "greeting": "Your greeting here...",
            "suggestions": ["Question 1", "Question 2", "Question 3"]
        }
        `;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: "Generate greeting based on context." }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(completion.choices[0].message.content || "{}");

        return NextResponse.json({
            greeting: result.greeting || "Welcome back! Continuing from where we left off...",
            suggestions: result.suggestions || ["View Details", "Book Now", "More Info"]
        });

    } catch (e) {
        console.error("Context API Error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
