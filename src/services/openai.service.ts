import OpenAI from 'openai';
import crypto from 'crypto';
import type { Claim } from '../types/index.js';
import { splitResponseIntoParts, extractClaimsFromJSON, extractClaimsFromText } from '../utils/json-parsing-utils.js';

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
    ): Promise<{ claims: Claim[]; openaiResponse: string; textPart: string; jsonPart: any }> {
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

            // Split response into text part and JSON part
            const { textPart, jsonPart, hasValidJson } = splitResponseIntoParts(content);

            // Parse claims from JSON part or text if JSON parsing failed
            let claims;
            if (hasValidJson) {
                claims = extractClaimsFromJSON(jsonPart, {
                    ...context,
                    timestamp: context.timestamp,
                    requestId
                });
            } else {
                // Fallback: extract claims from text (for sentiment agent)
                claims = extractClaimsFromText(textPart, {
                    ...context,
                    timestamp: context.timestamp,
                    requestId
                });
            }

            return {
                claims,
                openaiResponse: content,
                textPart,
                jsonPart
            };

        } catch (error) {
            console.error('OpenAI API error:', error);
            throw new Error(`Failed to generate claims: ${error}`);
        }
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
}
