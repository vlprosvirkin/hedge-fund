import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Claim } from '../../types/index.js';
import type { AIProvider, AIProviderResponse } from '../../types/ai-provider.js';
import { splitResponseIntoParts, extractClaimsFromJSON, extractClaimsFromText } from '../../utils/json-parsing-utils.js';

export class GeminiService implements AIProvider {
    private client: GoogleGenerativeAI;
    private model: string;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY environment variable is required');
        }

        this.client = new GoogleGenerativeAI(apiKey);

        // Model selection based on environment
        this.model = this.selectModel();
        console.log(`🤖 Gemini Service initialized with model: ${this.model}`);
    }

    /**
     * Select appropriate model based on environment
     * Dev/Test: Use cheaper models to save costs
     * Prod: Use high-quality models for best results
     */
    private selectModel(): string {
        const env = process.env.NODE_ENV || 'development';
        const forceModel = process.env.GEMINI_MODEL; // Allow manual override

        if (forceModel) {
            console.log(`🔧 Using forced Gemini model: ${forceModel}`);
            return forceModel;
        }

        // Model selection logic
        if (env === 'production') {
            return 'gemini-1.5-pro'; // Best quality for production
        } else {
            // Development and testing environments
            return 'gemini-1.5-flash'; // Cheapest for development and testing
        }
    }

    /**
     * Get current model info for debugging
     */
    public getModelInfo(): { model: string; costPer1kTokens: string; maxTokens: number } {
        // Gemini pricing (approximate, may vary)
        const modelInfo = {
            'gemini-1.5-pro': { costPer1kTokens: '$0.0035 (input) / $0.0105 (output)', maxTokens: 1000000 },
            'gemini-1.5-flash': { costPer1kTokens: '$0.000075 (input) / $0.0003 (output)', maxTokens: 1000000 },
            'gemini-1.0-pro': { costPer1kTokens: '$0.0005 (input) / $0.0015 (output)', maxTokens: 30000 }
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
            console.log(`🔍 Gemini Request ID: ${requestId} using model: ${this.model}`);

            const model = this.client.getGenerativeModel({ 
                model: this.model,
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 4000  // Increased from default to handle longer responses
                }
            });

            // Combine system and user prompts for Gemini
            const combinedPrompt = `${systemPrompt}\n\n${userPrompt}`;

            const result = await model.generateContent(combinedPrompt);
            const response = await result.response;
            const content = response.text();

            if (!content) {
                throw new Error('No content received from Gemini');
            }

            // Log token usage for cost tracking (Gemini doesn't provide usage info in the same way)
            console.log(`💰 Gemini response generated (${this.model})`);

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
            console.error('Gemini API error:', error);
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
            console.log(`🔍 Generating simple Gemini response using model: ${this.model}`);

            const model = this.client.getGenerativeModel({ 
                model: this.model,
                generationConfig: {
                    temperature: options.temperature || 0.3,
                    maxOutputTokens: options.maxTokens || 500
                }
            });

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const content = response.text();

            if (!content) {
                throw new Error('No content received from Gemini');
            }

            console.log(`💰 Simple Gemini response generated (${this.model})`);

            return content;
        } catch (error) {
            console.error('Gemini API error:', error);
            throw new Error(`Failed to generate response: ${error}`);
        }
    }
}
