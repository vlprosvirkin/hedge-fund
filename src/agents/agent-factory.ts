import { FundamentalAgent } from './fundamental-agent.js';
import { SentimentAgent } from './sentiment-agent.js';
import { ValuationAgent } from './valuation-agent.js';
import { BaseAgent } from './base-agent.js';
import { TechnicalIndicatorsAdapter } from '../adapters/technical-indicators-adapter.js';
import { TechnicalAnalysisService } from '../services/technical-analysis.service.js';

export class AgentFactory {
  private static agents: Map<string, BaseAgent> = new Map();
  private static technicalIndicators: TechnicalIndicatorsAdapter | null = null;
  private static technicalAnalysis: TechnicalAnalysisService | null = null;

  private static async ensureTechnicalServices(): Promise<{
    technicalIndicators: TechnicalIndicatorsAdapter;
    technicalAnalysis: TechnicalAnalysisService;
  }> {
    if (!this.technicalIndicators) {
      this.technicalIndicators = new TechnicalIndicatorsAdapter();
      await this.technicalIndicators.connect();
    }

    if (!this.technicalAnalysis) {
      this.technicalAnalysis = new TechnicalAnalysisService();
    }

    return {
      technicalIndicators: this.technicalIndicators,
      technicalAnalysis: this.technicalAnalysis
    };
  }

  static async createAgent(
    role: 'fundamental' | 'sentiment' | 'valuation',
    technicalIndicators?: TechnicalIndicatorsAdapter,
    technicalAnalysis?: TechnicalAnalysisService
  ): Promise<BaseAgent> {
    if (this.agents.has(role)) {
      return this.agents.get(role)!;
    }

    // Use provided services or create new ones
    const services = technicalIndicators && technicalAnalysis 
      ? { technicalIndicators, technicalAnalysis }
      : await this.ensureTechnicalServices();

    let agent: BaseAgent;

    switch (role) {
      case 'fundamental':
        agent = new FundamentalAgent(services.technicalIndicators, services.technicalAnalysis);
        break;
      case 'sentiment':
        agent = new SentimentAgent();
        break;
      case 'valuation':
        agent = new ValuationAgent(services.technicalIndicators, services.technicalAnalysis);
        break;
      default:
        throw new Error(`Unknown agent role: ${role}`);
    }

    this.agents.set(role, agent);
    return agent;
  }

  static async getAllAgents(
    technicalIndicators?: TechnicalIndicatorsAdapter,
    technicalAnalysis?: TechnicalAnalysisService
  ): Promise<BaseAgent[]> {
    const roles: ('fundamental' | 'sentiment' | 'valuation')[] = ['fundamental', 'sentiment', 'valuation'];
    const agents = await Promise.all(roles.map(role => this.createAgent(role, technicalIndicators, technicalAnalysis)));
    return agents;
  }

  static clearCache(): void {
    this.agents.clear();
  }
}
