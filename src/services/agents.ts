import type { LLMService } from '../interfaces/adapters.js';
import type { Claim, Evidence, MarketStats } from '../types/index.js';
import { AgentCoordinator } from '../agents/agent-coordinator.js';
import type { AgentContext } from '../agents/base-agent.js';
import { TechnicalIndicatorsAdapter } from '../adapters/technical-indicators-adapter.js';
import { TechnicalAnalysisService } from '../services/technical-analysis.service.js';

export class AgentsService implements LLMService {
  private isConnectedFlag = false;
  private coordinator: AgentCoordinator;
  private technicalIndicators: TechnicalIndicatorsAdapter;
  private technicalAnalysis: TechnicalAnalysisService;

  constructor(
    technicalIndicators?: TechnicalIndicatorsAdapter,
    technicalAnalysis?: TechnicalAnalysisService
  ) {
    this.technicalIndicators = technicalIndicators || new TechnicalIndicatorsAdapter();
    this.technicalAnalysis = technicalAnalysis || new TechnicalAnalysisService();
    this.coordinator = new AgentCoordinator(this.technicalIndicators, this.technicalAnalysis);
  }

  async connect(): Promise<void> {
    try {
      // Connect technical indicators adapter
      await this.technicalIndicators.connect();

      this.isConnectedFlag = true;
      console.log('✅ AgentsService connected');
    } catch (error) {
      throw new Error(`Failed to connect to LLM service: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.technicalIndicators.disconnect();
    } catch (error) {
      console.error('Error disconnecting technical indicators:', error);
    }
    this.isConnectedFlag = false;
  }

  isConnected(): boolean {
    return this.isConnectedFlag;
  }

  async runRole(
    role: 'fundamental' | 'sentiment' | 'valuation',
    context: {
      universe: string[];
      facts: Evidence[];
      marketStats: MarketStats[];
      riskProfile: string;
      timestamp: number;
    }
  ): Promise<{ claims: Claim[]; errors: string[]; openaiResponse?: string; analysis?: string; textPart?: string; jsonPart?: any }> {
    // Convert context to AgentContext format
    const agentContext: AgentContext = {
      universe: context.universe,
      facts: context.facts,
      marketStats: context.marketStats,
      riskProfile: context.riskProfile,
      timestamp: context.timestamp
    };

    // Run the specific agent through the coordinator
    const result = await this.coordinator.runCollaboration(agentContext);

    // Filter claims by the requested role
    const roleClaims = result.claims.filter(claim => claim.agentRole === role);

    const response: any = {
      claims: roleClaims,
      errors: result.errors
    };

    if (result.openaiResponse) {
      response.openaiResponse = result.openaiResponse;
    }

    if (result.analysis) {
      response.analysis = result.analysis;
    }

    // Add textPart and jsonPart from the agent response
    if (result.textPart) {
      response.textPart = result.textPart;
    }

    if (result.jsonPart) {
      response.jsonPart = result.jsonPart;
    }

    return response;
  }

  validateClaim(claim: any): boolean {
    try {
      // Import ClaimSchema dynamically to avoid circular dependencies
      const { ClaimSchema } = require('../types/index.js');
      ClaimSchema.parse(claim);
      return true;
    } catch {
      return false;
    }
  }

  // New method to run full multi-agent collaboration
  async runMultiAgentCollaboration(context: {
    universe: string[];
    facts: Evidence[];
    marketStats: MarketStats[];
    riskProfile: string;
    timestamp: number;
  }): Promise<{
    claims: Claim[];
    consensus: any[];
    debateLog: any[];
    errors: string[];
  }> {
    const agentContext: AgentContext = {
      universe: context.universe,
      facts: context.facts,
      marketStats: context.marketStats,
      riskProfile: context.riskProfile,
      timestamp: context.timestamp
    };

    return await this.coordinator.runCollaboration(agentContext);
  }
}
