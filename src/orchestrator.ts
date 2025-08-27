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
  SignalAnalysis,
  NewsItem,
  Evidence
} from './types/index.js';
import { AgentsService } from './services/agents.js';
import { VerifierService } from './services/verifier.js';
import { ConsensusService } from './services/consensus.js';
import { SignalProcessorService } from './services/signal-processor.service.js';
import { TelegramAdapter } from './adapters/telegram-adapter.js';
import { NotificationsService } from './services/notifications.service.js';
import { TechnicalIndicatorsAdapter } from './adapters/technical-indicators-adapter.js';
import { VaultController } from './controllers/vault.controller.js';
import { v4 as uuidv4 } from 'uuid';
import pino from 'pino';

export class HedgeFundOrchestrator {
  private logger: pino.Logger;
  private roundId: string;
  private isRunning = false;
  private killSwitchActive = false;
  private telegram: TelegramAdapter;
  private notifications: NotificationsService;
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
    private technicalIndicators: TechnicalIndicatorsAdapter,
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
    this.notifications = new NotificationsService(this.telegram);
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
    await this.notifications.postEmergencyAlert('kill_switch', 'Emergency stop triggered - all trading operations halted');

    try {
      await this.trading.emergencyClose();
      await this.disconnectServices();
    } catch (error) {
      this.logger.error('Error during emergency stop:', error);
      await this.notifications.postEmergencyAlert('api_failure', `Emergency stop failed: ${error}`);
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

  public async executeTradingPipeline(): Promise<PipelineArtifact> {
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

      // Start round in database
      this.logger.info('Step 1.1: Starting round in database');
      await this.factStore.startRound(this.roundId);
      this.logger.info('✅ Round started successfully in database');

      // 📱 Notify round start
      this.logger.info('Step 1.2: Sending Telegram notification');
      await this.notifications.postRoundStart(this.roundId, universe);

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
      this.logger.info('✅ News stored successfully', { newsCount: news.length });

      this.logger.info('Step 2.2: Creating evidence from multiple sources');

      // Get market stats and technical data
      const marketStatsData = await Promise.all(
        universe.map(symbol => this.marketData.getMarketStats(symbol))
      );
      const technicalData = await Promise.all(
        universe.map(async (ticker) => {
          try {
            const data = await this.technicalIndicators.getTechnicalIndicators(ticker, '4h');
            return { symbol: ticker, ...data };
          } catch (error) {
            console.warn(`Failed to get technical data for ${ticker}:`, error);
            return { symbol: ticker, rsi: 50, macd: 0, adx: 25 };
          }
        })
      );

      // Create evidence for each agent type
      const newsEvidence = this.createEvidenceFromNews(news, universe, timestamp);
      const marketEvidence = this.createEvidenceFromMarketStats(marketStatsData, universe, timestamp);
      const technicalEvidence = this.createEvidenceFromTechnicalData(technicalData, universe, timestamp);

      // Combine all evidence
      const evidence = [...newsEvidence, ...marketEvidence, ...technicalEvidence];
      this.logger.info('Evidence created', {
        newsEvidence: newsEvidence.length,
        marketEvidence: marketEvidence.length,
        technicalEvidence: technicalEvidence.length,
        totalEvidence: evidence.length
      });

      // Store evidence in database
      this.logger.info('Step 2.3: Storing evidence in database');
      await this.factStore.putEvidence(evidence);
      this.logger.info('✅ Evidence stored successfully', { evidenceCount: evidence.length });

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

        // Log detailed agent results
        this.logger.info(`${role} agent detailed results`, {
          claimsCount: result.claims.length,
          openaiResponseLength: result.openaiResponse?.length || 0,
          analysisLength: result.analysis?.length || 0,
          sampleClaims: result.claims.slice(0, 2).map(c => ({
            ticker: c.ticker,
            confidence: c.confidence,
            claim: c.claim.substring(0, 30) + '...',
            evidenceCount: c.evidence?.length || 0
          }))
        });

        // Log evidence and news data for debugging
        console.log(`🔍 Orchestrator: ${role} agent - Evidence count: ${evidence?.length || 0}, News count: ${news?.length || 0}`);
        if (evidence && evidence.length > 0) {
          console.log(`🔍 Orchestrator: ${role} agent - Sample evidence:`, evidence.slice(0, 2));
        }
        if (news && news.length > 0) {
          console.log(`🔍 Orchestrator: ${role} agent - Sample news:`, news.slice(0, 2).map(n => ({ id: n.id, title: n.title?.substring(0, 50) })));
        }

        // Log raw OpenAI response for debugging
        if (result.openaiResponse) {
          console.log(`🔍 Orchestrator: ${role} agent - Raw OpenAI response length: ${result.openaiResponse.length} chars`);
          console.log(`🔍 Orchestrator: ${role} agent - Raw OpenAI response preview: ${result.openaiResponse.substring(0, 200)}...`);
        }

        // 📱 Complete agent analysis in one message
        await this.notifications.postAgentCompleteAnalysis(
          this.roundId,
          role,
          result.claims,
          (result as any).textPart || result.analysis || '', // Use textPart for better analysis
          evidence,
          {
            universe,
            marketStats,
            facts: evidence,
            news,
            riskProfile: this.config.riskProfile,
            timestamp
          }
        );
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

      // Store claims in database
      this.logger.info('Step 3.4: Storing claims in database');
      await this.factStore.storeClaims(allClaims, this.roundId);
      this.logger.info('✅ Claims stored successfully', { claimsCount: allClaims.length });

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
          confidence: c.confidence,
          evidenceCount: c.evidence?.length || 0
        }))
      });

      // Log rejected claims for debugging
      if (rejected.length > 0) {
        this.logger.warn('Rejected claims:', {
          rejectedClaims: rejected.map(c => ({
            ticker: c.ticker,
            agentRole: c.agentRole,
            claim: c.claim.substring(0, 50) + '...',
            evidenceCount: c.evidence?.length || 0
          }))
        });
      }

      // Step 5: Advanced Signal Processing
      this.logger.info('Step 5: Advanced Signal Processing');

      // Collect technical data for signal processing
      const technicalDataMap = new Map<string, any>();
      for (const ticker of universe) {
        try {
          const technicalData = await this.technicalIndicators.getTechnicalIndicators(ticker, '4h');
          technicalDataMap.set(ticker, technicalData);
        } catch (error) {
          console.warn(`Failed to get technical data for ${ticker}:`, error);
        }
      }

      const signalProcessor = new SignalProcessorService();
      const signalAnalyses = signalProcessor.processSignals(
        verifiedClaims,
        marketStats,
        this.config.riskProfile,
        technicalDataMap
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
      await this.notifications.postSignalAnalysis(this.roundId, signalAnalyses, this.config.riskProfile);

      // 📱 Post agent debate details
      this.logger.info('Debug consensus data:', {
        consensusLength: consensus.length,
        consensusData: consensus,
        conflicts: conflicts.conflicts
      });

      if (consensus.length > 0 && consensus[0]) {
        const firstConsensus = consensus[0];
        this.logger.info('First consensus data:', firstConsensus);

        const consensusSummary = {
          decision: firstConsensus.finalScore > 0.1 ? 'BUY' : firstConsensus.finalScore < -0.1 ? 'SELL' : 'HOLD',
          confidence: firstConsensus.avgConfidence || 0.5, // Use actual agent confidence, not finalScore
          agreement: firstConsensus.avgConfidence || 0.5,
          rationale: `Consensus reached for ${firstConsensus.ticker} with score ${(firstConsensus.finalScore || 0).toFixed(3)}`
        };

        this.logger.info('Consensus summary:', consensusSummary);
        // 📱 Show consensus process
        await this.notifications.postAgentDebate(this.roundId, conflicts.conflicts, [], consensusSummary);
      } else {
        this.logger.warn('No consensus data available, using fallback');
        // 📱 Show consensus process (fallback)
        await this.notifications.postAgentDebate(this.roundId, conflicts.conflicts, [], {
          decision: 'HOLD',
          confidence: 0.2,
          agreement: 0.2,
          rationale: 'No consensus reached - insufficient data'
        });
      }

      // Disabled: Too many messages
      // 📱 Post decision process analysis
      // await this.notifications.postDecisionProcess(
      //   this.roundId,
      //   universe,
      //   marketStats,
      //   news.length,
      //   evidence.length,
      //   allClaims.length,
      //   verifiedClaims.length,
      //   rejected.length
      // );

      // Disabled: Too many messages
      // 📱 Notify consensus results
      // await this.notifications.postConsensusResults(this.roundId, consensus, conflicts.conflicts);

      // Store consensus in database
      this.logger.info('Step 5.3: Storing consensus in database');
      await this.factStore.storeConsensus(consensus, this.roundId);
      this.logger.info('✅ Consensus stored successfully', { consensusCount: consensus.length });

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

      // Disabled: Too many messages
      // 📱 Notify risk assessment
      // await this.notifications.postRiskAssessment(this.roundId, {
      //   ok: riskCheck.ok,
      //   violations: riskCheck.violations,
      //   warnings: []
      // });

      // Step 8: Execute trades (if risk check passes)
      const orders = [];
      if (riskCheck.ok && !this.killSwitchActive) {
        const executionOrders = await this.executeTrades(targetWeights, currentPositions);

        // Store orders in database
        this.logger.info('Step 8.1: Storing orders in database');
        await this.factStore.storeOrders(executionOrders, this.roundId);
        this.logger.info('✅ Orders stored successfully', { ordersCount: executionOrders.length });
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

        // Disabled: Too many messages
        // await this.notifications.postPositionSizingAnalysis(this.roundId, positionSizes, marketImpact);

        // Disabled: Too many messages
        // 📱 Notify order execution
        // await this.notifications.postOrderExecution(this.roundId, orders, updatedPositions);

        // 📱 Portfolio summary and transactions
        const totalValue = updatedPositions.reduce((sum, pos) => sum + (pos.quantity * pos.avgPrice), 0);
        await this.notifications.postPortfolioSummary(
          this.roundId,
          {
            totalValue: totalValue,
            pnl: 0, // Placeholder - would need to calculate from historical data
            targetAllocation: 0.8
          },
          [], // transactions
          orders
        );
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

      // 📱 Send enhanced round summary
      await this.notifications.postRoundCompletion(this.roundId, {
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

      // End round in database
      this.logger.info('Step 8.2: Ending round in database');
      await this.factStore.endRound(this.roundId, 'completed', verifiedClaims.length, orders.length, portfolioMetrics?.unrealizedPnL || 0);
      this.logger.info('✅ Round ended successfully in database');

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
      .filter(analysis => analysis.overallSignal > -0.5) // Include all signals except very negative ones
      .slice(0, maxPositions)
      .map(analysis => ({
        ticker: analysis.ticker,
        avgConfidence: analysis.confidence,
        coverage: 1.0, // All signals have full coverage
        liquidity: 1.0 - analysis.riskScore, // Higher risk = lower liquidity
        finalScore: analysis.overallSignal * analysis.confidence * (1 - analysis.riskScore),
        claims: [] // Will be populated later if needed
      }));

    console.log(`🤝 buildConsensusFromSignals: Created ${consensus.length} consensus records from ${signalAnalyses.length} signal analyses`);
    return consensus.sort((a, b) => b.finalScore - a.finalScore);
  }

  private createEvidenceFromNews(news: NewsItem[], universe: string[], timestamp: number): any[] {
    const evidence: any[] = [];

    for (const newsItem of news) {
      // Check if news is relevant to any ticker in universe
      const relevantTickers = universe.filter(ticker => {
        const tickerLower = ticker.toLowerCase();
        const titleLower = newsItem.title?.toLowerCase() || '';
        const descriptionLower = newsItem.description?.toLowerCase() || '';

        return titleLower.includes(tickerLower) || descriptionLower.includes(tickerLower);
      });

      if (relevantTickers.length > 0) {
        // Create evidence for each relevant ticker
        for (const ticker of relevantTickers) {
          const relevance = this.calculateRelevance(newsItem, ticker);

          evidence.push({
            ticker,
            kind: 'news',
            source: newsItem.source || 'unknown',
            url: newsItem.url || '',
            snippet: newsItem.title || newsItem.description || '',
            publishedAt: new Date(newsItem.publishedAt).toISOString(),
            relevance,
            impact: newsItem.sentiment || 0,
            confidence: 0.8
          });
        }
      } else {
        // Create GLOBAL evidence for market-wide news
        evidence.push({
          ticker: 'GLOBAL',
          kind: 'news',
          source: newsItem.source || 'unknown',
          url: newsItem.url || '',
          snippet: newsItem.title || newsItem.description || '',
          publishedAt: new Date(newsItem.publishedAt).toISOString(),
          relevance: 0.7,
          impact: newsItem.sentiment || 0,
          confidence: 0.8
        });
      }
    }

    return evidence;
  }

  private createEvidenceFromMarketStats(marketStats: any[], universe: string[], timestamp: number): any[] {
    const evidence: any[] = [];

    for (const stat of marketStats) {
      if (universe.includes(stat.symbol)) {
        // Create multiple market evidence items for different metrics
        const metrics = [
          { name: 'vol24h', value: stat.volume24h || 0 },
          { name: 'spread_bps', value: stat.spread || 0 },
          { name: 'ohlcv_close', value: stat.price || 0 }
        ];

        for (const metric of metrics) {
          if (metric.value > 0) {
            evidence.push({
              ticker: stat.symbol,
              kind: 'market',
              source: 'binance',
              metric: metric.name,
              value: metric.value,
              observedAt: new Date(timestamp).toISOString(),
              relevance: 0.9,
              impact: 0,
              confidence: 0.95
            });
          }
        }
      }
    }

    return evidence;
  }

  private createEvidenceFromTechnicalData(technicalData: any[], universe: string[], timestamp: number): any[] {
    const evidence: any[] = [];

    for (const data of technicalData) {
      if (universe.includes(data.symbol)) {
        // Create technical evidence for each indicator
        const indicators = [
          { name: 'RSI(14,4h)', value: data.rsi },
          { name: 'MACD(12,26,9,4h)', value: data.macd },
          { name: 'ADX(14,4h)', value: data.adx }
        ];

        for (const indicator of indicators) {
          if (indicator.value !== undefined && !isNaN(indicator.value)) {
            evidence.push({
              ticker: data.symbol,
              kind: 'tech',
              source: 'indicators',
              metric: indicator.name,
              value: indicator.value,
              observedAt: new Date(timestamp).toISOString(),
              relevance: 0.85,
              impact: 0,
              confidence: 0.9
            });
          }
        }
      }
    }

    return evidence;
  }

  private calculateRelevance(newsItem: NewsItem, ticker: string): number {
    let relevance = 0.5; // Base relevance

    const tickerLower = ticker.toLowerCase();
    const titleLower = newsItem.title?.toLowerCase() || '';
    const descriptionLower = newsItem.description?.toLowerCase() || '';

    // Increase relevance if ticker appears in title
    if (titleLower.includes(tickerLower)) {
      relevance += 0.3;
    }

    // Increase relevance if ticker appears in description
    if (descriptionLower.includes(tickerLower)) {
      relevance += 0.2;
    }

    // Increase relevance based on sentiment
    if (newsItem.sentiment) {
      relevance += Math.abs(newsItem.sentiment) * 0.1;
    }

    // Cap relevance at 1.0
    return Math.min(relevance, 1.0);
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

      // Convert order IDs to Order objects for database storage
      const orders = rebalancingOrders.map((order, index) => ({
        id: orderIds[index] || `order_${Date.now()}_${index}`,
        symbol: order.symbol,
        side: order.side,
        type: order.type,
        quantity: order.usdtAmount,
        price: order.price || 0,
        status: 'filled',
        timestamp: Date.now()
      }));

      return orders;
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
        const metrics = await (this.trading as any).getPortfolioMetrics();
        console.log(`📊 Portfolio metrics from trading adapter:`, metrics);
        return metrics;
      }

      // Fallback: calculate from positions with real-time prices
      const positions = await this.trading.getPositions();
      let totalValue = 0;
      let unrealizedPnL = 0;
      let realizedPnL = 0;

      for (const position of positions) {
        try {
          // Get current price for accurate calculation
          const currentPrice = await (this.trading as any).getPrice(position.symbol);
          const positionValue = position.quantity * currentPrice;
          const positionPnL = position.quantity * (currentPrice - position.avgPrice);

          totalValue += positionValue;
          unrealizedPnL += positionPnL;
          realizedPnL += position.realizedPnL || 0;
        } catch (error) {
          // If price fetch fails, use avgPrice as fallback
          const positionValue = position.quantity * position.avgPrice;
          totalValue += positionValue;
          unrealizedPnL += position.unrealizedPnL || 0;
          realizedPnL += position.realizedPnL || 0;
        }
      }

      const result = { totalValue, unrealizedPnL, realizedPnL };
      console.log(`📊 Portfolio metrics calculated from positions:`, result);
      return result;
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
