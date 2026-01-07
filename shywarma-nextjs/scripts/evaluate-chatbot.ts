/**
 * Chatbot Evaluation Script
 * 
 * Usage: npx tsx scripts/evaluate-chatbot.ts
 * 
 * Evaluates the chatbot against a set of test prompts and scores responses.
 */

import testPrompts from './test-prompts.json';

const API_URL = 'http://localhost:3000/api/chat';

interface TestPrompt {
    id: string;
    prompt: string;
    expectedKeywords: string[];
    minKeywords: number;
    mustNotContain?: string[];
    expectsItinerary?: boolean;
    expectedDays?: number;
    category: string;
}

interface TestResult {
    id: string;
    prompt: string;
    category: string;
    passed: boolean;
    score: number;
    maxScore: number;
    details: string[];
    responseTime: number;
}

async function callChatAPI(prompt: string): Promise<{ response: string; time: number }> {
    const start = Date.now();

    const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            messages: [{ role: 'user', content: prompt }]
        })
    });

    if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
    }

    const response = await res.text();
    const time = Date.now() - start;

    return { response, time };
}

function evaluateResponse(test: TestPrompt, response: string): TestResult {
    const details: string[] = [];
    let score = 0;
    let maxScore = 0;

    // Check expected keywords
    const foundKeywords: string[] = [];
    for (const keyword of test.expectedKeywords) {
        maxScore++;
        if (response.toLowerCase().includes(keyword.toLowerCase())) {
            foundKeywords.push(keyword);
            score++;
        }
    }

    if (foundKeywords.length >= test.minKeywords) {
        details.push(`✓ Found ${foundKeywords.length}/${test.expectedKeywords.length} keywords: ${foundKeywords.join(', ')}`);
    } else {
        details.push(`✗ Only found ${foundKeywords.length}/${test.minKeywords} required keywords`);
    }

    // Check must NOT contain (hallucination test)
    if (test.mustNotContain) {
        maxScore++;
        const foundBadKeywords = test.mustNotContain.filter(k =>
            response.toLowerCase().includes(k.toLowerCase())
        );
        if (foundBadKeywords.length === 0) {
            score++;
            details.push('✓ No hallucinated content found');
        } else {
            details.push(`✗ HALLUCINATION: Found "${foundBadKeywords.join(', ')}"`);
        }
    }

    // Check itinerary format
    if (test.expectsItinerary) {
        maxScore++;
        const itineraryMatch = response.match(/<ITINERARY_DATA>([\s\S]*?)<\/ITINERARY_DATA>/);
        if (itineraryMatch) {
            try {
                const json = JSON.parse(itineraryMatch[1].replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' '));
                if (json.title && json.days && Array.isArray(json.days)) {
                    score++;
                    details.push(`✓ Valid itinerary JSON with ${json.days.length} days`);

                    // Check expected days count
                    if (test.expectedDays) {
                        maxScore++;
                        if (json.days.length >= test.expectedDays) {
                            score++;
                            details.push(`✓ Has ${json.days.length}/${test.expectedDays} expected days`);
                        } else {
                            details.push(`✗ Only ${json.days.length}/${test.expectedDays} days (truncated?)`);
                        }
                    }
                } else {
                    details.push('✗ Itinerary JSON missing title or days');
                }
            } catch (e) {
                details.push('✗ Invalid itinerary JSON format');
            }
        } else {
            details.push('✗ No ITINERARY_DATA tags found');
        }
    }

    // Check SUGGESTED_QUESTION format
    maxScore++;
    if (response.includes('SUGGESTED_QUESTION:')) {
        score++;
        details.push('✓ Includes SUGGESTED_QUESTION');
    } else {
        details.push('✗ Missing SUGGESTED_QUESTION');
    }

    const passed = score >= (maxScore * 0.6); // 60% threshold

    return {
        id: test.id,
        prompt: test.prompt,
        category: test.category,
        passed,
        score,
        maxScore,
        details,
        responseTime: 0 // Will be set later
    };
}

async function runEvaluation() {
    console.log('🧪 Chatbot Evaluation Script\n');
    console.log('='.repeat(60));
    console.log(`Testing ${testPrompts.length} prompts against ${API_URL}\n`);

    const results: TestResult[] = [];
    let totalScore = 0;
    let totalMaxScore = 0;

    for (const test of testPrompts as TestPrompt[]) {
        process.stdout.write(`Testing: ${test.id}... `);

        try {
            const { response, time } = await callChatAPI(test.prompt);
            const result = evaluateResponse(test, response);
            result.responseTime = time;
            results.push(result);

            totalScore += result.score;
            totalMaxScore += result.maxScore;

            console.log(result.passed ? '✓ PASS' : '✗ FAIL', `(${time}ms)`);
        } catch (error) {
            console.log('✗ ERROR:', (error as Error).message);
            results.push({
                id: test.id,
                prompt: test.prompt,
                category: test.category,
                passed: false,
                score: 0,
                maxScore: test.expectedKeywords.length + 1,
                details: [`✗ API Error: ${(error as Error).message}`],
                responseTime: 0
            });
        }

        // Small delay between requests to avoid rate limits
        await new Promise(r => setTimeout(r, 1000));
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 EVALUATION RESULTS\n');

    const passedCount = results.filter(r => r.passed).length;
    const avgTime = results.reduce((a, r) => a + r.responseTime, 0) / results.length;

    console.log(`Overall Score: ${totalScore}/${totalMaxScore} (${Math.round(totalScore / totalMaxScore * 100)}%)`);
    console.log(`Tests Passed: ${passedCount}/${results.length}`);
    console.log(`Avg Response Time: ${Math.round(avgTime)}ms\n`);

    // Category breakdown
    const categories = [...new Set(results.map(r => r.category))];
    console.log('By Category:');
    for (const cat of categories) {
        const catResults = results.filter(r => r.category === cat);
        const catPassed = catResults.filter(r => r.passed).length;
        console.log(`  ${cat}: ${catPassed}/${catResults.length} passed`);
    }

    // Detailed failures
    const failures = results.filter(r => !r.passed);
    if (failures.length > 0) {
        console.log('\n❌ Failed Tests:\n');
        for (const fail of failures) {
            console.log(`[${fail.id}] ${fail.prompt}`);
            for (const detail of fail.details) {
                console.log(`  ${detail}`);
            }
            console.log('');
        }
    }

    // Exit code for CI/CD
    process.exit(passedCount === results.length ? 0 : 1);
}

runEvaluation().catch(console.error);
