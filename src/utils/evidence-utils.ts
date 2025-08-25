import type { Evidence, NewsItem } from '../types/index.js';

/**
 * Generate human-readable name for evidence based on its content
 */
export function generateEvidenceName(evidence: Evidence, newsItem?: NewsItem): string {
  // If we have a quote, use it as the primary identifier
  if (evidence.quote) {
    const cleanQuote = evidence.quote
      .replace(/[^\w\s]/g, '') // Remove special characters
      .trim()
      .substring(0, 50); // Limit length
    return `${evidence.source}: "${cleanQuote}${evidence.quote.length > 50 ? '...' : ''}"`;
  }

  // If we have news item data, use the title
  if (newsItem?.title) {
    const cleanTitle = newsItem.title
      .replace(/[^\w\s]/g, '') // Remove special characters
      .trim()
      .substring(0, 60); // Limit length
    return `${newsItem.source}: ${cleanTitle}${newsItem.title.length > 60 ? '...' : ''}`;
  }

  // Fallback to source and timestamp
  const date = new Date(evidence.timestamp).toLocaleDateString();
  return `${evidence.source} (${date})`;
}

/**
 * Generate evidence name by ID when we don't have the full evidence object
 */
export function generateEvidenceNameById(evidenceId: string): string {
  // Try to parse the ID to extract meaningful information
  if (evidenceId.includes('_')) {
    const parts = evidenceId.split('_');
    if (parts.length >= 3) {
      const ticker = parts[1]?.toUpperCase();
      const type = parts[2];
      const timestamp = parts[3];
      
      if (ticker && type) {
        const readableType = type.replace(/([A-Z])/g, ' $1').toLowerCase();
        return `${ticker} ${readableType} data`;
      }
    }
  }

  // Handle claim IDs (format: ticker_agentRole_timestamp_index)
  if (evidenceId.match(/^[A-Z]{2,5}_(fundamental|sentiment|valuation)_\d+_\d+$/)) {
    const parts = evidenceId.split('_');
    const ticker = parts[0]?.toUpperCase();
    const agentRole = parts[1];
    const timestamp = parts[2];
    
    if (ticker && agentRole && timestamp) {
      const readableRole = agentRole.charAt(0).toUpperCase() + agentRole.slice(1);
      const date = new Date(parseInt(timestamp)).toLocaleDateString();
      return `${ticker} ${readableRole} Claim (${date})`;
    }
  }

  // Fallback for simple IDs
  if (evidenceId.startsWith('evidence_')) {
    return `Evidence ${evidenceId.replace('evidence_', '')}`;
  }

  return evidenceId;
}

/**
 * Get evidence details for display
 */
export function getEvidenceDetails(evidence: Evidence, newsItem?: NewsItem): {
  name: string;
  source: string;
  relevance: string;
  timestamp: string;
  quote?: string;
} {
  const result: any = {
    name: generateEvidenceName(evidence, newsItem),
    source: evidence.source,
    relevance: `${(evidence.relevance * 100).toFixed(1)}%`,
    timestamp: new Date(evidence.timestamp).toLocaleString()
  };
  
  if (evidence.quote) {
    result.quote = evidence.quote;
  }
  
  return result;
}

/**
 * Format evidence for display in notifications with claim context
 */
export function formatEvidenceForDisplay(
  evidenceIds: string[], 
  evidenceMap?: Map<string, Evidence>,
  newsMap?: Map<string, NewsItem>,
  claimText?: string
): string[] {
  return evidenceIds.map((evidenceId, index) => {
    const evidence = evidenceMap?.get(evidenceId);
    const newsItem = evidence?.newsItemId ? newsMap?.get(evidence.newsItemId) : undefined;
    
    let evidenceName = '';
    if (evidence) {
      evidenceName = generateEvidenceName(evidence, newsItem);
    } else {
      evidenceName = generateEvidenceNameById(evidenceId);
    }
    
    // Add claim text preview if available and this is the first evidence
    if (claimText && index === 0) {
      const claimPreview = claimText.substring(0, 50).trim();
      if (claimPreview) {
        return `${evidenceName} | Claim: "${claimPreview}${claimText.length > 50 ? '...' : ''}"`;
      }
    }
    
    return evidenceName;
  });
}

/**
 * Create a map of evidence by ID for quick lookup
 */
export function createEvidenceMap(evidence: Evidence[]): Map<string, Evidence> {
  return new Map(evidence.map(e => [e.id, e]));
}

/**
 * Create a map of news items by ID for quick lookup
 */
export function createNewsMap(newsItems: NewsItem[]): Map<string, NewsItem> {
  return new Map(newsItems.map(n => [n.id, n]));
}
