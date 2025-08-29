import type { Claim } from './index.js';

export interface AIProviderResponse {
    claims: Claim[];
    openaiResponse: string;
    textPart: string;
    jsonPart: any;
}

export interface AIProvider {
    generateClaimsWithReasoning(
        systemPrompt: string,
        userPrompt: string,
        context: any
    ): Promise<AIProviderResponse>;

    generateClaims(
        systemPrompt: string,
        userPrompt: string,
        context: any
    ): Promise<Claim[]>;

    generateResponse(
        prompt: string,
        options?: { maxTokens?: number; temperature?: number }
    ): Promise<string>;

    getModelInfo(): { model: string; costPer1kTokens: string; maxTokens: number };
}
