/**
 * User Preferences - Track and persist user travel preferences
 * Stored in localStorage for returning users
 */

const STORAGE_KEY = 'shywarma_user_preferences';

export interface UserPreferences {
    // Destinations they've shown interest in
    interestedDestinations: string[];

    // Budget indicators (from searches)
    budgetRange?: 'budget' | 'mid-range' | 'luxury' | 'ultra-luxury';

    // Travel style preferences
    travelStyles: string[]; // e.g., 'romantic', 'adventure', 'family', 'business'

    // Recent searches (last 10)
    recentSearches: string[];

    // Preferred room types mentioned
    roomPreferences: string[];

    // Last active timestamp
    lastActive: number;
}

const DEFAULT_PREFERENCES: UserPreferences = {
    interestedDestinations: [],
    budgetRange: undefined,
    travelStyles: [],
    recentSearches: [],
    roomPreferences: [],
    lastActive: Date.now()
};

/**
 * Load user preferences from localStorage
 */
export function loadPreferences(): UserPreferences {
    if (typeof window === 'undefined') return DEFAULT_PREFERENCES;

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
        }
    } catch (e) {
        console.error('Error loading preferences:', e);
    }
    return DEFAULT_PREFERENCES;
}

/**
 * Save user preferences to localStorage
 */
export function savePreferences(prefs: UserPreferences): void {
    if (typeof window === 'undefined') return;

    try {
        prefs.lastActive = Date.now();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch (e) {
        console.error('Error saving preferences:', e);
    }
}

/**
 * Update preferences based on a user query
 */
export function updateFromQuery(query: string, currentPrefs: UserPreferences): UserPreferences {
    const lowerQuery = query.toLowerCase();
    const updated = { ...currentPrefs };

    // Detect destination mentions
    const destinations = ['maldives', 'santorini', 'dubai', 'bali', 'paris'];
    destinations.forEach(dest => {
        if (lowerQuery.includes(dest) && !updated.interestedDestinations.includes(dest)) {
            updated.interestedDestinations = [...updated.interestedDestinations, dest].slice(-5);
        }
    });

    // Detect budget indicators
    if (lowerQuery.includes('budget') || lowerQuery.includes('cheap') || lowerQuery.includes('affordable')) {
        updated.budgetRange = 'budget';
    } else if (lowerQuery.includes('luxury') || lowerQuery.includes('premium') || lowerQuery.includes('five star')) {
        updated.budgetRange = 'luxury';
    } else if (lowerQuery.includes('ultra') || lowerQuery.includes('exclusive')) {
        updated.budgetRange = 'ultra-luxury';
    }

    // Detect travel styles
    const styles: Record<string, string[]> = {
        'romantic': ['honeymoon', 'romantic', 'couples', 'anniversary'],
        'family': ['family', 'kids', 'children', 'family-friendly'],
        'adventure': ['adventure', 'diving', 'snorkeling', 'trekking', 'safari'],
        'business': ['business', 'conference', 'corporate', 'meeting'],
        'wellness': ['spa', 'wellness', 'yoga', 'meditation', 'retreat']
    };

    Object.entries(styles).forEach(([style, keywords]) => {
        if (keywords.some(kw => lowerQuery.includes(kw)) && !updated.travelStyles.includes(style)) {
            updated.travelStyles = [...updated.travelStyles, style].slice(-3);
        }
    });

    // Detect room preferences
    const roomTypes = ['overwater villa', 'suite', 'penthouse', 'beach villa', 'ocean view', 'pool villa'];
    roomTypes.forEach(room => {
        if (lowerQuery.includes(room) && !updated.roomPreferences.includes(room)) {
            updated.roomPreferences = [...updated.roomPreferences, room].slice(-3);
        }
    });

    // Add to recent searches (unique, last 10)
    if (query.length > 5) {
        updated.recentSearches = [
            query,
            ...updated.recentSearches.filter(s => s !== query)
        ].slice(0, 10);
    }

    return updated;
}

/**
 * Generate a context string from preferences for the AI
 */
export function generatePreferenceContext(prefs: UserPreferences): string | null {
    const parts: string[] = [];

    if (prefs.interestedDestinations.length > 0) {
        parts.push(`User has shown interest in: ${prefs.interestedDestinations.join(', ')}`);
    }

    if (prefs.budgetRange) {
        parts.push(`Preferred budget: ${prefs.budgetRange}`);
    }

    if (prefs.travelStyles.length > 0) {
        parts.push(`Travel style preferences: ${prefs.travelStyles.join(', ')}`);
    }

    if (prefs.roomPreferences.length > 0) {
        parts.push(`Room preferences: ${prefs.roomPreferences.join(', ')}`);
    }

    if (parts.length === 0) return null;

    return `USER PREFERENCES (use to personalize recommendations):\n${parts.join('\n')}`;
}

/**
 * Clear all preferences
 */
export function clearPreferences(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
}
