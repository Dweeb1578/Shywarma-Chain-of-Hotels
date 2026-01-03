
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Environment variable for verification
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

// 1. Verification Endpoint (GET)
// Meta calls this when you configure the webhook URL to verify you own the domain.
export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    // Check if mode and token are in the query params
    if (mode && token) {
        // Check if mode and token are correct
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('[WHATSAPP] Webhook verified!');
            // Return the challenge token from the request
            return new NextResponse(challenge, { status: 200 });
        } else {
            console.error('[WHATSAPP] Verification failed. Token mismatch.');
            return new NextResponse('Forbidden', { status: 403 });
        }
    }

    return new NextResponse('Bad Request', { status: 400 });
}

// 2. Event Listener Endpoint (POST)
// Meta sends messages here.
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Check if this is a WhatsApp status update
        // (Meta sends 'messages' and 'statuses' - we only care about messages for now)
        const isMessage = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

        if (isMessage) {
            const message = isMessage;
            const businessPhoneNumberId = body.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;
            const from = message.from; // Sender's phone number (WAID)
            const messageBody = message.text?.body; // Text content

            console.log(`[WHATSAPP] Msg from ${from}: ${messageBody}`);

            if (from && messageBody && supabase) {
                // A. Ensure User Exists
                // Try to find user by phone number
                let { data: user, error: findError } = await supabase
                    .from('users')
                    .select('id')
                    .eq('phone_number', from)
                    .single();

                if (!user) {
                    // Create new user if not found
                    console.log(`[WHATSAPP] New user detected: ${from}`);
                    const { data: newUser, error: createError } = await supabase
                        .from('users')
                        .insert([{ phone_number: from }])
                        .select()
                        .single();

                    if (createError || !newUser) {
                        console.error('[WHATSAPP] Failed to create user:', createError);
                        return NextResponse.json({ error: 'DB Error' }, { status: 500 });
                    }
                    user = newUser;
                }

                if (!user) {
                    // Should be unreachable but satisfies TS
                    console.error('[WHATSAPP] User is null after creation flow');
                    return NextResponse.json({ error: 'User Not Found' }, { status: 500 });
                }

                // B. Store Message
                // Insert into unified_messages
                const { error: msgError } = await supabase
                    .from('unified_messages')
                    .insert([{
                        user_id: user.id,
                        source: 'whatsapp',
                        role: 'user',
                        content: messageBody,
                        created_at: new Date().toISOString()
                    }]);

                if (msgError) {
                    console.error('[WHATSAPP] Failed to save message:', msgError);
                } else {
                    console.log('[WHATSAPP] Message saved to DB');
                }
            }
        }

        // Return a '200 OK' response to all requests
        return NextResponse.json({ status: 'success' });

    } catch (error) {
        console.error('[WHATSAPP] Error processing webhook:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
