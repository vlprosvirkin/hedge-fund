import type { Claim, ConsensusRec, MarketStats } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

export class ConsensusService {
  async buildConsensus(
    claims: Claim[],
    marketStats: MarketStats[],
    maxPositions: number = 10
  ): Promise<ConsensusRec[]> {
    // Group claims by ticker
    const tickerGroups = this.groupClaimsByTicker(claims);

    // Calculate consensus for each ticker
    const consensus: ConsensusRec[] = [];

    for (const [ticker, tickerClaims] of tickerGroups) {
      const marketStat = marketStats.find(stat => stat.symbol === ticker);
      if (!marketStat) continue;

      const consensusRec = this.calculateTickerConsensus(ticker, tickerClaims, marketStat);
      consensus.push(consensusRec);
    }

    // Sort by final score and return top positions
    return consensus
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, maxPositions);
  }

  private groupClaimsByTicker(claims: Claim[]): Map<string, Claim[]> {
    const groups = new Map<string, Claim[]>();

    for (const claim of claims) {
      if (!groups.has(claim.ticker)) {
        groups.set(claim.ticker, []);
      }
      groups.get(claim.ticker)!.push(claim);
    }

    return groups;
  }

  private calculateTickerConsensus(
    ticker: string,
    claims: Claim[],
    marketStat: MarketStats
  ): ConsensusRec {
    // Calculate average confidence
    const avgConfidence = claims.reduce((sum, claim) => sum + claim.confidence, 0) / claims.length;

    // Calculate coverage (how many different agent roles covered this ticker)
    const roles = new Set(claims.map(claim => claim.agentRole));
    const coverage = roles.size / 3; // 3 possible roles: fundamental, sentiment, valuation

    // Calculate liquidity score (normalized volume)
    const liquidity = Math.min(marketStat.volume24h / 1000000, 1); // Normalize to 0-1

    // Calculate final score
    const finalScore = this.calculateFinalScore(avgConfidence, coverage, liquidity, claims);

    return {
      ticker,
      avgConfidence,
      coverage,
      liquidity,
      finalScore,
      claims: claims.map(claim => claim.id)
    };
  }

  private calculateFinalScore(
    avgConfidence: number,
    coverage: number,
    liquidity: number,
    claims: Claim[]
  ): number {
    // Data-driven scoring based on AlphaAgents methodology

    // 1. Base confidence score (weighted by coverage)
    const confidenceScore = avgConfidence * Math.min(coverage * 1.5, 1.0);

    // 2. Liquidity adjustment (higher liquidity = more confidence)
    const liquidityScore = Math.min(liquidity * 1.2, 1.0);

    // 3. Risk penalty (penalize high-risk positions)
    const riskFlags = claims.flatMap(claim => claim.riskFlags || []);
    const riskPenalty = Math.min(riskFlags.length * 0.15, 0.4);

    // 4. Consensus strength (agreement between agents)
    const roleConsensus = this.calculateRoleConsensus(claims);

    // 5. Signal strength (how strong are the individual signals)
    const signalStrength = this.calculateSignalStrength(claims);

    // Combine all factors with weights
    const finalScore = (
      confidenceScore * 0.35 +
      liquidityScore * 0.20 +
      roleConsensus * 0.25 +
      signalStrength * 0.20
    ) * (1 - riskPenalty);

    return Math.max(0, Math.min(1, finalScore));
  }

  private calculateRoleConsensus(claims: Claim[]): number {
    const roleConfidences = {
      fundamental: 0,
      sentiment: 0,
      valuation: 0
    };

    const roleCounts = {
      fundamental: 0,
      sentiment: 0,
      valuation: 0
    };

    for (const claim of claims) {
      roleConfidences[claim.agentRole as keyof typeof roleConfidences] += claim.confidence;
      roleCounts[claim.agentRole as keyof typeof roleCounts]++;
    }

    // Calculate average confidence per role
    const avgConfidences = Object.keys(roleConfidences).map(role => {
      const count = roleCounts[role as keyof typeof roleCounts];
      return count > 0 ? roleConfidences[role as keyof typeof roleConfidences] / count : 0;
    });

    // Return standard deviation (lower is better consensus)
    const mean = avgConfidences.reduce((sum, val) => sum + val, 0) / avgConfidences.length;
    const variance = avgConfidences.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / avgConfidences.length;
    const stdDev = Math.sqrt(variance);

    // Convert to consensus score (1 - stdDev, higher is better)
    return Math.max(0, 1 - stdDev);
  }

  private calculateSignalStrength(claims: Claim[]): number {
    // Calculate overall signal strength based on individual claim strengths
    if (claims.length === 0) return 0;

    // Weight claims by their confidence and agent role
    const roleWeights = { fundamental: 0.3, sentiment: 0.3, valuation: 0.4 };
    let totalWeightedStrength = 0;
    let totalWeight = 0;

    for (const claim of claims) {
      const roleWeight = roleWeights[claim.agentRole as keyof typeof roleWeights] || 0.33;
      const claimStrength = claim.confidence * roleWeight;

      totalWeightedStrength += claimStrength;
      totalWeight += roleWeight;
    }

    // Normalize to 0-1 range
    return totalWeight > 0 ? totalWeightedStrength / totalWeight : 0;
  }

  // Additional consensus methods
  async applyRiskAdjustments(
    consensus: ConsensusRec[],
    riskProfile: 'averse' | 'neutral' | 'bold'
  ): Promise<ConsensusRec[]> {
    const adjustments = {
      averse: { liquidityWeight: 0.4, confidenceWeight: 0.6 },
      neutral: { liquidityWeight: 0.3, confidenceWeight: 0.7 },
      bold: { liquidityWeight: 0.2, confidenceWeight: 0.8 }
    };

    const adjustment = adjustments[riskProfile];

    return consensus.map(rec => ({
      ...rec,
      finalScore: rec.avgConfidence * adjustment.confidenceWeight +
        rec.liquidity * adjustment.liquidityWeight
    })).sort((a, b) => b.finalScore - a.finalScore);
  }

  async detectConflicts(claims: Claim[]): Promise<{
    conflicts: Array<{ ticker: string; claims: Claim[]; severity: 'low' | 'medium' | 'high' }>;
  }> {
    const conflicts: Array<{ ticker: string; claims: Claim[]; severity: 'low' | 'medium' | 'high' }> = [];
    const tickerGroups = this.groupClaimsByTicker(claims);

    for (const [ticker, tickerClaims] of tickerGroups) {
      if (tickerClaims.length < 2) continue;

      // Check for conflicting recommendations
      const buySignals = tickerClaims.filter(claim =>
        claim.claim.toLowerCase().includes('buy') ||
        claim.claim.toLowerCase().includes('bullish')
      );

      const sellSignals = tickerClaims.filter(claim =>
        claim.claim.toLowerCase().includes('sell') ||
        claim.claim.toLowerCase().includes('bearish')
      );

      if (buySignals.length > 0 && sellSignals.length > 0) {
        const severity = this.calculateConflictSeverity(buySignals, sellSignals);
        conflicts.push({
          ticker,
          claims: tickerClaims,
          severity
        });
      }
    }

    return { conflicts };
  }

  private calculateConflictSeverity(
    buySignals: Claim[],
    sellSignals: Claim[]
  ): 'low' | 'medium' | 'high' {
    const buyConfidence = buySignals.reduce((sum, claim) => sum + claim.confidence, 0) / buySignals.length;
    const sellConfidence = sellSignals.reduce((sum, claim) => sum + claim.confidence, 0) / sellSignals.length;

    const confidenceDiff = Math.abs(buyConfidence - sellConfidence);

    if (confidenceDiff < 0.2) return 'high';
    if (confidenceDiff < 0.4) return 'medium';
    return 'low';
  }
}
