import { BaseAgent, type AgentContext, type AgentResponse } from './base-agent.js';
import { AgentFactory } from './agent-factory.js';
import type { Claim } from '../types/index.js';
import { TechnicalIndicatorsAdapter } from '../adapters/technical-indicators-adapter.js';
import { TechnicalAnalysisService } from '../services/technical-analysis.service.js';

export interface DebateRound {
  round: number;
  agentClaims: Map<string, Claim[]>;
  conflicts: string[];
  consensus: Map<string, Claim>;
}

export interface ConsensusResult {
  ticker: string;
  finalAction: 'BUY' | 'HOLD' | 'SELL';
  finalScore: number;
  buyScore: number;
  sellScore: number;
  holdScore: number;
  confidence: number;
  rationale: string;
}

export class AgentCoordinator {
  private agents: BaseAgent[] = [];
  private maxDebateRounds = 3;
  private consensusThreshold = 0.7;
  private technicalIndicators: TechnicalIndicatorsAdapter;
  private technicalAnalysis: TechnicalAnalysisService;

  constructor(
    technicalIndicators?: TechnicalIndicatorsAdapter,
    technicalAnalysis?: TechnicalAnalysisService
  ) {
    this.technicalIndicators = technicalIndicators || new TechnicalIndicatorsAdapter();
    this.technicalAnalysis = technicalAnalysis || new TechnicalAnalysisService();
  }

  private async ensureAgents(): Promise<BaseAgent[]> {
    if (this.agents.length === 0) {
      this.agents = await AgentFactory.getAllAgents(this.technicalIndicators, this.technicalAnalysis);
    }
    return this.agents;
  }

  async runCollaboration(context: AgentContext): Promise<{
    claims: Claim[];
    consensus: ConsensusResult[];
    debateLog: DebateRound[];
    errors: string[];
    openaiResponse?: string;
    analysis?: string;
  }> {
    const errors: string[] = [];
    const allClaims: Claim[] = [];
    const debateLog: DebateRound[] = [];
    let combinedOpenAIResponse = '';
    let combinedAnalysis = '';

    try {
      // Step 1: Initial analysis by all agents
      console.log('🤖 Starting multi-agent collaboration...');

      const agents = await this.ensureAgents();
      const agentResponses = await Promise.all(
        agents.map(async (agent) => {
          try {
            const response = await agent.run(context);
            console.log(`✅ ${agent.constructor.name} completed with ${response.claims.length} claims`);
            return response;
          } catch (error) {
            const errorMsg = `Failed to run ${agent.constructor.name}: ${error}`;
            console.error(errorMsg);
            errors.push(errorMsg);
            return { claims: [], errors: [errorMsg] };
          }
        })
      );

      // Collect all claims and reasoning
      let combinedOpenAIResponse = '';
      let combinedAnalysis = '';

      agentResponses.forEach(response => {
        allClaims.push(...response.claims);
        if (response.openaiResponse) {
          combinedOpenAIResponse += response.openaiResponse + '\n\n';
        }
        if (response.analysis) {
          combinedAnalysis += response.analysis + '\n\n';
        }
      });

      // Step 2: Organize claims by ticker and agent
      const claimsByTicker = this.organizeClaimsByTicker(allClaims);

      // Step 3: Detect conflicts and run debates
      const conflicts = this.detectConflicts(claimsByTicker);

      if (conflicts.length > 0) {
        console.log(`🔍 Detected ${conflicts.length} conflicts, starting debate rounds...`);

        for (let round = 1; round <= this.maxDebateRounds; round++) {
          const debateRound = await this.runDebateRound(round, conflicts, context);
          debateLog.push(debateRound);

          // Check if consensus reached
          const remainingConflicts = this.detectConflicts(claimsByTicker);
          if (remainingConflicts.length === 0) {
            console.log(`✅ Consensus reached after ${round} debate rounds`);
            break;
          }
        }
      }

      // Step 4: Build final consensus
      const consensus = this.buildConsensus(claimsByTicker);

      console.log(`🎯 Collaboration completed: ${allClaims.length} claims, ${consensus.length} consensus decisions`);

      return {
        claims: allClaims,
        consensus,
        debateLog,
        errors,
        openaiResponse: combinedOpenAIResponse,
        analysis: combinedAnalysis
      };

    } catch (error) {
      const errorMsg = `Collaboration failed: ${error}`;
      console.error(errorMsg);
      errors.push(errorMsg);

      return {
        claims: allClaims,
        consensus: [],
        debateLog,
        errors,
        openaiResponse: combinedOpenAIResponse,
        analysis: combinedAnalysis
      };
    }
  }

  private organizeClaimsByTicker(claims: Claim[]): Map<string, Map<string, Claim>> {
    const organized = new Map<string, Map<string, Claim>>();

    for (const claim of claims) {
      if (!organized.has(claim.ticker)) {
        organized.set(claim.ticker, new Map());
      }

      const tickerClaims = organized.get(claim.ticker)!;
      tickerClaims.set(claim.agentRole, claim);
    }

    return organized;
  }

  private detectConflicts(claimsByTicker: Map<string, Map<string, Claim>>): string[] {
    const conflicts: string[] = [];

    for (const [ticker, agentClaims] of claimsByTicker) {
      const actions = Array.from(agentClaims.values()).map(claim => claim.claim);
      const uniqueActions = new Set(actions);

      if (uniqueActions.size > 1) {
        conflicts.push(ticker);
      }
    }

    return conflicts;
  }

  private async runDebateRound(
    round: number,
    conflicts: string[],
    context: AgentContext
  ): Promise<DebateRound> {
    console.log(`🗣️ Debate Round ${round}: ${conflicts.length} conflicts to resolve`);

    const agentClaims = new Map<string, Claim[]>();
    const consensus = new Map<string, Claim>();

    // For now, implement a simple conflict resolution
    // In a full implementation, this would involve agents seeing each other's arguments
    for (const ticker of conflicts) {
      // Simple conflict resolution: take the highest confidence claim
      const claims = Array.from(context.universe).map(t => {
        // Mock claims for demonstration
        return {
          id: `debate-${round}-${ticker}`,
          ticker,
          agentRole: 'fundamental' as const,
          claim: 'HOLD' as const,
          confidence: 0.5,
          evidence: [],
          timestamp: context.timestamp,
          riskFlags: []
        };
      });

      agentClaims.set(ticker, claims);

      // Simple consensus: HOLD with medium confidence
      consensus.set(ticker, {
        id: `consensus-${round}-${ticker}`,
        ticker,
        agentRole: 'fundamental',
        claim: 'HOLD',
        confidence: 0.6,
        evidence: [],
        timestamp: context.timestamp,
        riskFlags: []
      });
    }

    return {
      round,
      agentClaims,
      conflicts,
      consensus
    };
  }

  private buildConsensus(claimsByTicker: Map<string, Map<string, Claim>>): ConsensusResult[] {
    const consensus: ConsensusResult[] = [];

    for (const [ticker, agentClaims] of claimsByTicker) {
      const fundamental = agentClaims.get('fundamental');
      const sentiment = agentClaims.get('sentiment');
      const valuation = agentClaims.get('valuation');

      // Calculate weighted consensus with confidence-based scoring
      const weights = { fundamental: 0.3, sentiment: 0.3, valuation: 0.4 };
      let finalScore = 0;
      let totalWeight = 0;
      let buyScore = 0;
      let sellScore = 0;
      let holdScore = 0;

      // Process each agent's claim with confidence weighting
      if (fundamental) {
        const weight = weights.fundamental * fundamental.confidence;
        finalScore += fundamental.confidence * weights.fundamental;
        totalWeight += weight;

        if (fundamental.claim === 'BUY') buyScore += weight;
        else if (fundamental.claim === 'SELL') sellScore += weight;
        else holdScore += weight;
      }

      if (sentiment) {
        const weight = weights.sentiment * sentiment.confidence;
        finalScore += sentiment.confidence * weights.sentiment;
        totalWeight += weight;

        if (sentiment.claim === 'BUY') buyScore += weight;
        else if (sentiment.claim === 'SELL') sellScore += weight;
        else holdScore += weight;
      }

      if (valuation) {
        const weight = weights.valuation * valuation.confidence;
        finalScore += valuation.confidence * weights.valuation;
        totalWeight += weight;

        if (valuation.claim === 'BUY') buyScore += weight;
        else if (valuation.claim === 'SELL') sellScore += weight;
        else holdScore += weight;
      }

      // Normalize scores
      if (totalWeight > 0) {
        buyScore /= totalWeight;
        sellScore /= totalWeight;
        holdScore /= totalWeight;
      }

      // Determine final action based on weighted scores and confidence thresholds
      let finalAction: 'BUY' | 'HOLD' | 'SELL' = 'HOLD';
      const confidenceThreshold = 0.4; // Minimum confidence to make a decision
      const actionThreshold = 0.3; // Minimum score difference to choose action

      if (finalScore >= confidenceThreshold) {
        if (buyScore > sellScore && buyScore > holdScore && (buyScore - Math.max(sellScore, holdScore)) > actionThreshold) {
          finalAction = 'BUY';
        } else if (sellScore > buyScore && sellScore > holdScore && (sellScore - Math.max(buyScore, holdScore)) > actionThreshold) {
          finalAction = 'SELL';
        }
        // Otherwise, keep HOLD
      }

      const rationale = this.generateRationale(fundamental, sentiment, valuation, finalAction);

      consensus.push({
        ticker,
        finalAction,
        finalScore,
        buyScore,
        sellScore,
        holdScore,
        confidence: finalScore,
        rationale
      });
    }

    return consensus;
  }

  private generateRationale(
    fundamental: Claim | undefined,
    sentiment: Claim | undefined,
    valuation: Claim | undefined,
    finalAction: string
  ): string {
    const reasons: string[] = [];

    if (fundamental && fundamental.confidence > 0.6) {
      reasons.push(`Fundamental analysis: ${fundamental.claim} (${(fundamental.confidence * 100).toFixed(0)}% confidence)`);
    }

    if (sentiment && sentiment.confidence > 0.6) {
      reasons.push(`Sentiment analysis: ${sentiment.claim} (${(sentiment.confidence * 100).toFixed(0)}% confidence)`);
    }

    if (valuation && valuation.confidence > 0.6) {
      reasons.push(`Technical analysis: ${valuation.claim} (${(valuation.confidence * 100).toFixed(0)}% confidence)`);
    }

    if (reasons.length === 0) {
      return `Consensus: ${finalAction} - Limited data available`;
    }

    return `Consensus: ${finalAction} - ${reasons.join(', ')}`;
  }

  private buildGroupChatPrompt(): string {
    return `You are the Group Chat Coordinator for a multi-agent investment analysis system.

ROLE: Coordinate specialized agents to reach consensus on investment decisions through collaboration and debate.

AGENTS:
- Fundamental Agent: Analyzes market fundamentals, liquidity, volatility, trend sustainability
- Sentiment Agent: Analyzes news sentiment using SUMMARIZE → REFLECT → REVISE → AGGREGATE process
- Valuation Agent: Analyzes technical indicators using mathematical tools (volatility, Sharpe-proxy, momentum)

COLLABORATION PROCESS:
1. Each agent provides their analysis for each ticker with confidence scores
2. If agents disagree (≥2 different actions), initiate debate round
3. During debate, agents see others' arguments and can revise positions
4. Continue until consensus is reached or maximum 3 rounds exceeded
5. Provide final consensus decision with weighted scoring

DEBATE PROTOCOL:
- Round 1: Initial analysis from all agents
- Round 2: Agents respond to others' arguments (if disagreement)
- Round 3: Final positions and consensus building
- If no consensus after 3 rounds: Default to HOLD

CONSENSUS CALCULATION:
- Weight agents: Fundamental (0.3), Sentiment (0.3), Valuation (0.4)
- Final score = weighted average of agent confidences
- Final action = majority vote, or HOLD if tied

OUTPUT FORMAT:
{
  "consensus": [
    {
      "ticker": "BTC",
      "final_action": "BUY|HOLD|SELL",
      "final_score": 0.75,
      "rationale": "Agreement on moderate upside; tech neutral; risk_profile=neutral",
      "agent_decisions": [
        {"agent": "fundamental", "action": "BUY", "confidence": 0.8},
        {"agent": "sentiment", "action": "BUY", "confidence": 0.7},
        {"agent": "valuation", "action": "HOLD", "confidence": 0.6}
      ],
      "debate_rounds": 2,
      "risk_flags": ["high_volatility"]
    }
  ]
}

STRICT RULES:
1. Ensure each agent speaks at least twice (initial + debate)
2. Facilitate constructive debate when agents disagree
3. Use weighted scoring for final consensus
4. Terminate with "TERMINATE" when consensus is reached
5. Log debate transcript for analysis`;
  }
}
