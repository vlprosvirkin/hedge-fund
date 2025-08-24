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
  RiskViolation,
  SignalAnalysis
} from './types/index.js';
import { AgentsService } from './services/agents.js';
import { VerifierService } from './services/verifier.js';
import { ConsensusService } from './services/consensus.js';
import { SignalProcessorService } from './services/signal-processor.service.js';
import { TelegramAdapter } from './adapters/telegram-adapter.js';
import { VaultController } from './controllers/vault.controller.js';
import { v4 as uuidv4 } from 'uuid';
import pino from 'pino';

export class HedgeFundOrchestrator {
  private logger: pino.Logger;
  private roundId: string;
  private isRunning = false;
  private killSwitchActive = false;
  private telegram: TelegramAdapter;
  private vaultController: VaultController;

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
    this.vaultController = new VaultController(this.trading, this.marketData);
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
        this.logger.error('Error in trading loop:', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          roundId: this.roundId
        });

        // Wait longer on errors to avoid spam
        await this.sleep(30000); // Wait 30 seconds before retrying
      }
    }
  }

  private async executeTradingPipeline(): Promise<PipelineArtifact> {
    const startTime = Date.now();
    const timestamp = startTime - 60000; // Use 1 minute ago as cutoff

    this.logger.info('Starting trading pipeline execution', {
      roundId: this.roundId,
      config: {
        debateInterval: this.config.debateInterval,
        riskProfile: this.config.riskProfile,
        maxPositions: this.config.maxPositions
      }
    });

    try {
      // Step 1: Get universe and market data
      this.logger.info('Step 1: Getting universe and market data');
      const universe = await this.universe.getUniverse({
        minVolume24h: 1000000,
        maxSpread: 0.5,
        minLiquidity: 0.1
      });

      this.logger.info('Universe retrieved', { universeSize: universe.length, universe });

      // 📱 Notify round start
      this.logger.info('Step 1.1: Sending Telegram notification');
      await this.telegram.postRoundStart(this.roundId, universe);

      this.logger.info('Step 1.2: Getting market stats');
      const marketStats = await Promise.all(
        universe.map(symbol => this.marketData.getMarketStats(symbol))
      );
      this.logger.info('Market stats retrieved', { marketStatsCount: marketStats.length });

      // Step 2: Get news and evidence
      this.logger.info('Step 2: Getting news and evidence');
      const news = await this.news.search('crypto bitcoin ethereum', timestamp - 3600000, timestamp);
      this.logger.info('News retrieved', { newsCount: news.length });

      this.logger.info('Step 2.1: Storing news in fact store');
      await this.factStore.putNews(news);

      this.logger.info('Step 2.2: Finding evidence for universe');
      const evidence = await Promise.all(
        universe.map(ticker =>
          this.factStore.findEvidence(ticker, { since: timestamp - 3600000, until: timestamp })
        )
      ).then(results => results.flat());
      this.logger.info('Evidence retrieved', { evidenceCount: evidence.length });

      // Step 3: Generate claims from agents
      this.logger.info('Step 3: Generating claims from agents');
      const agentRoles: Array<'fundamental' | 'sentiment' | 'valuation'> = ['fundamental', 'sentiment', 'valuation'];
      const allClaims: Claim[] = [];

      for (const role of agentRoles) {
        this.logger.info(`Step 3.${agentRoles.indexOf(role) + 1}: Running ${role} agent`);
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

        this.logger.info(`${role} agent completed`, {
          claimsGenerated: result.claims.length,
          processingTime
        });

        // 📱 Notify agent analysis completion
        await this.telegram.postAgentAnalysis(this.roundId, role, result.claims, processingTime);
      }

      this.logger.info('All agents completed', {
        totalClaims: allClaims.length,
        claimsByAgent: {
          fundamental: allClaims.filter(c => c.agentRole === 'fundamental').length,
          sentiment: allClaims.filter(c => c.agentRole === 'sentiment').length,
          valuation: allClaims.filter(c => c.agentRole === 'valuation').length
        },
        sampleClaims: allClaims.slice(0, 3).map(c => ({
          ticker: c.ticker,
          agentRole: c.agentRole,
          confidence: c.confidence,
          claim: c.claim.substring(0, 50) + '...'
        }))
      });

      // Step 4: Verify claims
      this.logger.info('Step 4: Verifying claims');
      const verifier = new VerifierService(this.factStore);
      const { verified: verifiedClaims, rejected, violations: verificationViolations } =
        await verifier.verifyClaims(allClaims, timestamp);

      this.logger.info('Claims verification completed', {
        totalClaims: allClaims.length,
        verifiedClaims: verifiedClaims.length,
        rejectedClaims: rejected.length,
        verificationViolations: verificationViolations.length,
        verificationRate: ((verifiedClaims.length / allClaims.length) * 100).toFixed(1) + '%',
        sampleVerifiedClaims: verifiedClaims.slice(0, 3).map(c => ({
          ticker: c.ticker,
          agentRole: c.agentRole,
          confidence: c.confidence
        }))
      });

      // Step 5: Advanced Signal Processing
      this.logger.info('Step 5: Advanced Signal Processing');
      const signalProcessor = new SignalProcessorService();
      const signalAnalyses = signalProcessor.processSignals(
        verifiedClaims,
        marketStats,
        this.config.riskProfile
      );

      this.logger.info('Signal processing completed', {
        totalSignals: signalAnalyses.length,
        buySignals: signalAnalyses.filter(s => s.recommendation === 'BUY').length,
        sellSignals: signalAnalyses.filter(s => s.recommendation === 'SELL').length,
        holdSignals: signalAnalyses.filter(s => s.recommendation === 'HOLD').length,
        topSignals: signalAnalyses.slice(0, 3).map(s => ({
          ticker: s.ticker,
          signal: s.overallSignal.toFixed(3),
          confidence: s.confidence.toFixed(3),
          recommendation: s.recommendation,
          riskScore: s.riskScore.toFixed(3)
        }))
      });

      // Step 5.1: Build consensus from signal analyses
      this.logger.info('Step 5.1: Building consensus from signals');
      const consensusService = new ConsensusService();
      const consensus = this.buildConsensusFromSignals(signalAnalyses, this.config.maxPositions);

      // Detect conflicts
      this.logger.info('Step 5.2: Detecting conflicts');
      const conflicts = await consensusService.detectConflicts(verifiedClaims);

      this.logger.info('Consensus building completed', {
        consensusCount: consensus.length,
        conflictsCount: conflicts.conflicts.length,
        topRecommendations: consensus.slice(0, 3).map(c => ({
          ticker: c.ticker,
          finalScore: c.finalScore,
          avgConfidence: c.avgConfidence
        }))
      });

      // 📱 Post signal processing analysis
      await this.telegram.postSignalProcessing(this.roundId, signalAnalyses, this.config.riskProfile);

      // 📱 Post agent debate details
      await this.telegram.postAgentDebate(this.roundId, conflicts.conflicts, [], {});

      // 📱 Post decision process analysis
      await this.telegram.postDecisionProcess(
        this.roundId,
        universe,
        marketStats,
        news.length,
        evidence.length,
        allClaims.length,
        verifiedClaims.length,
        rejected.length
      );

      // 📱 Notify consensus results
      await this.telegram.postConsensusResults(this.roundId, consensus, conflicts.conflicts);

      // Step 6: Build target weights
      const targetWeights = this.buildTargetWeights(consensus, signalAnalyses, this.config.riskProfile);

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

        // 📱 Post position sizing analysis
        const positionSizes = targetWeights.map(tw => ({
          ticker: tw.symbol,
          kellyFraction: 0.1, // Placeholder - would be calculated in real implementation
          conservativeKelly: 0.05,
          finalPosition: tw.weight,
          riskPenalty: 0.2,
          confidenceAdjustment: 0.8
        }));

        const marketImpact = targetWeights.map(tw => ({
          ticker: tw.symbol,
          slippage: 0.001,
          marketImpact: 0.0005,
          orderSize: 1000,
          dailyVolume: 1000000,
          maxOrderSize: 50000
        }));

        await this.telegram.postPositionSizingAnalysis(this.roundId, positionSizes, marketImpact);

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
    } catch (error) {
      this.logger.error('Error in executeTradingPipeline:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        roundId: this.roundId,
        step: 'executeTradingPipeline'
      });

      // Log the full error for debugging
      console.error('Full error details:', error);
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
      }

      throw error;
    }
  }

  private buildTargetWeights(
    consensus: ConsensusRec[],
    signalAnalyses: SignalAnalysis[],
    riskProfile: string
  ): TargetWeight[] {
    const maxPositions = this.getMaxPositionsByRisk(riskProfile);

    // Use signal analyses for more sophisticated weight calculation
    const qualifiedSignals = signalAnalyses
      .filter(signal => signal.recommendation !== 'HOLD' && signal.confidence >= 0.5)
      .slice(0, maxPositions);

    this.logger.info('🎯 Building target weights from signal analyses', {
      riskProfile,
      maxPositions,
      totalSignals: signalAnalyses.length,
      qualifiedSignals: qualifiedSignals.length,
      minConfidence: 0.5,
      topSignals: qualifiedSignals.map(s => ({
        ticker: s.ticker,
        signal: s.overallSignal.toFixed(3),
        confidence: s.confidence.toFixed(3),
        recommendation: s.recommendation,
        positionSize: s.positionSize.toFixed(3)
      }))
    });

    if (qualifiedSignals.length === 0) {
      this.logger.warn('⚠️ No qualified signals found (min confidence: 50%)');
      return [];
    }

    // Calculate portfolio-optimized weights
    const targetWeights = this.calculatePortfolioWeights(qualifiedSignals, riskProfile);

    this.logger.info('📊 Portfolio-optimized target weights calculated', {
      totalWeight: targetWeights.reduce((sum, tw) => sum + tw.weight, 0).toFixed(3),
      targetWeights: targetWeights.map(tw => ({
        symbol: tw.symbol,
        weight: tw.weight.toFixed(3),
        side: tw.side
      }))
    });

    return targetWeights;
  }

  /**
   * Calculate portfolio-optimized weights using risk-adjusted returns
   */
  private calculatePortfolioWeights(
    signals: SignalAnalysis[],
    riskProfile: string
  ): TargetWeight[] {
    // Calculate risk-adjusted returns for each signal
    const riskAdjustedReturns = signals.map(signal => ({
      ticker: signal.ticker,
      expectedReturn: this.calculateExpectedReturn(signal),
      volatility: this.calculateVolatility(signal),
      riskAdjustedReturn: this.calculateRiskAdjustedReturn(signal),
      positionSize: signal.positionSize,
      recommendation: signal.recommendation
    }));

    // Sort by risk-adjusted return (Sharpe ratio)
    riskAdjustedReturns.sort((a, b) => b.riskAdjustedReturn - a.riskAdjustedReturn);

    // Calculate correlation-adjusted weights
    const correlationAdjustedWeights = this.applyCorrelationAdjustment(riskAdjustedReturns);

    // Apply portfolio constraints
    const constrainedWeights = this.applyPortfolioConstraints(correlationAdjustedWeights, riskProfile);

    // Convert to target weights format
    return constrainedWeights.map(weight => ({
      symbol: weight.ticker,
      weight: weight.finalWeight,
      quantity: 0, // Will be calculated during execution
      side: weight.recommendation.toLowerCase() as 'buy' | 'sell' | 'hold'
    }));
  }

  /**
   * Calculate expected return for a signal
   */
  private calculateExpectedReturn(signal: SignalAnalysis): number {
    // Base expected return from signal strength
    const baseReturn = signal.overallSignal * 0.15; // 15% max expected return

    // Adjust for confidence
    const confidenceMultiplier = 0.5 + (signal.confidence * 0.5);

    // Adjust for time horizon
    const timeHorizonMultiplier = this.getTimeHorizonMultiplier(signal.timeHorizon);

    return baseReturn * confidenceMultiplier * timeHorizonMultiplier;
  }

  /**
   * Calculate volatility for a signal
   */
  private calculateVolatility(signal: SignalAnalysis): number {
    // Use signal volatility as base
    let volatility = signal.volatility;

    // Adjust for market conditions
    if (signal.riskScore > 0.7) {
      volatility *= 1.5; // Higher risk = higher volatility
    }

    // Adjust for time horizon
    const timeHorizonVolatility = this.getTimeHorizonVolatility(signal.timeHorizon);
    volatility = Math.max(volatility, timeHorizonVolatility);

    return volatility;
  }

  /**
   * Calculate risk-adjusted return (Sharpe ratio)
   */
  private calculateRiskAdjustedReturn(signal: SignalAnalysis): number {
    const expectedReturn = this.calculateExpectedReturn(signal);
    const volatility = this.calculateVolatility(signal);

    // Risk-free rate (assume 2% annual)
    const riskFreeRate = 0.02 / 365; // Daily risk-free rate

    // Sharpe ratio = (Return - RiskFreeRate) / Volatility
    return (expectedReturn - riskFreeRate) / Math.max(volatility, 0.01);
  }

  /**
   * Apply correlation adjustment to reduce portfolio risk
   */
  private applyCorrelationAdjustment(signals: any[]): any[] {
    // Simple correlation penalty for similar assets
    const adjustedSignals = signals.map((signal, index) => {
      let correlationPenalty = 1.0;

      // Apply penalty for crypto assets (assume high correlation)
      const cryptoAssets = ['BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'DOT', 'AVAX'];
      const isCrypto = cryptoAssets.some(asset => signal.ticker.includes(asset));

      if (isCrypto) {
        // Count how many crypto assets are already in portfolio
        const cryptoCount = signals.slice(0, index).filter(s =>
          cryptoAssets.some(asset => s.ticker.includes(asset))
        ).length;

        // Apply correlation penalty
        correlationPenalty = Math.pow(0.8, cryptoCount); // 20% penalty per crypto asset
      }

      return {
        ...signal,
        correlationPenalty,
        adjustedReturn: signal.riskAdjustedReturn * correlationPenalty
      };
    });

    return adjustedSignals;
  }

  /**
   * Apply portfolio constraints
   */
  private applyPortfolioConstraints(signals: any[], riskProfile: string): any[] {
    const maxPositions = this.getMaxPositionsByRisk(riskProfile);
    const maxWeightPerPosition = this.getMaxWeightPerPosition(riskProfile);

    // Take top signals up to max positions
    const topSignals = signals.slice(0, maxPositions);

    // Calculate total weight
    const totalWeight = topSignals.reduce((sum, signal) =>
      sum + signal.positionSize * signal.correlationPenalty, 0);

    // Normalize weights and apply constraints
    return topSignals.map(signal => {
      let weight = (signal.positionSize * signal.correlationPenalty) / totalWeight;

      // Apply maximum weight constraint
      weight = Math.min(weight, maxWeightPerPosition);

      return {
        ...signal,
        finalWeight: weight
      };
    });
  }

  /**
   * Get time horizon multiplier for expected returns
   */
  private getTimeHorizonMultiplier(timeHorizon: string): number {
    const multipliers = {
      short: 0.7,   // Lower returns for short-term trades
      medium: 1.0,  // Base returns for medium-term
      long: 1.3     // Higher returns for long-term investments
    };

    return multipliers[timeHorizon as keyof typeof multipliers] || 1.0;
  }

  /**
   * Get time horizon volatility
   */
  private getTimeHorizonVolatility(timeHorizon: string): number {
    const volatilities = {
      short: 0.4,   // Higher volatility for short-term
      medium: 0.25, // Medium volatility
      long: 0.15    // Lower volatility for long-term
    };

    return volatilities[timeHorizon as keyof typeof volatilities] || 0.25;
  }

  /**
   * Get maximum weight per position by risk profile
   */
  private getMaxWeightPerPosition(riskProfile: string): number {
    const maxWeights = {
      averse: 0.15,  // 15% max per position for risk-averse
      neutral: 0.25, // 25% max per position for neutral
      bold: 0.40     // 40% max per position for bold
    };

    return maxWeights[riskProfile as keyof typeof maxWeights] || 0.25;
  }

  private buildConsensusFromSignals(signalAnalyses: SignalAnalysis[], maxPositions: number): ConsensusRec[] {
    // Convert signal analyses to consensus records
    const consensus: ConsensusRec[] = signalAnalyses
      .filter(analysis => analysis.recommendation !== 'HOLD' || analysis.overallSignal > 0.2) // Filter out weak holds
      .slice(0, maxPositions)
      .map(analysis => ({
        ticker: analysis.ticker,
        avgConfidence: analysis.confidence,
        coverage: 1.0, // All signals have full coverage
        liquidity: 1.0 - analysis.riskScore, // Higher risk = lower liquidity
        finalScore: analysis.overallSignal * analysis.confidence * (1 - analysis.riskScore),
        claims: [] // Will be populated later if needed
      }));

    return consensus.sort((a, b) => b.finalScore - a.finalScore);
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
    try {
      // Get available USDT balance
      const accountInfo = await (this.trading as any).getAccountInfo();
      const availableUsdt = accountInfo.balances.find((b: any) => b.asset === 'USDT')?.free || 0;

      this.logger.info('💰 Available USDT for trading', { availableUsdt });

      // Calculate rebalancing orders using VaultController
      const rebalancingOrders = await this.vaultController.calculateRebalancingOrders(
        targetWeights.map(tw => ({ symbol: tw.symbol, weight: tw.weight })),
        availableUsdt
      );

      this.logger.info('📊 Rebalancing orders calculated', {
        totalOrders: rebalancingOrders.length,
        orders: rebalancingOrders.map(o => ({
          symbol: o.symbol,
          side: o.side,
          quantity: o.quantity,
          usdtAmount: o.usdtAmount
        }))
      });

      // Execute rebalancing orders
      const orderIds = await this.vaultController.executeRebalancing(rebalancingOrders);

      this.logger.info('✅ Trade execution completed', {
        totalOrders: orderIds.length,
        orderIds
      });

      return orderIds;
    } catch (error) {
      this.logger.error('Failed to execute trades:', error);
      throw error;
    }
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
