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
  const timestamp = evidence.timestamp ?? Date.now();
  const date = new Date(timestamp).toLocaleDateString();
  return `${evidence.source} (${date})`;
}

/**
 * Generate evidence name by ID when we don't have the full evidence object
 */
export function generateEvidenceNameById(evidenceId: string): string {
  console.log(`🔍 EvidenceUtils: Generating name for ID: ${evidenceId}`);

  // Handle numeric IDs (like "3445", "3453")
  if (/^\d+$/.test(evidenceId)) {
    return `News Article #${evidenceId}`;
  }

  // Handle evidence IDs (format: ticker_newsId_timestamp)
  if (evidenceId.match(/^[A-Z]{2,5}_\d+_\d+$/)) {
    const parts = evidenceId.split('_');
    const ticker = parts[0]?.toUpperCase();
    const newsId = parts[1];
    const timestamp = parts[2];

    if (ticker && newsId && timestamp && !isNaN(parseInt(timestamp))) {
      const date = new Date(parseInt(timestamp)).toLocaleDateString();
      return `${ticker} News #${newsId} (${date})`;
    }
  }

  // Try to parse the ID to extract meaningful information
  if (evidenceId.includes('_')) {
    const parts = evidenceId.split('_');
    if (parts.length >= 3) {
      const ticker = parts[0]?.toUpperCase();
      const type = parts[1];
      const timestamp = parts[2];

      if (ticker && type && timestamp && !isNaN(parseInt(type)) && !isNaN(parseInt(timestamp))) {
        // This looks like ticker_newsId_timestamp format
        const date = new Date(parseInt(timestamp)).toLocaleDateString();
        return `${ticker} News #${type} (${date})`;
      }
    }
  }

  // Handle claim IDs (format: ticker_agentRole_timestamp_index)
  if (evidenceId.match(/^[A-Z]{2,5}_(fundamental|sentiment|technical)_\d+_\d+$/)) {
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

  // Handle "ID X data" format
  if (evidenceId.match(/^ID \d+ data$/)) {
    const match = evidenceId.match(/^ID (\d+) data$/);
    if (match) {
      return `Market Data #${match[1]}`;
    }
  }

  // Handle "evidence_id_X" format
  if (evidenceId.match(/^evidence_id_\d+$/)) {
    const match = evidenceId.match(/^evidence_id_(\d+)$/);
    if (match) {
      return `Market Data #${match[1]}`;
    }
  }

  // Handle "BTC - X" or "ETH - X" format
  if (evidenceId.match(/^[A-Z]{2,5} - \d+$/)) {
    const parts = evidenceId.split(' - ');
    const ticker = parts[0];
    const index = parts[1];
    if (ticker && index) {
      return `${ticker} News Item #${index}`;
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
    timestamp: new Date(evidence.timestamp ?? Date.now()).toLocaleString()
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
  console.log(`🔍 EvidenceUtils: Formatting ${evidenceIds.length} evidence IDs`);
  console.log(`🔍 EvidenceUtils: Evidence map available: ${!!evidenceMap}, News map available: ${!!newsMap}`);

  return evidenceIds.map((evidenceId, index) => {
    console.log(`🔍 EvidenceUtils: Processing evidence ID: ${evidenceId}`);

    // Try to find evidence by exact ID first
    let evidence = evidenceMap?.get(evidenceId);
    let newsItem = evidence?.newsItemId ? newsMap?.get(evidence.newsItemId) : undefined;

    // If not found, try to find by ticker if evidenceId contains ticker info
    if (!evidence && evidenceMap) {
      const tickerMatch = evidenceId.match(/^([A-Z]{2,5})_/);
      if (tickerMatch) {
        const ticker = tickerMatch[1];
        // Find evidence for this ticker
        for (const [id, ev] of evidenceMap.entries()) {
          if (ev.ticker === ticker) {
            evidence = ev;
            newsItem = ev.newsItemId ? newsMap?.get(ev.newsItemId) : undefined;
            console.log(`🔍 EvidenceUtils: Found evidence by ticker ${ticker}: ${id}`);
            break;
          }
        }
      }
    }

    // If still not found, try to find any evidence for the ticker from claim context
    if (!evidence && evidenceMap && claimText) {
      const tickerMatch = claimText.match(/([A-Z]{2,5}):/);
      if (tickerMatch) {
        const ticker = tickerMatch[1];
        for (const [id, ev] of evidenceMap.entries()) {
          if (ev.ticker === ticker) {
            evidence = ev;
            newsItem = ev.newsItemId ? newsMap?.get(ev.newsItemId) : undefined;
            console.log(`🔍 EvidenceUtils: Found evidence by claim ticker ${ticker}: ${id}`);
            break;
          }
        }
      }
    }

    // If still not found, try to find any evidence for the ticker
    if (!evidence && evidenceMap && claimText) {
      const tickerMatch = claimText.match(/([A-Z]{2,5}):/);
      if (tickerMatch) {
        const ticker = tickerMatch[1];
        // Find any evidence for this ticker
        for (const [id, ev] of evidenceMap.entries()) {
          if (ev.ticker === ticker) {
            evidence = ev;
            newsItem = ev.newsItemId ? newsMap?.get(ev.newsItemId) : undefined;
            console.log(`🔍 EvidenceUtils: Found evidence by ticker ${ticker}: ${id}`);
            break;
          }
        }
      }
    }

    // If still not found, create a fallback evidence name based on ticker
    if (!evidence && claimText) {
      const tickerMatch = claimText.match(/([A-Z]{2,5}):/);
      if (tickerMatch) {
        const ticker = tickerMatch[1];
        return `Market Data for ${ticker} (${new Date().toLocaleDateString()})`;
      }
    }

    console.log(`🔍 EvidenceUtils: Evidence found: ${!!evidence}, News item found: ${!!newsItem}`);

    let evidenceName = '';
    if (evidence) {
      evidenceName = generateEvidenceName(evidence, newsItem);
    } else {
      evidenceName = generateEvidenceNameById(evidenceId);
    }

    console.log(`🔍 EvidenceUtils: Base evidence name: ${evidenceName}`);

    // Enhance evidence name with more context
    let enhancedName = evidenceName;

    // Add source information if available
    if (evidence?.source) {
      enhancedName += ` (${evidence.source})`;
    }

    // Add relevance score if available
    if (evidence?.relevance) {
      const relevancePercent = (evidence.relevance * 100).toFixed(0);
      enhancedName += ` [${relevancePercent}% relevant]`;
    }

    // Add news title if available
    if (newsItem?.title) {
      const titlePreview = newsItem.title.substring(0, 40) + (newsItem.title.length > 40 ? '...' : '');
      enhancedName += ` - "${titlePreview}"`;
    }

    // Add claim text preview if available and this is the first evidence
    if (claimText && index === 0) {
      const claimPreview = claimText.substring(0, 50).trim();
      if (claimPreview) {
        return `${enhancedName} | Claim: "${claimPreview}${claimText.length > 50 ? '...' : ''}"`;
      }
    }

    console.log(`🔍 EvidenceUtils: Final enhanced name: ${enhancedName}`);
    return enhancedName;
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
