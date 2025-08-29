import { FundamentalAgent } from '../agents/implementations/fundamental-agent.js';
import { SentimentAgent } from '../agents/implementations/sentiment-agent.js';
import { TechnicalAnalysisAgent } from '../agents/implementations/technical-agent.js';
import { BaseAgent } from '../agents/base/base-agent.js';
import { Signals } from '../adapters/signals-adapter.js';
import { TechnicalAnalysisService } from '../services/analysis/technical-analysis.service.js';
import { FundamentalAnalysisService } from '../services/analysis/fundamental-analysis.service.js';
import { SentimentAnalysisService } from '../services/analysis/sentiment-analysis.service.js';

export class AgentFactory {
  private static agents: Map<string, BaseAgent> = new Map();
  private static technicalIndicators: Signals | null = null;
  private static technicalAnalysis: TechnicalAnalysisService | null = null;
  private static fundamentalAnalysis: FundamentalAnalysisService | null = null;
  private static sentimentAnalysis: SentimentAnalysisService | null = null;

  private static async ensureTechnicalServices(): Promise<{
    technicalIndicators: Signals;
    technicalAnalysis: TechnicalAnalysisService;
  }> {
    if (!this.technicalIndicators) {
      this.technicalIndicators = new Signals();
    }

    if (!this.technicalAnalysis) {
      this.technicalAnalysis = new TechnicalAnalysisService();
    }

    return {
      technicalIndicators: this.technicalIndicators,
      technicalAnalysis: this.technicalAnalysis
    };
  }

  private static async ensureFundamentalServices(): Promise<{
    fundamentalAnalysis: FundamentalAnalysisService;
  }> {
    if (!this.fundamentalAnalysis) {
      this.fundamentalAnalysis = new FundamentalAnalysisService();
    }

    return {
      fundamentalAnalysis: this.fundamentalAnalysis
    };
  }

  private static async ensureSentimentServices(): Promise<{
    technicalIndicators: Signals;
    sentimentAnalysis: SentimentAnalysisService;
  }> {
    if (!this.technicalIndicators) {
      this.technicalIndicators = new Signals();
    }

    if (!this.sentimentAnalysis) {
      this.sentimentAnalysis = new SentimentAnalysisService();
    }

    return {
      technicalIndicators: this.technicalIndicators,
      sentimentAnalysis: this.sentimentAnalysis
    };
  }

  static async createAgent(
    role: 'fundamental' | 'sentiment' | 'technical',
    technicalIndicators?: Signals,
    technicalAnalysis?: TechnicalAnalysisService,
    fundamentalAnalysis?: FundamentalAnalysisService,
    sentimentAnalysis?: SentimentAnalysisService
  ): Promise<BaseAgent> {
    if (this.agents.has(role)) {
      return this.agents.get(role)!;
    }

    let agent: BaseAgent;

    switch (role) {
      case 'fundamental':
        // Use provided services or create new ones for fundamental analysis
        const fundamentalServices = fundamentalAnalysis
          ? { fundamentalAnalysis }
          : await this.ensureFundamentalServices();

        agent = new FundamentalAgent(fundamentalServices.fundamentalAnalysis);
        break;

      case 'sentiment':
        // Use provided services or create new ones for sentiment analysis
        const sentimentServices = sentimentAnalysis && technicalIndicators
          ? { technicalIndicators, sentimentAnalysis }
          : await this.ensureSentimentServices();

        agent = new SentimentAgent(sentimentServices.technicalIndicators, sentimentServices.sentimentAnalysis);
        break;

      case 'technical':
        // Use provided services or create new ones for technical analysis
        const technicalServices = technicalIndicators && technicalAnalysis
          ? { technicalIndicators, technicalAnalysis }
          : await this.ensureTechnicalServices();

        agent = new TechnicalAnalysisAgent(technicalServices.technicalIndicators, technicalServices.technicalAnalysis);
        break;

      default:
        throw new Error(`Unknown agent role: ${role}`);
    }

    this.agents.set(role, agent);
    return agent;
  }

  static async getAllAgents(
    technicalIndicators?: Signals,
    technicalAnalysis?: TechnicalAnalysisService,
    fundamentalAnalysis?: FundamentalAnalysisService,
    sentimentAnalysis?: SentimentAnalysisService
  ): Promise<BaseAgent[]> {
    const roles: ('fundamental' | 'sentiment' | 'technical')[] = ['fundamental', 'sentiment', 'technical'];
    const agents = await Promise.all(roles.map(role =>
      this.createAgent(role, technicalIndicators, technicalAnalysis, fundamentalAnalysis, sentimentAnalysis)
    ));
    return agents;
  }

  static clearCache(): void {
    this.agents.clear();
  }
}
