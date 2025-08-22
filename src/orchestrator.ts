import type {
  MarketDataAdapter,
  TradingAdapter,
  NewsAdapter,
  FactStore,
  UniverseService,
  LLMService,
  RiskService
} from './interfaces/adapters.js';
import type {
  Claim,
  ConsensusRec,
  TargetWeight,
  Position,
  MarketStats,
  SystemConfig,
  PipelineArtifact,
  RiskViolation
} from './types/index.js';
import { AgentsService } from './services/agents.js';
import { VerifierService } from './services/verifier.js';
import { ConsensusService } from './services/consensus.js';
import { TelegramAdapter } from './adapters/telegram-adapter.js';
import { v4 as uuidv4 } from 'uuid';
import pino from 'pino';

export class HedgeFundOrchestrator {
  private logger: pino.Logger;
  private roundId: string;
  private isRunning = false;
  private killSwitchActive = false;
  private telegram: TelegramAdapter;

  constructor(
    private config: SystemConfig,
    private marketData: MarketDataAdapter,
    private trading: TradingAdapter,
    private news: NewsAdapter,
    private factStore: FactStore,
    private universe: UniverseService,
    private agents: LLMService,
    private risk: RiskService,
    telegram?: TelegramAdapter
  ) {
    this.logger = pino({
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true
        }
      }
    });
    this.roundId = uuidv4();
    this.telegram = telegram || new TelegramAdapter();
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Orchestrator is already running');
      return;
    }

    this.isRunning = true;
    this.logger.info('Starting Hedge Fund Orchestrator');

    try {
      // Connect to all services
      await this.connectServices();

      // Start the main trading loop
      await this.runTradingLoop();
    } catch (error) {
      this.logger.error('Fatal error in orchestrator:', error);
      await this.emergencyStop();
    }
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    this.logger.info('Stopping Hedge Fund Orchestrator');

    try {
      await this.disconnectServices();
    } catch (error) {
      this.logger.error('Error during shutdown:', error);
    }
  }

  async emergencyStop(): Promise<void> {
    this.logger.error('EMERGENCY STOP TRIGGERED');
    this.killSwitchActive = true;
    this.isRunning = false;

    // 📱 Send emergency alert
    await this.telegram.postEmergencyAlert('kill_switch', 'Emergency stop triggered - all trading operations halted');

    try {
      await this.trading.emergencyClose();
      await this.disconnectServices();
    } catch (error) {
      this.logger.error('Error during emergency stop:', error);
      await this.telegram.postEmergencyAlert('api_failure', `Emergency stop failed: ${error}`);
    }
  }

  private async connectServices(): Promise<void> {
    this.logger.info('Connecting to services...');

    await Promise.all([
      this.marketData.connect(),
      this.trading.connect(),
      this.news.connect(),
      this.agents.connect(),
      this.telegram.connect()
    ]);

    this.logger.info('All services connected');
  }

  private async disconnectServices(): Promise<void> {
    this.logger.info('Disconnecting from services...');

    await Promise.all([
      this.marketData.disconnect(),
      this.trading.disconnect(),
      this.news.disconnect(),
      this.agents.disconnect(),
      this.telegram.disconnect()
    ]);

    this.logger.info('All services disconnected');
  }

  private async runTradingLoop(): Promise<void> {
    while (this.isRunning && !this.killSwitchActive) {
      try {
        this.roundId = uuidv4();
        this.logger.info(`Starting trading round ${this.roundId}`);

        // Execute the full trading pipeline
        const artifact = await this.executeTradingPipeline();

        // Log the artifact
        this.logger.info('Trading round completed', {
          roundId: this.roundId,
          claimsCount: artifact.claims.length,
          consensusCount: artifact.consensus.length,
          ordersCount: artifact.orders.length,
          violationsCount: artifact.riskViolations.length
        });

        // Wait for next round
        await this.sleep(this.config.debateInterval * 1000);

      } catch (error) {
        this.logger.error('Error in trading loop:', error);
        await this.sleep(5000); // Wait 5 seconds before retrying
      }
    }
  }

  private async executeTradingPipeline(): Promise<PipelineArtifact> {
    const startTime = Date.now();
    const timestamp = startTime - 60000; // Use 1 minute ago as cutoff

    // Step 1: Get universe and market data
    const universe = await this.universe.getUniverse({
      minVolume24h: 1000000,
      maxSpread: 0.5,
      minLiquidity: 0.1
    });

    // 📱 Notify round start
    await this.telegram.postRoundStart(this.roundId, universe);

    const marketStats = await Promise.all(
      universe.map(symbol => this.marketData.getMarketStats(symbol))
    );

    // Step 2: Get news and evidence
    const news = await this.news.search('crypto bitcoin ethereum', timestamp - 3600000, timestamp);
    await this.factStore.putNews(news);

    const evidence = await Promise.all(
      universe.map(ticker =>
        this.factStore.findEvidence(ticker, { since: timestamp - 3600000, until: timestamp })
      )
    ).then(results => results.flat());

    // Step 3: Generate claims from agents
    const agentRoles: Array<'fundamental' | 'sentiment' | 'valuation'> = ['fundamental', 'sentiment', 'valuation'];
    const allClaims: Claim[] = [];

    for (const role of agentRoles) {
      const agentStartTime = Date.now();

      const result = await this.agents.runRole(role, {
        universe,
        facts: evidence,
        marketStats,
        riskProfile: this.config.riskProfile,
        timestamp
      });

      const processingTime = Date.now() - agentStartTime;
      allClaims.push(...result.claims);

      // 📱 Notify agent analysis completion
      await this.telegram.postAgentAnalysis(this.roundId, role, result.claims, processingTime);
    }

    // Step 4: Verify claims
    const verifier = new VerifierService(this.factStore);
    const { verified: verifiedClaims, rejected, violations: verificationViolations } =
      await verifier.verifyClaims(allClaims, timestamp);

    // Step 5: Build consensus
    const consensusService = new ConsensusService();
    const consensus = await consensusService.buildConsensus(
      verifiedClaims,
      marketStats,
      this.config.maxPositions
    );

    // Detect conflicts
    const conflicts = await consensusService.detectConflicts(verifiedClaims);

    // 📱 Notify consensus results
    await this.telegram.postConsensusResults(this.roundId, consensus, conflicts.conflicts);

    // Step 6: Build target weights
    const targetWeights = this.buildTargetWeights(consensus, this.config.riskProfile);

    // Step 7: Risk check
    const currentPositions = await this.trading.getPositions();
    const riskCheck = await this.risk.checkLimits({
      targetWeights,
      currentPositions,
      marketStats,
      riskProfile: this.config.riskProfile
    });

    // 📱 Notify risk assessment
    await this.telegram.postRiskAssessment(this.roundId, {
      ok: riskCheck.ok,
      violations: riskCheck.violations,
      warnings: []
    });

    // Step 8: Execute trades (if risk check passes)
    const orders = [];
    if (riskCheck.ok && !this.killSwitchActive) {
      const executionOrders = await this.executeTrades(targetWeights, currentPositions);
      orders.push(...executionOrders);

      // Get updated positions after execution
      const updatedPositions = await this.trading.getPositions();

      // 📱 Notify order execution
      await this.telegram.postOrderExecution(this.roundId, orders, updatedPositions);
    }

    // Step 9: Create artifact and send summary
    const artifact: PipelineArtifact = {
      roundId: this.roundId,
      timestamp: startTime,
      claims: verifiedClaims,
      consensus,
      targetWeights,
      orders,
      riskViolations: [...verificationViolations, ...riskCheck.violations]
    };

    // Get portfolio performance metrics
    const finalPositions = await this.trading.getPositions();
    const portfolioMetrics = await this.getPortfolioMetrics();

    // 📱 Send comprehensive round summary
    await this.telegram.postRoundSummary({
      roundId: this.roundId,
      timestamp: startTime,
      claims: verifiedClaims,
      consensus,
      orders,
      positions: finalPositions,
      performance: {
        totalValue: portfolioMetrics?.totalValue || 0,
        unrealizedPnL: portfolioMetrics?.unrealizedPnL || 0,
        realizedPnL: portfolioMetrics?.realizedPnL || 0
      }
    });

    return artifact;
  }

  private buildTargetWeights(
    consensus: ConsensusRec[],
    riskProfile: string
  ): TargetWeight[] {
    const maxPositions = this.getMaxPositionsByRisk(riskProfile);
    const topConsensus = consensus.slice(0, maxPositions);

    if (topConsensus.length === 0) {
      return [];
    }

    // Equal weight distribution
    const weightPerPosition = 1 / topConsensus.length;

    return topConsensus.map(rec => ({
      symbol: rec.ticker,
      weight: weightPerPosition,
      quantity: 0, // Will be calculated during execution
      side: 'buy' // Default to buy for new positions
    }));
  }

  private getMaxPositionsByRisk(riskProfile: string): number {
    const limits = {
      averse: 5,
      neutral: 8,
      bold: 12
    };
    return limits[riskProfile as keyof typeof limits] || 8;
  }

  private async executeTrades(
    targetWeights: TargetWeight[],
    currentPositions: Position[]
  ): Promise<any[]> {
    const orders = [];

    for (const target of targetWeights) {
      const currentPosition = currentPositions.find(p => p.symbol === target.symbol);

      if (!currentPosition) {
        // New position - buy
        const orderId = await this.trading.placeOrder({
          symbol: target.symbol,
          side: 'buy',
          quantity: this.calculateQuantity(target.weight, target.symbol),
          type: 'market'
        });

        const order = await this.trading.getOrder(orderId);
        if (order) orders.push(order);
      } else {
        // Existing position - check if rebalancing needed
        const currentWeight = this.calculateCurrentWeight(currentPosition, currentPositions);
        const weightDiff = target.weight - currentWeight;

        if (Math.abs(weightDiff) > 0.05) { // 5% threshold
          const side = weightDiff > 0 ? 'buy' : 'sell';
          const quantity = Math.abs(this.calculateQuantity(Math.abs(weightDiff), target.symbol));

          const orderId = await this.trading.placeOrder({
            symbol: target.symbol,
            side,
            quantity,
            type: 'market'
          });

          const order = await this.trading.getOrder(orderId);
          if (order) orders.push(order);
        }
      }
    }

    return orders;
  }

  private calculateQuantity(weight: number, symbol: string): number {
    // Mock calculation - in real implementation would use portfolio value and current price
    const baseQuantities: Record<string, number> = {
      'BTC': 0.01,
      'ETH': 0.1,
      'ADA': 1000,
      'DOT': 10,
      'LINK': 50
    };

    const baseQty = baseQuantities[symbol] || 1;
    return baseQty * weight * 10; // Scale by weight
  }

  private calculateCurrentWeight(position: Position, allPositions: Position[]): number {
    const totalValue = allPositions.reduce((sum, p) => sum + Math.abs(p.quantity * p.avgPrice), 0);
    const positionValue = Math.abs(position.quantity * position.avgPrice);
    return totalValue > 0 ? positionValue / totalValue : 0;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async getPortfolioMetrics(): Promise<{
    totalValue: number;
    unrealizedPnL: number;
    realizedPnL: number;
  } | null> {
    try {
      // Try to get portfolio metrics from trading adapter
      if ('getPortfolioMetrics' in this.trading) {
        return await (this.trading as any).getPortfolioMetrics();
      }

      // Fallback: calculate from positions
      const positions = await this.trading.getPositions();
      const totalValue = positions.reduce((sum, pos) => sum + Math.abs(pos.quantity * pos.avgPrice), 0);
      const unrealizedPnL = positions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0);
      const realizedPnL = positions.reduce((sum, pos) => sum + pos.realizedPnL, 0);

      return { totalValue, unrealizedPnL, realizedPnL };
    } catch (error) {
      this.logger.warn('Failed to get portfolio metrics:', error);
      return null;
    }
  }

  // Public methods for monitoring and control
  getStatus(): {
    isRunning: boolean;
    killSwitchActive: boolean;
    roundId: string;
    config: SystemConfig;
  } {
    return {
      isRunning: this.isRunning,
      killSwitchActive: this.killSwitchActive,
      roundId: this.roundId,
      config: this.config
    };
  }

  async triggerKillSwitch(): Promise<void> {
    this.logger.warn('Kill switch triggered manually');
    await this.emergencyStop();
  }
}
