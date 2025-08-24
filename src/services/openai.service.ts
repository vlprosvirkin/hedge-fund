import OpenAI from 'openai';
import crypto from 'crypto';
import type { Claim } from '../types/index.js';

export class OpenAIService {
    private client: OpenAI;
    private model: string = 'gpt-4';

    constructor() {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error('OPENAI_API_KEY environment variable is required');
        }

        this.client = new OpenAI({
            apiKey: apiKey
        });
    }

    async generateClaims(
        systemPrompt: string,
        userPrompt: string,
        context: any
    ): Promise<Claim[]> {
        try {
            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: userPrompt
                    }
                ],
                temperature: 0.3, // Lower temperature for more consistent results
                max_tokens: 2000
            });

            const content = response.choices[0]?.message?.content;
            if (!content) {
                throw new Error('No content received from OpenAI');
            }

            console.log('Raw OpenAI response:', content.substring(0, 200) + '...');

            // Parse the JSON response with improved error handling
            const parsed = this.parseOpenAIResponse(content);

            // Handle both array and object formats
            const claimsArray = Array.isArray(parsed) ? parsed : parsed.claims || [];

            return claimsArray.map((claimData: any) => ({
                id: claimData.id || crypto.randomUUID(),
                ticker: claimData.ticker,
                agentRole: claimData.agentRole,
                claim: claimData.claim || claimData.action || 'HOLD',
                confidence: Math.max(0, Math.min(1, claimData.confidence || 0.5)),
                evidence: claimData.evidence || [],
                timestamp: context.timestamp,
                riskFlags: claimData.riskFlags || []
            }));

        } catch (error) {
            console.error('OpenAI API error:', error);
            throw new Error(`Failed to generate claims: ${error}`);
        }
    }

    private parseOpenAIResponse(content: string): any {
        console.log('Raw OpenAI response:', content.substring(0, 500) + '...');

        // Step 1: Clean the content
        let cleanedContent = this.cleanContent(content);

        // Step 2: Try multiple extraction strategies
        const extractionStrategies = [
            () => this.extractJSONWithBracketMatching(cleanedContent),
            () => this.extractJSONWithRegex(cleanedContent),
            () => this.extractJSONWithLineAnalysis(cleanedContent),
            () => this.extractJSONWithManualParsing(cleanedContent)
        ];

        for (const strategy of extractionStrategies) {
            try {
                const result = strategy();
                if (result) {
                    console.log('✅ Successfully parsed JSON using strategy');
                    return result;
                }
            } catch (error) {
                console.log('Strategy failed:', error instanceof Error ? error.message : String(error));
                continue;
            }
        }

        // Step 3: Last resort - return default structure
        console.warn('❌ All parsing strategies failed, returning default structure');
        return this.createDefaultStructure();
    }

    private cleanContent(content: string): string {
        let cleaned = content.trim();

        // Remove markdown code blocks
        cleaned = cleaned.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
        cleaned = cleaned.replace(/```\s*/g, '').replace(/```\s*$/g, '');

        // Remove common prefixes
        cleaned = cleaned.replace(/^(SUMMARIZE:|REFLECT\/CRITICIZE:|REVISE:|AGGREGATE:)/g, '');

        // Remove extra whitespace
        cleaned = cleaned.replace(/\n\s*\n/g, '\n').trim();

        return cleaned;
    }

    private extractJSONWithBracketMatching(content: string): any {
        // Find the first JSON structure
        const jsonStart = content.search(/[{\[]/);
        if (jsonStart === -1) return null;

        const startChar = content[jsonStart];
        const isArray = startChar === '[';
        const isObject = startChar === '{';

        let bracketCount = 0;
        let braceCount = 0;
        let inString = false;
        let escapeNext = false;

        for (let i = jsonStart; i < content.length; i++) {
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
                if (char === '{') braceCount++;
                if (char === '}') braceCount--;
                if (char === '[') bracketCount++;
                if (char === ']') bracketCount--;

                if (isArray && bracketCount === 0 && i > jsonStart) {
                    const jsonStr = content.substring(jsonStart, i + 1);
                    return JSON.parse(jsonStr);
                }
                if (isObject && braceCount === 0 && i > jsonStart) {
                    const jsonStr = content.substring(jsonStart, i + 1);
                    return JSON.parse(jsonStr);
                }
            }
        }

        return null;
    }

    private extractJSONWithRegex(content: string): any {
        // Try to find JSON objects or arrays
        const patterns = [
            /\{[\s\S]*?\}/,  // Non-greedy JSON object
            /\[[\s\S]*?\]/,  // Non-greedy JSON array
        ];

        for (const pattern of patterns) {
            const matches = content.match(pattern);
            if (matches) {
                for (const match of matches) {
                    try {
                        return JSON.parse(match);
                    } catch (error) {
                        // Try to fix common issues
                        const fixed = this.fixJSONString(match);
                        try {
                            return JSON.parse(fixed);
                        } catch (fixedError) {
                            continue;
                        }
                    }
                }
            }
        }

        return null;
    }

    private extractJSONWithLineAnalysis(content: string): any {
        const lines = content.split('\n');
        let jsonLines: string[] = [];
        let inJson = false;
        let bracketCount = 0;

        for (const line of lines) {
            const trimmed = line.trim();

            if (!inJson && (trimmed.startsWith('{') || trimmed.startsWith('['))) {
                inJson = true;
                bracketCount = 0;
            }

            if (inJson) {
                jsonLines.push(line);

                // Count brackets
                for (const char of line) {
                    if (char === '{' || char === '[') bracketCount++;
                    if (char === '}' || char === ']') bracketCount--;
                }

                if (bracketCount === 0 && (trimmed.endsWith('}') || trimmed.endsWith(']'))) {
                    const jsonStr = jsonLines.join('\n');
                    try {
                        return JSON.parse(jsonStr);
                    } catch (error) {
                        // Try to fix and parse
                        const fixed = this.fixJSONString(jsonStr);
                        try {
                            return JSON.parse(fixed);
                        } catch (fixedError) {
                            break;
                        }
                    }
                }
            }
        }

        return null;
    }

    private extractJSONWithManualParsing(content: string): any {
        // Try to manually construct a valid JSON from the content
        try {
            // Look for claim-like structures
            const claimMatches = content.match(/ticker["\s]*:["\s]*([A-Z]+)/g);
            if (claimMatches) {
                const claims = claimMatches.map((match, index) => {
                    const ticker = match.match(/["\s]*:["\s]*([A-Z]+)/)?.[1] || 'UNKNOWN';
                    return {
                        id: `claim_${ticker.toLowerCase()}_${Date.now()}_${index}`,
                        ticker: ticker,
                        agentRole: 'sentiment',
                        claim: 'HOLD',
                        confidence: 0.2,
                        evidence: [],
                        timestamp: Date.now(),
                        riskFlags: ['manual_parse']
                    };
                });

                return { claims };
            }
        } catch (error) {
            console.log('Manual parsing failed:', error instanceof Error ? error.message : String(error));
        }

        return null;
    }

    private fixJSONString(jsonStr: string): string {
        let fixed = jsonStr;

        // Fix trailing commas
        fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
        fixed = fixed.replace(/,(\s*})/g, '$1');

        // Fix missing quotes around property names
        fixed = fixed.replace(/(\w+):/g, '"$1":');

        // Fix single quotes to double quotes
        fixed = fixed.replace(/'/g, '"');

        // Fix unescaped quotes in strings
        fixed = fixed.replace(/(?<!\\)"/g, '\\"');
        fixed = fixed.replace(/\\"/g, '"');

        // Fix newlines in strings
        fixed = fixed.replace(/\n/g, '\\n');
        fixed = fixed.replace(/\r/g, '\\r');
        fixed = fixed.replace(/\t/g, '\\t');

        return fixed;
    }

    private createDefaultStructure(): any {
        return {
            claims: [{
                id: crypto.randomUUID(),
                ticker: 'UNKNOWN',
                agentRole: 'sentiment',
                claim: 'HOLD',
                confidence: 0.2,
                evidence: [],
                timestamp: Date.now(),
                riskFlags: ['parse_error']
            }]
        };
    }



    async validateResponse(response: string): Promise<boolean> {
        try {
            const parsed = JSON.parse(response);
            return Array.isArray(parsed) || (parsed && Array.isArray(parsed.claims));
        } catch {
            return false;
        }
    }
}
