/**
 * JSON Parsing Utilities for OpenAI Responses
 * Handles incomplete JSON responses from AI models
 */
export interface ParsedResponse {
    textPart: string;
    jsonPart: any;
    hasValidJson: boolean;
    parseErrors: string[];
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
        const textPart = cleanedContent.substring(0, jsonStart).trim();

        return {
            textPart: textPart || 'No text analysis available',
            jsonPart,
            hasValidJson: true,
            parseErrors: []
        };
    }

    // No JSON found
    parseErrors.push('No valid JSON found in response');
    return {
        textPart: cleanedContent,
        jsonPart: { claims: [] },
        hasValidJson: false,
        parseErrors
    };
}

/**
 * Find and parse JSON part in the content
 */
function findJSONPart(content: string): { jsonPart: any; jsonStart: number } | null {
    // Look for JSON object with "claims" field
    const claimsPattern = /\{\s*"claims"\s*:/;
    const match = content.match(claimsPattern);

    if (match) {
        const jsonStart = match.index!;
        const jsonEnd = findJSONEnd(content, jsonStart);

        if (jsonEnd > jsonStart) {
            const jsonStr = content.substring(jsonStart, jsonEnd);

            try {
                const jsonPart = JSON.parse(jsonStr);
                return { jsonPart, jsonStart };
            } catch (error) {
                // Try to fix common issues
                const fixedJson = fixIncompleteJSON(jsonStr);
                try {
                    const jsonPart = JSON.parse(fixedJson);
                    return { jsonPart, jsonStart };
                } catch (error2) {
                    console.warn('Failed to parse JSON even after fixing:', error2);
                }
            }
        }
    }

    return null;
}

/**
 * Fix incomplete JSON by adding missing closing braces/brackets
 */
function fixIncompleteJSON(jsonStr: string): string {
    // Fix incomplete URLs
    jsonStr = jsonStr.replace(/\"url\":\s*\"https:\n/g, '"url": "https://example.com"');
    jsonStr = jsonStr.replace(/\"url\":\s*\"https:\/\/[^\"]*$/g, '"url": "https://example.com"');
    jsonStr = jsonStr.replace(/\"url\":\s*\"[^\"]*$/g, '"url": "https://example.com"');

    // Remove trailing commas
    jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');

    // Count braces and brackets
    let openBraces = (jsonStr.match(/\{/g) || []).length;
    let closeBraces = (jsonStr.match(/\}/g) || []).length;
    let openBrackets = (jsonStr.match(/\[/g) || []).length;
    let closeBrackets = (jsonStr.match(/\]/g) || []).length;

    // Add missing closing braces/brackets
    while (openBraces > closeBraces) {
        jsonStr += '}';
        closeBraces++;
    }
    while (openBrackets > closeBrackets) {
        jsonStr += ']';
        closeBrackets++;
    }

    return jsonStr;
}

/**
 * Find the end of a JSON object/array
 */
function findJSONEnd(content: string, startIndex: number): number {
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
            }
        }
    }

    return content.length;
}

/**
 * Extract claims from parsed JSON
 */
export function extractClaimsFromJSON(jsonPart: any, context: any): any[] {
    console.log('🔍 extractClaimsFromJSON: Starting claim extraction', {
        hasJsonPart: !!jsonPart,
        hasClaims: !!jsonPart?.claims,
        claimsCount: jsonPart?.claims?.length || 0,
        contextKeys: Object.keys(context || {}),
        hasFacts: !!context.facts,
        factsCount: context.facts?.length || 0
    });

    const claimsArray = jsonPart?.claims || [];
    const validClaims = [];

    for (let i = 0; i < claimsArray.length; i++) {
        const claimData = claimsArray[i];
        console.log(`🔍 Processing claim ${i + 1}/${claimsArray.length}:`, {
            ticker: claimData.ticker,
            hasClaim: !!claimData.claim,
            hasAction: !!claimData.action,
            confidence: claimData.confidence,
            agentRole: claimData.agentRole
        });

        // Validate required fields
        if (!claimData.ticker) {
            console.warn(`Claim ${i}: Missing ticker field`);
            continue;
        }

        if (!claimData.claim && !claimData.action) {
            console.warn(`Claim ${i}: Missing claim/action field`);
            continue;
        }

        // Get evidence for this ticker
        const tickerEvidence = context.facts?.filter((e: any) => e && e.ticker === claimData.ticker) || [];
        console.log(`🔍 Found ${tickerEvidence.length} evidence items for ticker ${claimData.ticker}:`, {
            evidenceIds: tickerEvidence.map((e: any) => e?.id).filter(Boolean),
            evidenceKinds: tickerEvidence.map((e: any) => e?.kind).filter(Boolean),
            evidenceSources: tickerEvidence.map((e: any) => e?.source).filter(Boolean)
        });

        const evidenceIds = tickerEvidence
            .filter((e: any) => e && e.id) // Filter out null/undefined evidence
            .map((e: any) => e.id)
            .slice(0, 3);

        // If no evidence found, create a fallback evidence ID
        if (evidenceIds.length === 0) {
            const fallbackId = `${claimData.ticker}_market_data_${context.timestamp}`;
            evidenceIds.push(fallbackId);
            console.log(`⚠️ No evidence found for ${claimData.ticker}, created fallback: ${fallbackId}`);
        }

        console.log(`🔍 Final evidence IDs for claim ${i}:`, evidenceIds);

        const validClaim = {
            id: `${claimData.ticker}_${claimData.agentRole || 'unknown'}_${context.timestamp}_${i}`,
            ticker: claimData.ticker,
            agentRole: claimData.agentRole || 'unknown',
            claim: claimData.claim || claimData.action || 'HOLD',
            confidence: Math.max(0, Math.min(1, claimData.confidence || 0.5)),
            evidence: evidenceIds,
            timestamp: context.timestamp,
            riskFlags: claimData.riskFlags || [],
            direction: claimData.direction,
            magnitude: claimData.magnitude,
            rationale: claimData.rationale,
            signals: claimData.signals
        };

        console.log(`✅ Created valid claim ${i + 1}:`, {
            claimId: validClaim.id,
            ticker: validClaim.ticker,
            claim: validClaim.claim,
            confidence: validClaim.confidence,
            evidenceCount: validClaim.evidence.length,
            evidenceIds: validClaim.evidence,
            hasDirection: !!validClaim.direction,
            hasMagnitude: !!validClaim.magnitude,
            hasRationale: !!validClaim.rationale,
            signalsCount: validClaim.signals?.length || 0
        });

        validClaims.push(validClaim);
    }

    console.log('✅ extractClaimsFromJSON: Completed claim extraction', {
        totalClaims: validClaims.length,
        claimsSummary: validClaims.map(c => ({
            ticker: c.ticker,
            claim: c.claim,
            confidence: c.confidence,
            evidenceCount: c.evidence.length
        }))
    });

    return validClaims;
}

/**
 * Extract claims from text when JSON parsing fails
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
                    const tickerEvidence = context.facts?.filter((e: any) => e && e.ticker === ticker) || [];
                    const evidenceIds = tickerEvidence
                        .filter((e: any) => e && e.id) // Filter out null/undefined evidence
                        .map((e: any) => e.id)
                        .slice(0, 3);

                    // If no evidence found, create a fallback evidence ID
                    if (evidenceIds.length === 0) {
                        evidenceIds.push(`${ticker}_market_data_${context.timestamp}`);
                    }

                    claims.push({
                        id: `${ticker}_${context.agentRole || 'unknown'}_${context.timestamp}_${claims.length}`,
                        ticker,
                        agentRole: context.agentRole || 'unknown',
                        claim: action,
                        confidence: 0.5,
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
