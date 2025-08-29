import type {
  Candle,
  OrderBook,
  MarketStats,
  NewsItem,
  Evidence,
  Position,
  Order,
  FillEvent,
  SymbolMapping,
  UniverseFilter,
  Claim,
  ConsensusRec,
  SignalResult
} from '../types/index.js';

// ===== Market Data Adapter Interface =====
export interface MarketDataAdapter {
  // OHLCV data
  getOHLCV(symbol: string, timeframe: string, start: number, end: number): Promise<Candle[]>;

  // Order book
  getOrderBook(symbol: string): Promise<OrderBook>;

  // Market statistics
  getMarketStats(symbol: string): Promise<MarketStats>;

  // Real-time data subscription
  subscribeTicker(symbol: string, callback: (data: any) => void): void;
  unsubscribeTicker(symbol: string): void;

  // Connection management
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
}

// ===== News Adapter Interface =====
export interface NewsAdapter {
  // Search news
  search(query: string, since: number, until: number): Promise<NewsItem[]>;

  // Get specific news items
  getByIds(ids: string[]): Promise<NewsItem[]>;

  // Get latest news
  getLatest(limit: number): Promise<NewsItem[]>;

  // Connection management
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
}

// ===== Fact Store Interface =====
export interface FactStore {
  // Store news items (with deduplication)
  putNews(newsItems: NewsItem[]): Promise<void>;

  // Store evidence
  putEvidence(evidence: Evidence[]): Promise<void>;

  // Find evidence for ticker
  findEvidence(ticker: string, constraints: {
    since?: number;
    until?: number;
    minRelevance?: number;
    sources?: string[];
  }): Promise<Evidence[]>;

  // Validate evidence (time-lock check)
  validateEvidence(evidence: Evidence, cutoff: number): boolean;

  // Get news by IDs
  getNewsByIds(ids: string[]): Promise<NewsItem[]>;

  // Store claims
  storeClaims(claims: Claim[], roundId?: string): Promise<void>;

  // Get claims by round
  getClaimsByRound(roundId: string): Promise<Claim[]>;

  // Store consensus
  storeConsensus(consensus: ConsensusRec[], roundId: string): Promise<void>;

  // Store results with target levels
  storeResults(results: SignalResult[]): Promise<void>;

  // Store orders
  storeOrders(orders: Order[], roundId: string): Promise<void>;

  // Round management
  startRound(roundId: string): Promise<void>;
  endRound(roundId: string, status: string, claimsCount: number, ordersCount: number, totalPnL: number): Promise<void>;

  // Cleanup old data
  cleanup(before: number): Promise<void>;

  // Connection management
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
}

// ===== Trading Adapter Interface =====
export interface TradingAdapter {
  // Position management
  getPositions(): Promise<Position[]>;
  syncPositions(): Promise<Position[]>;

  // Order management
  placeOrder(params: {
    symbol: string;
    side: 'buy' | 'sell';
    quantity: number;
    type: 'market' | 'limit' | 'stop';
    price?: number;
  }): Promise<string>; // Returns order ID

  cancelOrder(orderId: string): Promise<boolean>;
  getOrder(orderId: string): Promise<Order | null>;
  getOrders(symbol?: string): Promise<Order[]>;

  // Fill event handling
  onFill(callback: (fillEvent: FillEvent) => void): void;
  offFill(callback: (fillEvent: FillEvent) => void): void;

  // Emergency functions
  cancelAllOrders(symbol?: string): Promise<void>;
  emergencyClose(): Promise<void>; // Close all positions

  // Connection management
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
}

// ===== Universe Service Interface =====
export interface UniverseService {
  // Get tradeable universe
  getUniverse(filter: UniverseFilter): Promise<string[]>;

  // Symbol mapping
  getSymbolMapping(binanceSymbol: string): Promise<SymbolMapping | null>;
  getAllMappings(): Promise<SymbolMapping[]>;

  // Update mappings
  updateMapping(mapping: SymbolMapping): Promise<void>;

  // Validation
  validateSymbol(symbol: string): Promise<boolean>;
  validateOrder(symbol: string, quantity: number, price: number): Promise<{
    valid: boolean;
    errors: string[];
    adjusted?: { quantity: number; price: number };
  }>;

  // Refresh universe data
  refreshUniverse(): Promise<void>;
}

// ===== LLM Service Interface =====
export interface LLMService {
  // Generate claims for a specific role
  runRole(role: 'fundamental' | 'sentiment' | 'technical', context: {
    universe: string[];
    facts: Evidence[];
    marketStats: MarketStats[];
    riskProfile: string;
    timestamp: number;
  }): Promise<{
    claims: any[]; // Will be validated as Claim[]
    errors: string[];
    openaiResponse?: string;
    analysis?: string;
    systemPrompt?: string;
    userPrompt?: string;
  }>;

  // Validate claim format
  validateClaim(claim: any): boolean;

  // Connection management
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
}

// ===== Risk Service Interface =====
export interface RiskService {
  // Check risk limits
  checkLimits(params: {
    targetWeights: any[];
    currentPositions: Position[];
    marketStats: MarketStats[];
    riskProfile: string;
  }): Promise<{
    ok: boolean;
    violations: any[]; // Will be validated as RiskViolation[]
    adjustedWeights?: any[];
  }>;

  // Get risk metrics
  getRiskMetrics(positions: Position[]): Promise<{
    totalExposure: number;
    leverage: number;
    volatility: number;
    maxDrawdown: number;
    var95: number;
  }>;

  // Update limits
  updateLimits(limits: any): Promise<void>;

  // Emergency stop
  triggerKillSwitch(): Promise<void>;
  isKillSwitchActive(): boolean;
}
