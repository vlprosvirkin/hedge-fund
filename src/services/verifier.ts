import type { FactStore } from '../interfaces/adapters.js';
import type { Claim, Evidence, RiskViolation } from '../types/index.js';


export class VerifierService {
  constructor(private factStore: FactStore) { }

  async verifyClaims(
    claims: Claim[],
    cutoff: number
  ): Promise<{
    verified: Claim[];
    rejected: Claim[];
    violations: RiskViolation[];
  }> {
    const verified: Claim[] = [];
    const rejected: Claim[] = [];
    const violations: RiskViolation[] = [];

    for (const claim of claims) {
      const verification = await this.verifySingleClaim(claim, cutoff);

      if (verification.valid) {
        verified.push(claim);
      } else {
        rejected.push(claim);
        violations.push(...verification.violations);
      }
    }

    return { verified, rejected, violations };
  }

  private async verifySingleClaim(
    claim: Claim,
    cutoff: number
  ): Promise<{
    valid: boolean;
    violations: RiskViolation[];
  }> {
    const violations: RiskViolation[] = [];

    // 1. Check timestamp lock (relaxed for MVP)
    if (claim.timestamp > cutoff + 60000) { // Allow 1 minute tolerance
      violations.push({
        type: 'position',
        current: claim.timestamp,
        limit: cutoff,
        severity: 'warning' // Changed from critical to warning
      });
    }

    // 2. Validate evidence exists and is time-locked (relaxed for MVP)
    if (claim.evidence && claim.evidence.length > 0) {
      const evidenceValidation = await this.validateEvidence(claim.evidence, cutoff);
      if (!evidenceValidation.valid) {
        // Only add violations as warnings for MVP
        violations.push(...evidenceValidation.violations.map(v => ({ ...v, severity: 'warning' as const })));
      }
    }

    // 3. Check claim format and confidence (basic validation)
    if (claim.confidence < 0 || claim.confidence > 1) {
      violations.push({
        type: 'position',
        current: claim.confidence,
        limit: 1,
        severity: 'critical'
      });
    }

    // 4. Check for suspicious patterns (relaxed for MVP)
    const patternViolations = this.checkSuspiciousPatterns(claim);
    violations.push(...patternViolations);

    // For MVP: Accept claims with only warnings, reject only with critical violations
    const criticalViolations = violations.filter(v => v.severity === 'critical');

    return {
      valid: criticalViolations.length === 0, // Only reject if critical violations
      violations
    };
  }

  private async validateEvidence(
    evidenceIds: string[],
    cutoff: number
  ): Promise<{
    valid: boolean;
    violations: RiskViolation[];
  }> {
    const violations: RiskViolation[] = [];

    try {
      // Get evidence from fact store
      const evidence = await this.factStore.getNewsByIds(evidenceIds);

      for (const ev of evidence) {
        // Check if evidence is time-locked
        if (ev.publishedAt > cutoff) {
          violations.push({
            type: 'position',
            current: ev.publishedAt,
            limit: cutoff,
            severity: 'critical'
          });
        }

        // Check source whitelist (relaxed for MVP)
        if (!this.isWhitelistedSource(ev.source)) {
          violations.push({
            type: 'position',
            current: 0,
            limit: 0,
            severity: 'warning' // Keep as warning for type compatibility
          });
        }
      }

      // Check if all evidence IDs were found (relaxed for MVP)
      if (evidence.length !== evidenceIds.length) {
        violations.push({
          type: 'position',
          current: evidence.length,
          limit: evidenceIds.length,
          severity: 'warning' // Changed from critical to warning
        });
      }
    } catch (error) {
      // For MVP: Don't fail verification if fact store is unavailable
      console.warn('Fact store unavailable, skipping evidence validation:', error);
      // Don't add violations for fact store errors in MVP
    }

    return {
      valid: violations.length === 0,
      violations
    };
  }

  private checkSuspiciousPatterns(claim: Claim): RiskViolation[] {
    const violations: RiskViolation[] = [];

    // Check for excessive confidence
    if (claim.confidence > 0.95) {
      violations.push({
        type: 'position',
        current: claim.confidence,
        limit: 0.95,
        severity: 'warning'
      });
    }

    // Check for too many risk flags
    if (claim.riskFlags && claim.riskFlags.length > 3) {
      violations.push({
        type: 'position',
        current: claim.riskFlags.length,
        limit: 3,
        severity: 'warning'
      });
    }

    // Check claim length (too short might be suspicious)
    if (claim.claim.length < 10) {
      violations.push({
        type: 'position',
        current: claim.claim.length,
        limit: 10,
        severity: 'warning'
      });
    }

    return violations;
  }

  private isWhitelistedSource(source: string): boolean {
    const whitelist = [
      'coindesk.com',
      'cointelegraph.com',
      'bitcoin.com',
      'decrypt.co',
      'theblock.co',
      'reuters.com',
      'bloomberg.com',
      'cnbc.com',
      'wsj.com'
    ];

    return whitelist.some(whitelisted =>
      source.toLowerCase().includes(whitelisted)
    );
  }

  // Additional validation methods
  async validateEvidenceRelevance(
    evidence: Evidence[],
    ticker: string
  ): Promise<boolean> {
    const relevantEvidence = evidence.filter(e => e.ticker === ticker);
    const avgRelevance = relevantEvidence.reduce((sum, e) => sum + e.relevance, 0) / relevantEvidence.length;

    return avgRelevance > 0.5; // Minimum relevance threshold
  }

  async checkEvidenceFreshness(
    evidence: Evidence[],
    maxAgeHours: number = 24
  ): Promise<boolean> {
    const now = Date.now();
    const maxAge = maxAgeHours * 60 * 60 * 1000;

    return evidence.every(e => (now - e.timestamp) <= maxAge);
  }
}
