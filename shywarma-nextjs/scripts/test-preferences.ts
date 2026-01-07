/**
 * Unit Tests for User Preferences
 * 
 * Usage: npx tsx scripts/test-preferences.ts
 */

import {
    loadPreferences,
    savePreferences,
    updateFromQuery,
    generatePreferenceContext,
    clearPreferences,
    UserPreferences
} from '../src/lib/userPreferences';

// Mock localStorage for Node.js environment
const mockStorage: Record<string, string> = {};
(global as any).localStorage = {
    getItem: (key: string) => mockStorage[key] || null,
    setItem: (key: string, value: string) => { mockStorage[key] = value; },
    removeItem: (key: string) => { delete mockStorage[key]; },
    clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
};

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
    try {
        fn();
        console.log(`✓ ${name}`);
        passed++;
    } catch (error) {
        console.log(`✗ ${name}`);
        console.log(`  Error: ${(error as Error).message}`);
        failed++;
    }
}

function assert(condition: boolean, message: string) {
    if (!condition) throw new Error(message);
}

console.log('🧪 User Preferences Unit Tests\n');
console.log('='.repeat(50));

// Clear before tests
clearPreferences();

// Test 1: Load default preferences
test('loadPreferences returns defaults when empty', () => {
    const prefs = loadPreferences();
    assert(prefs.interestedDestinations.length === 0, 'Should have empty destinations');
    assert(prefs.travelStyles.length === 0, 'Should have empty travel styles');
    assert(prefs.recentSearches.length === 0, 'Should have empty searches');
});

// Test 2: Update from destination query
test('updateFromQuery detects destination mentions', () => {
    const prefs = loadPreferences();
    const updated = updateFromQuery('I want to visit Maldives', prefs);
    assert(updated.interestedDestinations.includes('maldives'), 'Should detect Maldives');
});

// Test 3: Update from budget query
test('updateFromQuery detects budget preferences', () => {
    const prefs = loadPreferences();
    const updated = updateFromQuery('I want a luxury experience', prefs);
    assert(updated.budgetRange === 'luxury', 'Should detect luxury budget');
});

// Test 4: Update from travel style query
test('updateFromQuery detects travel styles', () => {
    const prefs = loadPreferences();
    const updated = updateFromQuery('Planning a honeymoon trip', prefs);
    assert(updated.travelStyles.includes('romantic'), 'Should detect romantic style');
});

// Test 5: Recent searches are tracked
test('updateFromQuery adds to recent searches', () => {
    const prefs = loadPreferences();
    const updated = updateFromQuery('Best hotels in Dubai for families', prefs);
    assert(updated.recentSearches.includes('Best hotels in Dubai for families'), 'Should add to searches');
});

// Test 6: Multiple destinations
test('updateFromQuery tracks multiple destinations', () => {
    let prefs = loadPreferences();
    prefs = updateFromQuery('Tell me about Maldives', prefs);
    prefs = updateFromQuery('What about Dubai?', prefs);
    prefs = updateFromQuery('Paris looks nice too', prefs);
    assert(prefs.interestedDestinations.length === 3, 'Should have 3 destinations');
});

// Test 7: Save and load cycle
test('savePreferences persists data', () => {
    const prefs: UserPreferences = {
        interestedDestinations: ['bali', 'santorini'],
        budgetRange: 'mid-range',
        travelStyles: ['adventure'],
        recentSearches: ['test query'],
        roomPreferences: ['ocean view'],
        lastActive: Date.now()
    };
    savePreferences(prefs);
    const loaded = loadPreferences();
    assert(loaded.interestedDestinations.includes('bali'), 'Should persist destinations');
    assert(loaded.budgetRange === 'mid-range', 'Should persist budget');
});

// Test 8: Generate context string
test('generatePreferenceContext creates AI-readable context', () => {
    const prefs: UserPreferences = {
        interestedDestinations: ['maldives', 'dubai'],
        budgetRange: 'luxury',
        travelStyles: ['romantic'],
        recentSearches: [],
        roomPreferences: ['overwater villa'],
        lastActive: Date.now()
    };
    const context = generatePreferenceContext(prefs);
    assert(context !== null, 'Should generate context');
    assert(context!.includes('maldives'), 'Context should include destinations');
    assert(context!.includes('luxury'), 'Context should include budget');
});

// Test 9: Empty preferences return null context
test('generatePreferenceContext returns null for empty prefs', () => {
    clearPreferences();
    const prefs = loadPreferences();
    const context = generatePreferenceContext(prefs);
    assert(context === null, 'Should return null for empty preferences');
});

// Test 10: Room preferences detection
test('updateFromQuery detects room preferences', () => {
    const prefs = loadPreferences();
    const updated = updateFromQuery('I want an overwater villa', prefs);
    assert(updated.roomPreferences.includes('overwater villa'), 'Should detect overwater villa');
});

// Summary
console.log('\n' + '='.repeat(50));
console.log(`📊 Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
