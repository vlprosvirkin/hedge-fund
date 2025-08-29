import OpenAI from 'openai';
import crypto from 'crypto';
import type { Claim } from '../../types/index.js';
import type { AIProvider, AIProviderResponse } from '../../types/ai-provider.js';
import { splitResponseIntoParts, extractClaimsFromJSON, extractClaimsFromText } from '../../utils/json-parsing-utils.js';

export class OpenAIService implements AIProvider {
    private client: OpenAI;
    private model: string;

    constructor() {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error('OPENAI_API_KEY environment variable is required');
        }

        this.client = new OpenAI({
            apiKey: apiKey
        });

        // Model selection based on environment
        this.model = this.selectModel();
        console.log(`🤖 OpenAI Service initialized with model: ${this.model}`);
    }

    /**
     * Select appropriate model based on environment
     * Dev/Test: Use cheaper models to save costs
     * Prod: Use high-quality models for best results
     */
    private selectModel(): string {
        const env = process.env.NODE_ENV || 'development';
        const forceModel = process.env.OPENAI_MODEL; // Allow manual override

        if (forceModel) {
            console.log(`🔧 Using forced model: ${forceModel}`);
            return forceModel;
        }

        // Model selection logic
        if (env === 'production') {
            return 'gpt-4o'; // Best quality for production (newest model)
        } else {
            // Development and testing environments
            return 'gpt-4o-mini'; // Cheapest for development and testing
        }
    }

    /**
     * Get current model info for debugging
     */
    public getModelInfo(): { model: string; costPer1kTokens: string; maxTokens: number } {
        // Updated prices as of 2024 (from OpenAI API documentation)
        const modelInfo = {
            'gpt-4o': { costPer1kTokens: '$0.0025 (input) / $0.01 (output)', maxTokens: 128000 },
            'gpt-4o-mini': { costPer1kTokens: '$0.00015 (input) / $0.0006 (output)', maxTokens: 128000 },
            'gpt-4-turbo': { costPer1kTokens: '$0.01 (input) / $0.03 (output)', maxTokens: 128000 },
            'gpt-4': { costPer1kTokens: '$0.03 (input) / $0.06 (output)', maxTokens: 8192 },
            'gpt-3.5-turbo': { costPer1kTokens: '$0.0005 (input) / $0.0015 (output)', maxTokens: 16385 }
        };

        const info = modelInfo[this.model as keyof typeof modelInfo] || { costPer1kTokens: 'Unknown', maxTokens: 2000 };

        return {
            model: this.model,
            costPer1kTokens: info.costPer1kTokens,
            maxTokens: info.maxTokens
        };
    }

    async generateClaimsWithReasoning(
        systemPrompt: string,
        userPrompt: string,
        context: any
    ): Promise<AIProviderResponse> {
        try {
            // Generate unique request ID
            const requestId = `${context.agentRole || 'unknown'}_${context.timestamp}_${Math.random().toString(36).substr(2, 9)}`;
            console.log(`🔍 OpenAI Request ID: ${requestId} using model: ${this.model}`);

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

            // Log token usage for cost tracking
            const usage = response.usage;
            if (usage) {
                const modelInfo = this.getModelInfo();
                            console.log(`💰 Token usage: ${usage.prompt_tokens} input + ${usage.completion_tokens} output = ${usage.total_tokens} total (${modelInfo.model})`);
        }

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

    // Simple response generation for summaries
    async generateResponse(
        prompt: string,
        options: { maxTokens?: number; temperature?: number } = {}
    ): Promise<string> {
        try {
            console.log(`🔍 Generating simple response using model: ${this.model}`);

            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: options.temperature || 0.3,
                max_tokens: options.maxTokens || 500
            });

            const content = response.choices[0]?.message?.content;
            if (!content) {
                throw new Error('No content received from OpenAI');
            }

            // Log token usage for cost tracking
            const usage = response.usage;
            if (usage) {
                const modelInfo = this.getModelInfo();
                console.log(`💰 Simple response tokens: ${usage.prompt_tokens} + ${usage.completion_tokens} = ${usage.total_tokens} (${modelInfo.model})`);
            }

            return content;
        } catch (error) {
            console.error('OpenAI API error:', error);
            throw new Error(`Failed to generate response: ${error}`);
        }
    }
}
