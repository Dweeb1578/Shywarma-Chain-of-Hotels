import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
    try {
        const { phone } = await req.json();

        if (!phone) {
            return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
        }

        // Basic cleaning of phone number (remove spaces, dashes)
        // In a real app, strict E.164 formatting is better
        const cleanPhone = phone.replace(/[^\d+]/g, '');

        // Check if user exists
        const { data: user, error } = await supabase!
            .from('users')
            .select('id')
            .eq('phone_number', cleanPhone)
            .single();

        if (error || !user) {
            // Check if it was just not found or actual error
            if (error && error.code !== 'PGRST116') { // PGRST116 is 'not found'
                console.error("User Lookup Error:", error);
                return NextResponse.json({ error: "Database error" }, { status: 500 });
            }

            // Not found
            return NextResponse.json({ found: false });
        }

        return NextResponse.json({ found: true, userId: user.id });

    } catch (e) {
        console.error("Phone Verification API Error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
