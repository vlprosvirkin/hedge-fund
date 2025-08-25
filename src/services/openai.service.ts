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

    async generateClaimsWithReasoning(
        systemPrompt: string,
        userPrompt: string,
        context: any
    ): Promise<{ claims: Claim[]; openaiResponse: string; analysis: string }> {
        try {
            // Generate unique request ID
            const requestId = `${context.agentRole || 'unknown'}_${context.timestamp}_${Math.random().toString(36).substr(2, 9)}`;
            console.log(`🔍 OpenAI Request ID: ${requestId}`);

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
                temperature: 0.3,
                max_tokens: 2000
            });

            const content = response.choices[0]?.message?.content;
            if (!content) {
                throw new Error('No content received from OpenAI');
            }

            console.log('Raw OpenAI response:', content.substring(0, 200) + '...');

            // Parse the JSON response
            const parsed = this.parseOpenAIResponse(content);
            const claimsArray = Array.isArray(parsed) ? parsed : parsed.claims || [];

            const claims = claimsArray.map((claimData: any, index: number) => ({
                id: `${claimData.ticker}_${claimData.agentRole}_${requestId}_${index}`,
                ticker: claimData.ticker,
                agentRole: claimData.agentRole,
                claim: claimData.claim || claimData.action || 'HOLD',
                confidence: Math.max(0, Math.min(1, claimData.confidence || 0.5)),
                evidence: claimData.evidence || [],
                timestamp: context.timestamp,
                riskFlags: claimData.riskFlags || []
            }));

            // Extract human-readable analysis
            const analysis = this.extractAnalysisFromResponse(content);

            return {
                claims,
                openaiResponse: content,
                analysis
            };

        } catch (error) {
            console.error('OpenAI API error:', error);
            throw new Error(`Failed to generate claims: ${error}`);
        }
    }

    private parseOpenAIResponse(content: string): any {
        // Clean the content
        let cleanedContent = content.trim()
            .replace(/```json\s*/g, '')
            .replace(/```\s*$/g, '')
            .replace(/```\s*/g, '')
            .replace(/```\s*$/g, '');

        // Try to extract JSON using bracket matching
        const jsonStart = cleanedContent.search(/[{\[]/);
        if (jsonStart === -1) {
            return this.createDefaultStructure();
        }

        const startChar = cleanedContent[jsonStart];
        const isArray = startChar === '[';
        const isObject = startChar === '{';

        let bracketCount = 0;
        let braceCount = 0;
        let inString = false;
        let escapeNext = false;

        for (let i = jsonStart; i < cleanedContent.length; i++) {
            const char = cleanedContent[i];

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
                    const jsonStr = cleanedContent.substring(jsonStart, i + 1);
                    try {
                        return JSON.parse(jsonStr);
                    } catch (error) {
                        console.warn('Failed to parse JSON array:', error);
                        break;
                    }
                }
                if (isObject && braceCount === 0 && i > jsonStart) {
                    const jsonStr = cleanedContent.substring(jsonStart, i + 1);
                    try {
                        return JSON.parse(jsonStr);
                    } catch (error) {
                        console.warn('Failed to parse JSON object:', error);
                        break;
                    }
                }
            }
        }

        return this.createDefaultStructure();
    }

    private extractAnalysisFromResponse(content: string): string {
        // First, try to find analysis before JSON
        const jsonStart = content.search(/[{\[]/);
        if (jsonStart > 0) {
            const beforeJson = content.substring(0, jsonStart).trim();
            if (beforeJson.length > 10) {
                return beforeJson.substring(0, 500);
            }
        }

        // If no analysis before JSON, try to extract from the whole content
        const lines = content.split('\n');
        let analysisLines: string[] = [];

        for (const line of lines) {
            const trimmed = line.trim();

            // Skip JSON blocks, empty lines, and markdown
            if (trimmed.startsWith('{') || trimmed.startsWith('[') ||
                trimmed === '' || trimmed.startsWith('#') || trimmed.startsWith('```') ||
                trimmed.startsWith('"id"') || trimmed.startsWith('"ticker"') ||
                trimmed.startsWith('"claim"') || trimmed.startsWith('"confidence"') ||
                trimmed.startsWith('"agentRole"') || trimmed.startsWith('"horizon"') ||
                trimmed.startsWith('"signals"') || trimmed.startsWith('"evidence"') ||
                trimmed.startsWith('"riskFlags"') || trimmed.startsWith('"notes"') ||
                trimmed.startsWith('"name"') || trimmed.startsWith('"value"')) {
                continue;
            }

            // Collect non-JSON lines as analysis
            if (trimmed.length > 0) {
                analysisLines.push(trimmed);
            }
        }

        const analysis = analysisLines.join(' ').substring(0, 500);
        return analysis || 'Analysis not available';
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

    // Backward compatibility method
    async generateClaims(
        systemPrompt: string,
        userPrompt: string,
        context: any
    ): Promise<Claim[]> {
        const result = await this.generateClaimsWithReasoning(systemPrompt, userPrompt, context);
        return result.claims;
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
