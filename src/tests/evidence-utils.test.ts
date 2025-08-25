import { describe, it, expect } from 'vitest';
import {
  generateEvidenceName,
  generateEvidenceNameById,
  getEvidenceDetails,
  formatEvidenceForDisplay,
  createEvidenceMap,
  createNewsMap
} from '../utils/evidence-utils.js';
import type { Evidence, NewsItem } from '../types/index.js';

describe('Evidence Utils', () => {
  const mockEvidence: Evidence = {
    id: 'evidence_btc_volume_1756111731791',
    ticker: 'BTC',
    newsItemId: 'news_123',
    relevance: 0.85,
    timestamp: 1756111731791,
    source: 'CoinDesk',
    quote: 'Bitcoin volume surges 15% as institutional demand grows across major exchanges'
  };

  const mockNewsItem: NewsItem = {
    id: 'news_123',
    title: 'Bitcoin Institutional Adoption Accelerates',
    url: 'https://coindesk.com/bitcoin-institutional-adoption',
    source: 'CoinDesk',
    publishedAt: 1756111731791,
    sentiment: 0.7,
    description: 'Major institutions are increasing their Bitcoin holdings'
  };

  describe('generateEvidenceName', () => {
    it('should generate name from quote when available', () => {
      const name = generateEvidenceName(mockEvidence);
      expect(name).toBe('CoinDesk: "Bitcoin volume surges 15% as institutional demand grows..."');
    });

    it('should generate name from news title when quote not available', () => {
      const evidenceWithoutQuote = { ...mockEvidence, quote: undefined };
      const name = generateEvidenceName(evidenceWithoutQuote, mockNewsItem);
      expect(name).toBe('CoinDesk: Bitcoin Institutional Adoption Accelerates');
    });

    it('should fallback to source and timestamp when no quote or news', () => {
      const evidenceWithoutQuote = { ...mockEvidence, quote: undefined };
      const name = generateEvidenceName(evidenceWithoutQuote);
      expect(name).toMatch(/CoinDesk \(\d{1,2}\/\d{1,2}\/\d{4}\)/);
    });
  });

  describe('generateEvidenceNameById', () => {
    it('should parse technical evidence IDs', () => {
      const name = generateEvidenceNameById('evidence_btc_volume_1756111731791');
      expect(name).toBe('BTC volume data');
    });

    it('should parse sentiment evidence IDs', () => {
      const name = generateEvidenceNameById('evidence_eth_sentiment_1756111731791');
      expect(name).toBe('ETH sentiment data');
    });

    it('should handle simple evidence IDs', () => {
      const name = generateEvidenceNameById('evidence_1');
      expect(name).toBe('Evidence 1');
    });

    it('should return original ID for unrecognized format', () => {
      const name = generateEvidenceNameById('unknown_id');
      expect(name).toBe('unknown_id');
    });
  });

  describe('getEvidenceDetails', () => {
    it('should return complete evidence details', () => {
      const details = getEvidenceDetails(mockEvidence, mockNewsItem);
      expect(details).toEqual({
        name: 'CoinDesk: "Bitcoin volume surges 15% as institutional demand grows..."',
        source: 'CoinDesk',
        relevance: '85.0%',
        timestamp: expect.any(String),
        quote: 'Bitcoin volume surges 15% as institutional demand grows across major exchanges'
      });
    });
  });

  describe('formatEvidenceForDisplay', () => {
    it('should format evidence with human-readable names', () => {
      const evidenceIds = ['evidence_btc_volume_1756111731791', 'evidence_eth_sentiment_1756111731791'];
      const evidenceMap = new Map([['evidence_btc_volume_1756111731791', mockEvidence]]);
      
      const formatted = formatEvidenceForDisplay(evidenceIds, evidenceMap);
      expect(formatted).toEqual([
        'CoinDesk: "Bitcoin volume surges 15% as institutional demand grows..."',
        'ETH sentiment data'
      ]);
    });

    it('should handle missing evidence gracefully', () => {
      const evidenceIds = ['unknown_id'];
      const formatted = formatEvidenceForDisplay(evidenceIds);
      expect(formatted).toEqual(['unknown_id']);
    });
  });

  describe('createEvidenceMap', () => {
    it('should create map from evidence array', () => {
      const evidenceArray = [mockEvidence];
      const map = createEvidenceMap(evidenceArray);
      expect(map.get('evidence_btc_volume_1756111731791')).toBe(mockEvidence);
    });
  });

  describe('createNewsMap', () => {
    it('should create map from news array', () => {
      const newsArray = [mockNewsItem];
      const map = createNewsMap(newsArray);
      expect(map.get('news_123')).toBe(mockNewsItem);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long quotes', () => {
      const longQuote = 'A'.repeat(100);
      const evidenceWithLongQuote = { ...mockEvidence, quote: longQuote };
      const name = generateEvidenceName(evidenceWithLongQuote);
      expect(name.length).toBeLessThan(80);
      expect(name).toContain('...');
    });

    it('should handle special characters in quotes', () => {
      const specialQuote = 'Bitcoin & Ethereum: "Market Analysis" (2024)';
      const evidenceWithSpecialChars = { ...mockEvidence, quote: specialQuote };
      const name = generateEvidenceName(evidenceWithSpecialChars);
      expect(name).toBe('CoinDesk: "Bitcoin  Ethereum Market Analysis 2024"');
    });

    it('should handle empty evidence array', () => {
      const formatted = formatEvidenceForDisplay([]);
      expect(formatted).toEqual([]);
    });
  });
});
