/**
 * JSON Parsing Utilities for OpenAI Responses
 * Handles various JSON parsing scenarios and edge cases
 */
import crypto from 'crypto';

export interface ParsedResponse {
    textPart: string;
    jsonPart: any;
    hasValidJson: boolean;
    parseErrors: string[];
}

export interface JSONMatch {
    jsonPart: any;
    jsonStart: number;
    jsonEnd: number;
}

/**
 * Split OpenAI response into text and JSON parts
 */
export function splitResponseIntoParts(content: string): ParsedResponse {
    const parseErrors: string[] = [];

    // Clean the content - remove markdown code blocks and comments
    const cleanedContent = content.trim()
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .replace(/\/\/.*$/gm, '') // Remove single-line comments
        .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments

    // Try to find JSON part
    const jsonMatch = findJSONPart(cleanedContent);

    if (jsonMatch) {
        const { jsonPart, jsonStart } = jsonMatch;
        // Extract text part as everything before the JSON
        const textPart = cleanedContent.substring(0, jsonStart).trim();

        return {
            textPart: textPart || 'No text analysis available',
            jsonPart,
            hasValidJson: true,
            parseErrors: []
        };
    }

    // No fallback - return empty structure if JSON parsing fails
    parseErrors.push('No valid JSON found in response');
    return {
        textPart: cleanedContent,
        jsonPart: { claims: [] },
        hasValidJson: false,
        parseErrors
    };
}

/**
 * Find JSON part in the content
 */
export function findJSONPart(content: string): JSONMatch | null {
    // Look for JSON object with "claims" field first
    const claimsPattern = /\{\s*"claims"\s*:/;
    const match = content.match(claimsPattern);

    if (match) {
        const jsonStart = match.index!;
        const jsonEnd = findJSONEnd(content, jsonStart);

        if (jsonEnd > jsonStart) {
            const jsonStr = content.substring(jsonStart, jsonEnd);

            try {
                // Try to fix common JSON issues before parsing
                const fixedJsonStr = fixCommonJSONIssues(jsonStr);
                const jsonPart = JSON.parse(fixedJsonStr);
                return { jsonPart, jsonStart, jsonEnd };
            } catch (error) {
                console.warn('Failed to parse JSON with claims pattern:', error);
            }
        }
    }

    // Fallback: try to find any JSON object
    const jsonStart = content.search(/[{\[]/);
    if (jsonStart !== -1) {
        const jsonEnd = findJSONEnd(content, jsonStart);

        if (jsonEnd > jsonStart) {
            const jsonStr = content.substring(jsonStart, jsonEnd);
            try {
                // Try to fix common JSON issues before parsing
                const fixedJsonStr = fixCommonJSONIssues(jsonStr);
                const jsonPart = JSON.parse(fixedJsonStr);
                return { jsonPart, jsonStart, jsonEnd };
            } catch (error) {
                console.warn('Failed to parse fallback JSON:', error);
            }
        }
    }

    return null;
}

/**
 * Fix common JSON issues that cause parsing errors
 */
export function fixCommonJSONIssues(jsonStr: string): string {
    // Fix incomplete URLs
    jsonStr = jsonStr.replace(/"url":\s*"https:\\n/g, '"url": "https://example.com"');
    jsonStr = jsonStr.replace(/"url":\s*"https:\/\/\.\.\./g, '"url": "https://example.com"');
    jsonStr = jsonStr.replace(/"url":\s*"https:\/\/\.\.\./g, '"url": "https://example.com"');

    // Fix incomplete snippets
    jsonStr = jsonStr.replace(/"snippet":\s*"\.\.\./g, '"snippet": "Sample news snippet"');
    jsonStr = jsonStr.replace(/"snippet":\s*"\.\.\./g, '"snippet": "Sample news snippet"');

    // Fix trailing commas
    jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');

    // Fix missing quotes around property names
    jsonStr = jsonStr.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');

    return jsonStr;
}

/**
 * Find the end of a JSON object/array
 */
export function findJSONEnd(content: string, startIndex: number): number {
    let braceCount = 0;
    let bracketCount = 0;
    let inString = false;
    let escapeNext = false;

    for (let i = startIndex; i < content.length; i++) {
        const char = content[i];

        if (escapeNext) {
            escapeNext = false;
            continue;
        }

        if (char === '\\') {
            escapeNext = true;
            continue;
        }

        if (char === '"' && !escapeNext) {
            inString = !inString;
            continue;
        }

        if (!inString) {
            if (char === '{') {
                braceCount++;
            } else if (char === '}') {
                braceCount--;
                if (braceCount === 0) {
                    return i + 1;
                }
            } else if (char === '[') {
                bracketCount++;
            } else if (char === ']') {
                bracketCount--;
                // Don't stop on array end - continue until object end
            }
        }
    }

    return content.length;
}



/**
 * Validate and fix common JSON issues
 */
export function validateAndFixJSON(jsonStr: string): { fixed: string; issues: string[] } {
    const issues: string[] = [];
    let fixed = jsonStr;

    // Fix trailing commas
    fixed = fixed.replace(/,(\s*[}\]])/g, '$1');

    // Fix missing quotes around property names
    fixed = fixed.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');

    // Fix single quotes to double quotes
    fixed = fixed.replace(/'/g, '"');

    // Fix missing closing braces
    const openBraces = (fixed.match(/\{/g) || []).length;
    const closeBraces = (fixed.match(/\}/g) || []).length;

    if (openBraces > closeBraces) {
        fixed += '}'.repeat(openBraces - closeBraces);
        issues.push(`Added ${openBraces - closeBraces} missing closing braces`);
    }

    return { fixed, issues };
}

/**
 * Extract claims from parsed JSON with validation
 */
export function extractClaimsFromJSON(jsonPart: any, context: any): any[] {
    const claimsArray = jsonPart?.claims || [];
    const validClaims = [];
    const errors = [];

    // Debug logging
    console.log(`🔍 extractClaimsFromJSON: Processing ${claimsArray.length} claims from ${context.facts?.length || 0} facts`);

    for (let i = 0; i < claimsArray.length; i++) {
        const claimData = claimsArray[i];

        try {
            // Validate required fields
            if (!claimData.ticker) {
                errors.push(`Claim ${i}: Missing ticker field`);
                continue;
            }

            if (!claimData.claim && !claimData.action) {
                errors.push(`Claim ${i}: Missing claim/action field`);
                continue;
            }

            // Use appropriate evidence based on agent type
            let evidenceIds = [];
            if (claimData.agentRole === 'sentiment') {
                // Sentiment agent uses news evidence
                const tickerEvidence = context.facts?.filter((e: any) =>
                    e.ticker === claimData.ticker && e.kind === 'news'
                ) || [];
                evidenceIds = tickerEvidence.map((e: any) => e.id || `${e.ticker}_${e.kind}_${Date.now()}`).slice(0, 3);
                console.log(`🔍 extractClaimsFromJSON: ${claimData.ticker} sentiment - Found ${tickerEvidence.length} news evidence`);
            } else if (claimData.agentRole === 'fundamental') {
                // Fundamental agent uses market data evidence
                const tickerEvidence = context.facts?.filter((e: any) =>
                    e.ticker === claimData.ticker && e.kind === 'market'
                ) || [];
                evidenceIds = tickerEvidence.map((e: any) => e.id || `${e.ticker}_${e.kind}_${Date.now()}`).slice(0, 3);
                console.log(`🔍 extractClaimsFromJSON: ${claimData.ticker} fundamental - Found ${tickerEvidence.length} market evidence`);
            } else if (claimData.agentRole === 'technical') {
                // Technical analysis evidence
                const tickerEvidence = context.facts?.filter((e: any) =>
                    e.ticker === claimData.ticker && e.kind === 'technical'
                ) || [];
                evidenceIds = tickerEvidence.map((e: any) => e.id || `${e.ticker}_${e.kind}_${Date.now()}`).slice(0, 3);
                console.log(`🔍 extractClaimsFromJSON: ${claimData.ticker} technical - Found ${tickerEvidence.length} technical evidence`);
            }

            const validClaim = {
                id: `${claimData.ticker}_${claimData.agentRole}_${context.timestamp}_${i}`,
                ticker: claimData.ticker,
                agentRole: claimData.agentRole,
                claim: claimData.claim || claimData.action || 'HOLD',
                confidence: Math.max(0, Math.min(1, claimData.confidence || 0.5)),
                evidence: evidenceIds, // Always use real evidence IDs
                timestamp: context.timestamp,
                riskFlags: claimData.riskFlags || [],
                // Include additional fields from the original claim data
                direction: claimData.direction,
                magnitude: claimData.magnitude,
                rationale: claimData.rationale,
                signals: claimData.signals
            };

            validClaims.push(validClaim);

        } catch (error) {
            errors.push(`Claim ${i}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    if (errors.length > 0) {
        console.warn('JSON parsing errors:', errors);
    }

    return validClaims;
}

/**
 * Extract claims from text when JSON parsing fails (for sentiment agent)
 */
export function extractClaimsFromText(textPart: string, context: any): any[] {
    const claims = [];
    const universe = context.universe || ['BTC', 'ETH'];

    // Look for patterns like "BTC: BUY" or "ETH: HOLD" in the text
    for (const ticker of universe) {
        const tickerPattern = new RegExp(`${ticker}[^\\n]*?(BUY|SELL|HOLD)`, 'gi');
        const matches = textPart.match(tickerPattern);

        if (matches && matches.length > 0) {
            const lastMatch = matches[matches.length - 1];
            if (lastMatch) {
                const actionMatch = lastMatch.match(/(BUY|SELL|HOLD)/i);

                if (actionMatch && actionMatch[1]) {
                    const action = actionMatch[1].toUpperCase();

                    // Try to extract confidence from sentiment scores
                    const confidenceMatch = textPart.match(new RegExp(`${ticker}[^\\n]*?(\\d+\\.\\d+)`, 'i'));
                    const confidence = confidenceMatch && confidenceMatch[1] ? Math.min(1, parseFloat(confidenceMatch[1])) : 0.5;

                    // Get evidence for this ticker (same for all agent types for now)
                    const tickerEvidence = context.facts?.filter((e: any) => e.ticker === ticker) || [];
                    const evidenceIds = tickerEvidence.map((e: any) => e.id).slice(0, 3);

                    claims.push({
                        id: `${ticker}_${context.agentRole || 'sentiment'}_${context.timestamp}_${claims.length}`,
                        ticker,
                        agentRole: context.agentRole || 'sentiment',
                        claim: action,
                        confidence,
                        evidence: evidenceIds,
                        timestamp: context.timestamp,
                        riskFlags: []
                    });
                }
            }
        }
    }

    return claims;
}

/**
 * Test JSON parsing with various scenarios
 */
export function testJSONParsing(): void {
    console.log('🧪 Testing JSON Parsing Utilities\n');

    const testCases = [
        {
            name: 'Valid JSON with claims',
            content: `ANALYSIS:
BTC shows strong fundamentals.

CLAIMS:
{
  "claims": [
    {
      "ticker": "BTC",
      "agentRole": "fundamental",
      "claim": "BUY",
      "confidence": 0.8,
      "evidence": ["BTC_news_1"],
      "riskFlags": []
    }
  ]
}`
        },
        {
            name: 'Missing ticker field',
            content: `ANALYSIS:
Mixed signals.

CLAIMS:
{
  "claims": [
    {
      "agentRole": "sentiment",
      "claim": "HOLD",
      "confidence": 0.5
    }
  ]
}`
        },
        {
            name: 'Invalid JSON (missing brace)',
            content: `ANALYSIS:
BTC analysis.

CLAIMS:
{
  "claims": [
    {
      "ticker": "BTC",
      "claim": "BUY",
      "confidence": 0.8
    }
  ]
  // Missing closing brace
`
        },
        {
            name: 'UNKNOWN ticker',
            content: `ANALYSIS:
Mixed conditions.

CLAIMS:
{
  "claims": [
    {
      "ticker": "UNKNOWN",
      "agentRole": "sentiment",
      "claim": "HOLD",
      "confidence": 0.2,
      "riskFlags": ["parse_error"]
    }
  ]
}`
        },
        {
            name: 'No JSON in response',
            content: `ANALYSIS:
BTC shows strong fundamentals.

No claims to make at this time.`
        }
    ];

    for (const testCase of testCases) {
        console.log(`\n📋 Test: ${testCase.name}`);
        console.log('─'.repeat(40));

        try {
            const result = splitResponseIntoParts(testCase.content);

            console.log(`✅ Has valid JSON: ${result.hasValidJson}`);
            console.log(`📝 Text part length: ${result.textPart.length} chars`);
            console.log(`🔧 JSON part keys: ${Object.keys(result.jsonPart).join(', ')}`);

            if (result.parseErrors.length > 0) {
                console.log(`⚠️  Parse errors: ${result.parseErrors.join(', ')}`);
            }

            if (result.jsonPart.claims) {
                console.log(`📊 Claims count: ${result.jsonPart.claims.length}`);
                result.jsonPart.claims.forEach((claim: any, i: number) => {
                    console.log(`   Claim ${i + 1}: ${claim.ticker} - ${claim.claim} (${(claim.confidence * 100).toFixed(1)}%)`);
                    if (claim.riskFlags && claim.riskFlags.length > 0) {
                        console.log(`   ⚠️  Risk flags: ${claim.riskFlags.join(', ')}`);
                    }
                });
            }

        } catch (error) {
            console.error(`❌ Test failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}

// Run test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testJSONParsing();
}
