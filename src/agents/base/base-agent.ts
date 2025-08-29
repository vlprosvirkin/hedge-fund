import type { Claim, Evidence, MarketStats } from '../../types/index.js';
import { ClaimSchema } from '../../types/index.js';
import { v4 as uuidv4 } from 'uuid';
import { AIProviderFactory } from '../../factories/ai-provider-factory.js';
import type { AIProvider } from '../../types/ai-provider.js';

export interface AgentContext {
  universe: string[];
  facts: Evidence[];
  marketStats: MarketStats[];
  riskProfile: string;
  timestamp: number;
  fearGreedIndex?: number; // Optional Fear & Greed Index (0-100)
}

export interface AgentResponse {
  claims: Claim[];
  errors: string[];
  openaiResponse?: string; // Raw AI reasoning
  textPart?: string; // Human-readable text analysis
  jsonPart?: any; // Parsed JSON data
  systemPrompt?: string; // System prompt used
  userPrompt?: string; // User prompt used
}

export abstract class BaseAgent {
  protected role: 'fundamental' | 'sentiment' | 'technical';
  protected riskProfile: string = 'neutral';
  protected aiProvider: AIProvider;

  constructor(role: 'fundamental' | 'sentiment' | 'technical') {
    this.role = role;
    this.aiProvider = AIProviderFactory.createProvider();
  }

  abstract buildSystemPrompt(context: AgentContext): string;
  abstract buildUserPrompt(context: AgentContext, processedData?: any[]): string;
  abstract processData(context: AgentContext): Promise<any>;

  async run(context: AgentContext): Promise<AgentResponse> {
    const errors: string[] = [];
    const claims: Claim[] = [];
    let processedData: any[] = [];
    let openaiResponse: string = '';
    let textPart: string = '';
    let jsonPart: any = null;
    let systemPrompt: string = '';
    let userPrompt: string = '';

    try {
      console.log(`🤖 ${this.role.toUpperCase()} Agent: Starting analysis...`);
      console.log(`🤖 ${this.role.toUpperCase()} Agent: Context - Universe: ${context.universe.join(', ')}, Risk Profile: ${context.riskProfile}`);

      processedData = await this.processData(context);
      console.log(`🤖 ${this.role.toUpperCase()} Agent: Processed data completed, got ${processedData.length} items`);
      console.log(`🤖 ${this.role.toUpperCase()} Agent: Processed data preview:`, processedData.map((item, i) => `${i}: ${JSON.stringify(item).substring(0, 100)}...`));

      // Build prompts with processed data
      const systemPrompt = this.buildSystemPrompt(context);
      const userPrompt = this.buildUserPrompt(context, processedData);

      console.log(`🤖 ${this.role.toUpperCase()} Agent: System prompt length: ${systemPrompt.length} chars`);
      console.log(`🤖 ${this.role.toUpperCase()} Agent: User prompt length: ${userPrompt.length} chars`);
      console.log(`🤖 ${this.role.toUpperCase()} Agent: User prompt preview: ${userPrompt.substring(0, 200)}...`);

      console.log(`🤖 ${this.role.toUpperCase()} Agent: Calling OpenAI...`);
      // Call AI provider to generate claims with reasoning
      const result = await this.aiProvider.generateClaimsWithReasoning(
        systemPrompt,
        userPrompt,
        { ...context, processedData, agentRole: this.role }
      );

      console.log(`🤖 ${this.role.toUpperCase()} Agent: OpenAI response received, claims: ${result.claims.length}`);

      claims.push(...result.claims);
      openaiResponse = result.openaiResponse || '';
      textPart = result.textPart || '';
      jsonPart = result.jsonPart || null;

      console.log(`🤖 ${this.role.toUpperCase()} Agent: Text part extracted: ${textPart.substring(0, 100)}...`);
      console.log(`🤖 ${this.role.toUpperCase()} Agent: Claims generated:`, claims.map(c => `${c.ticker}: ${c.claim} (${(c.confidence * 100).toFixed(1)}%)`));

    } catch (error) {
      console.error(`❌ Error in ${this.role} agent:`, error);
      errors.push(`Failed to run ${this.role} agent: ${error}`);

      // Don't fall back to mock claims - fail gracefully
      console.error(`OpenAI failed for ${this.role} agent, no fallback to mock data`);
    }

    return { 
      claims, 
      errors, 
      openaiResponse, 
      textPart, 
      jsonPart,
      systemPrompt: systemPrompt || '',
      userPrompt: userPrompt || ''
    };
  }



  protected validateClaim(claim: any): boolean {
    try {
      ClaimSchema.parse(claim);
      return true;
    } catch {
      return false;
    }
  }

  protected parseClaimsFromResponse(response: string, context: AgentContext): Claim[] {
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }

      const claimsData = JSON.parse(jsonMatch[0]);
      const claims: Claim[] = [];

      for (const claimData of claimsData) {
        const claim: Claim = {
          id: claimData.id || uuidv4(),
          ticker: claimData.ticker,
          agentRole: this.role,
          claim: claimData.claim || claimData.action || 'HOLD',
          confidence: Math.max(0, Math.min(1, claimData.confidence || 0.5)),
          evidence: claimData.evidence || [],
          timestamp: context.timestamp,
          riskFlags: claimData.riskFlags || []
        };

        if (this.validateClaim(claim)) {
          claims.push(claim);
        }
      }

      return claims;
    } catch (error) {
      console.error(`Failed to parse claims from ${this.role} agent response:`, error);
      return [];
    }
  }

  protected getRiskProfileContext(profile: string): string {
    switch (profile) {
      case 'averse':
        return 'Penalize high volatility, prioritize stability/liquidity, prefer HOLD/SELL in bull phases';
      case 'neutral':
        return 'Balance signals/risks, standard thresholds, moderate position sizing';
      case 'bold':
        return 'Higher tolerance for volatility and momentum, aggressive thresholds';
      default:
        return 'Standard risk assessment';
    }
  }
}
