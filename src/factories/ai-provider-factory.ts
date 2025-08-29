import type { AIProvider } from '../types/ai-provider.js';
import { OpenAIService } from '../services/ai/openai.service.js';
import { GeminiService } from '../services/ai/gemini.service.js';

export class AIProviderFactory {
    /**
     * Create AI provider based on environment configuration
     */
    static createProvider(): AIProvider {
        const providerType = process.env.AI_PROVIDER || 'openai';
        
        console.log(`🤖 Creating AI provider: ${providerType}`);

        switch (providerType.toLowerCase()) {
            case 'openai':
            case 'gpt':
                return new OpenAIService();
            
            case 'gemini':
            case 'google':
                return new GeminiService();
            
            default:
                console.warn(`⚠️ Unknown AI provider: ${providerType}, falling back to OpenAI`);
                return new OpenAIService();
        }
    }

    /**
     * Get available providers info
     */
    static getAvailableProviders(): Array<{ name: string; description: string; models: string[] }> {
        return [
            {
                name: 'openai',
                description: 'OpenAI GPT models (GPT-4o, GPT-4o-mini, etc.)',
                models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo']
            },
            {
                name: 'gemini',
                description: 'Google Gemini models (Gemini 1.5 Pro, Gemini 1.5 Flash, etc.)',
                models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro']
            }
        ];
    }

    /**
     * Validate provider configuration
     */
    static validateConfiguration(): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];
        const providerType = process.env.AI_PROVIDER || 'openai';

        // Check required API keys
        if (providerType.toLowerCase() === 'openai' && !process.env.OPENAI_API_KEY) {
            errors.push('OPENAI_API_KEY is required when using OpenAI provider');
        }

        if (providerType.toLowerCase() === 'gemini' && !process.env.GEMINI_API_KEY) {
            errors.push('GEMINI_API_KEY is required when using Gemini provider');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}
