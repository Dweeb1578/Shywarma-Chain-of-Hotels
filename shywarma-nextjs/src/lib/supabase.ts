import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// Only create client if keys exist (prevents build errors)
export const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : null;

// Log a chat interaction
export async function logChatInteraction(data: {
    session_id: string;
    user_query: string;
    bot_response: string;
    response_time_ms: number;
}) {
    // Fail silently if Supabase is not configured
    if (!supabase) return;

    try {
        const { error } = await supabase
            .from('chat_logs')
            .insert([{
                session_id: data.session_id,
                user_query: data.user_query,
                bot_response: data.bot_response,
                response_time_ms: data.response_time_ms,
                created_at: new Date().toISOString()
            }]);

        if (error) {
            console.error('Error logging chat:', error);
        }
    } catch (err) {
        console.error('Supabase logging error:', err);
    }
}
