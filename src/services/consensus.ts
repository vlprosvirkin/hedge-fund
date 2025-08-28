import type { Claim, ConsensusRec, MarketStats } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

export class ConsensusService {
  async buildConsensus(
    claims: Claim[],
    marketStats: MarketStats[],
    maxPositions: number = 10
  ): Promise<ConsensusRec[]> {
    console.log(`🤝 ConsensusService: Building consensus for ${claims.length} claims across ${marketStats.length} market stats`);

    // Group claims by ticker
    const tickerGroups = this.groupClaimsByTicker(claims);
    console.log(`🤝 ConsensusService: Grouped claims by ${tickerGroups.size} tickers:`, Array.from(tickerGroups.keys()));

    // Calculate consensus for each ticker
    const consensus: ConsensusRec[] = [];

    for (const [ticker, tickerClaims] of tickerGroups) {
      const marketStat = marketStats.find(stat => stat.symbol === ticker);
      if (!marketStat) {
        console.log(`🤝 ConsensusService: No market stats found for ${ticker}, skipping`);
        continue;
      }

      console.log(`🤝 ConsensusService: Calculating consensus for ${ticker} with ${tickerClaims.length} claims`);
      const consensusRec = this.calculateTickerConsensus(ticker, tickerClaims, marketStat);
      console.log(`🤝 ConsensusService: ${ticker} consensus - Score: ${consensusRec.finalScore.toFixed(3)}, Confidence: ${(consensusRec.avgConfidence * 100).toFixed(1)}%, Coverage: ${(consensusRec.coverage * 100).toFixed(1)}%`);
      consensus.push(consensusRec);
    }

    // Sort by final score and return top positions
    const sortedConsensus = consensus
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, maxPositions);

    console.log(`🤝 ConsensusService: Final consensus built for ${sortedConsensus.length} positions`);
    sortedConsensus.forEach((c, i) => {
      console.log(`🤝 ConsensusService: ${i + 1}. ${c.ticker} - Score: ${c.finalScore.toFixed(3)} (${c.finalScore > 0.1 ? 'BUY' : c.finalScore < -0.1 ? 'SELL' : 'HOLD'})`);
    });

    return sortedConsensus;
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
    // Calculate average confidence from verified claims
    const avgConfidence = claims.reduce((sum, claim) => sum + claim.confidence, 0) / claims.length;

    // Calculate coverage (how many different agent roles covered this ticker)
    const roles = new Set(claims.map(claim => claim.agentRole));
    const coverage = roles.size / 3; // 3 possible roles: fundamental, sentiment, technical

    // Calculate liquidity score (normalized volume/spread)
    const liquidity = this.calculateLiquidityScore(marketStat);

    // Calculate final score: avgConfidence * coverage * liquidity
    const finalScore = avgConfidence * coverage * liquidity;

    return {
      ticker,
      avgConfidence,
      coverage,
      liquidity,
      finalScore,
      claims: claims.map(claim => claim.id)
    };
  }

  private calculateLiquidityScore(marketStat: MarketStats): number {
    // Normalize liquidity based on volume and spread
    // Higher volume = better liquidity, lower spread = better liquidity

    const volumeScore = Math.min(marketStat.volume24h / 1000000, 1); // Normalize to 0-1
    const spreadScore = Math.max(0, 1 - (marketStat.spread || 0) / 100); // Lower spread = higher score

    // Combine volume and spread scores
    return (volumeScore * 0.7 + spreadScore * 0.3);
  }

  private calculateFinalScore(
    avgConfidence: number,
    coverage: number,
    liquidity: number,
    claims: Claim[]
  ): number {
    // Simple formula: finalScore = avgConfidence * coverage * liquidity
    return avgConfidence * coverage * liquidity;
  }

  private calculateRoleConsensus(claims: Claim[]): number {
    const roleConfidences = {
      fundamental: 0,
      sentiment: 0,
      technical: 0
    };

    const roleCounts = {
      fundamental: 0,
      sentiment: 0,
      technical: 0
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
    const roleWeights = { fundamental: 0.3, sentiment: 0.3, technical: 0.4 };
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
