"use client";
import { createClient, SupabaseClient, User, Subscription } from '@supabase/supabase-js';

// Browser-safe Supabase client (uses anon key, not service key)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
    if (!supabaseUrl || !supabaseAnonKey) {
        return null;
    }
    if (!supabaseClient) {
        supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    }
    return supabaseClient;
}

// Check if auth is configured
export function isAuthConfigured(): boolean {
    return Boolean(supabaseUrl && supabaseAnonKey);
}

// Google OAuth sign-in
export async function signInWithGoogle(): Promise<{ error: Error | null }> {
    const supabase = getSupabaseClient();
    if (!supabase) {
        return { error: new Error('Auth not configured. Please add NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local') };
    }
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${window.location.origin}/`,
        },
    });
    return { error: error as Error | null };
}

// Send OTP to phone number
export async function signInWithPhone(phone: string): Promise<{ error: Error | null }> {
    const supabase = getSupabaseClient();
    if (!supabase) {
        return { error: new Error('Auth not configured') };
    }
    const { error } = await supabase.auth.signInWithOtp({
        phone,
    });
    return { error: error as Error | null };
}

// Verify OTP code
export async function verifyOTP(phone: string, token: string): Promise<{ user: User | null; error: Error | null }> {
    const supabase = getSupabaseClient();
    if (!supabase) {
        return { user: null, error: new Error('Auth not configured') };
    }
    const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: 'sms',
    });
    return { user: data?.user || null, error: error as Error | null };
}

// Sign out
export async function signOut(): Promise<{ error: Error | null }> {
    const supabase = getSupabaseClient();
    if (!supabase) {
        return { error: new Error('Auth not configured') };
    }
    const { error } = await supabase.auth.signOut();
    return { error: error as Error | null };
}

// Get current session
export async function getSession() {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    const { data: { session } } = await supabase.auth.getSession();
    return session;
}

// Get current user
export async function getUser(): Promise<User | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

// Subscribe to auth state changes
export function onAuthStateChange(callback: (user: User | null) => void): Subscription | null {
    const supabase = getSupabaseClient();
    if (!supabase) {
        // Return a dummy subscription that does nothing
        return null;
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        callback(session?.user || null);
    });
    return subscription;
}
