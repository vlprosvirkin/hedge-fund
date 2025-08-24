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

    try {
      processedData = await this.processData(context);

      // Build prompts with processed data
      const systemPrompt = this.buildSystemPrompt(context);
      const userPrompt = this.buildUserPrompt(context, processedData);

      // Call OpenAI to generate claims
      const generatedClaims = await this.openaiService.generateClaims(
        systemPrompt,
        userPrompt,
        { ...context, processedData }
      );

      claims.push(...generatedClaims);

    } catch (error) {
      console.error(`Error in ${this.role} agent:`, error);
      errors.push(`Failed to run ${this.role} agent: ${error}`);

      // Don't fall back to mock claims - fail gracefully
      console.error(`OpenAI failed for ${this.role} agent, no fallback to mock data`);
    }

    return { claims, errors };
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
