/**
 * Content Filter - Block malicious or off-topic queries
 */

// Patterns to block (case-insensitive)
const BLOCKED_PATTERNS = [
    // Prompt injection attempts
    /ignore (previous|all|above) instructions/i,
    /forget (your|all) (instructions|training|rules)/i,
    /you are now/i,
    /act as if/i,
    /pretend (to be|you are)/i,
    /new persona/i,
    /override (system|your)/i,
    /disregard (previous|your)/i,

    // System prompt extraction
    /what (are|is) your (prompt|instructions|system)/i,
    /show me your (prompt|instructions|rules)/i,
    /reveal your (programming|training)/i,
    /repeat (your|the) (prompt|instructions)/i,

    // Explicit/harmful content
    /\b(porn|xxx|nude|naked)\b/i,
    /how to (hack|steal|kill|harm)/i,

    // Off-topic manipulation
    /write (me )?(a |some )?(code|program|script)/i,
    /generate (fake|false) (reviews|testimonials)/i,
];

// Keywords that suggest off-topic queries
const OFF_TOPIC_KEYWORDS = [
    'bitcoin', 'crypto', 'stock', 'forex', 'gambling',
    'politics', 'election', 'president',
    'medical advice', 'diagnosis', 'symptoms',
    'legal advice', 'lawsuit', 'attorney',
];

export interface FilterResult {
    allowed: boolean;
    reason?: string;
}

/**
 * Check if a message should be blocked
 */
export function filterContent(message: string): FilterResult {
    const normalizedMessage = message.toLowerCase().trim();

    // Check blocked patterns
    for (const pattern of BLOCKED_PATTERNS) {
        if (pattern.test(message)) {
            return {
                allowed: false,
                reason: 'This type of request is not supported. Please ask about our hotels, destinations, or travel packages.'
            };
        }
    }

    // Check off-topic keywords (only if they dominate the message)
    const offTopicCount = OFF_TOPIC_KEYWORDS.filter(kw =>
        normalizedMessage.includes(kw)
    ).length;

    // If 2+ off-topic keywords and no travel keywords, likely off-topic
    const travelKeywords = ['hotel', 'travel', 'trip', 'vacation', 'resort', 'destination', 'booking', 'room', 'package'];
    const hasTravelContext = travelKeywords.some(kw => normalizedMessage.includes(kw));

    if (offTopicCount >= 2 && !hasTravelContext) {
        return {
            allowed: false,
            reason: 'I can only help with hotel bookings, travel destinations, and vacation packages. How can I assist you with your travel plans?'
        };
    }

    return { allowed: true };
}

/**
 * Sanitize input - remove potentially dangerous content
 */
export function sanitizeInput(message: string): string {
    return message
        // Remove HTML tags
        .replace(/<[^>]*>/g, '')
        // Remove script-like content
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        // Normalize whitespace
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Validate message length
 */
export function validateMessageLength(message: string, maxLength: number = 500): FilterResult {
    if (!message || message.trim().length === 0) {
        return { allowed: false, reason: 'Message cannot be empty' };
    }

    if (message.length > maxLength) {
        return {
            allowed: false,
            reason: `Message is too long. Please keep it under ${maxLength} characters.`
        };
    }

    return { allowed: true };
}
