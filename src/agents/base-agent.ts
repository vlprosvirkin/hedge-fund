import type { Claim, Evidence, MarketStats } from '../types/index.js';
import { ClaimSchema } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';
import { OpenAIService } from '../services/openai.service.js';

export interface AgentContext {
  universe: string[];
  facts: Evidence[];
  marketStats: MarketStats[];
  riskProfile: string;
  timestamp: number;
}

export interface AgentResponse {
  claims: Claim[];
  errors: string[];
  openaiResponse?: string; // Raw AI reasoning
  analysis?: string; // Human-readable analysis summary
}

export abstract class BaseAgent {
  protected role: 'fundamental' | 'sentiment' | 'valuation';
  protected riskProfile: string = 'neutral';
  protected openaiService: OpenAIService;

  constructor(role: 'fundamental' | 'sentiment' | 'valuation') {
    this.role = role;
    this.openaiService = new OpenAIService();
  }

  abstract buildSystemPrompt(context: AgentContext): string;
  abstract buildUserPrompt(context: AgentContext, processedData?: any[]): string;
  abstract processData(context: AgentContext): Promise<any>;

  async run(context: AgentContext): Promise<AgentResponse> {
    const errors: string[] = [];
    const claims: Claim[] = [];
    let processedData: any[] = [];
    let openaiResponse: string = '';
    let analysis: string = '';

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
      // Call OpenAI to generate claims with reasoning
      const result = await this.openaiService.generateClaimsWithReasoning(
        systemPrompt,
        userPrompt,
        { ...context, processedData, agentRole: this.role }
      );

      console.log(`🤖 ${this.role.toUpperCase()} Agent: OpenAI response received, claims: ${result.claims.length}`);
      console.log(`🤖 ${this.role.toUpperCase()} Agent: Raw OpenAI response length: ${result.openaiResponse?.length || 0} chars`);
      console.log(`🤖 ${this.role.toUpperCase()} Agent: Raw OpenAI response preview: ${result.openaiResponse?.substring(0, 300)}...`);
      
      claims.push(...result.claims);
      openaiResponse = result.openaiResponse || '';
      analysis = result.analysis || '';

      console.log(`🤖 ${this.role.toUpperCase()} Agent: Analysis extracted: ${analysis.substring(0, 100)}...`);
      console.log(`🤖 ${this.role.toUpperCase()} Agent: Claims generated:`, claims.map(c => `${c.ticker}: ${c.claim} (${(c.confidence * 100).toFixed(1)}%)`));

    } catch (error) {
      console.error(`❌ Error in ${this.role} agent:`, error);
      errors.push(`Failed to run ${this.role} agent: ${error}`);

      // Don't fall back to mock claims - fail gracefully
      console.error(`OpenAI failed for ${this.role} agent, no fallback to mock data`);
    }

    return { claims, errors, openaiResponse, analysis };
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
