export interface AgentContribution {
    signal: number;
    confidence: number;
    reasoning: string;
}

export interface MarketContext {
    price_at_signal: number;
    volume_24h: number;
    volatility: number;
    market_sentiment: number;
}

export interface ExecutionDetails {
    order_id?: string;
    executed_price?: number;
    quantity?: number;
    execution_time?: Date;
}

export interface PerformanceTracking {
    current_price?: number;
    unrealized_pnl?: number;
    realized_pnl?: number;
    max_profit?: number;
    max_loss?: number;
    days_held?: number;
    status: 'active' | 'closed' | 'expired';
}

export interface SignalResult {
    id: string;
    round_id: string;
    ticker: string;
    signal_strength: number;
    signal_direction: 'buy' | 'sell' | 'hold';
    confidence: number;
    reasoning: string;
    target_price?: number;
    stop_loss?: number;
    take_profit?: number;
    time_horizon: 'short' | 'medium' | 'long';
    risk_score: number;
    claim_ids: string[];
    evidence_ids: string[];
    agent_contributions: {
        fundamental: AgentContribution;
        sentiment: AgentContribution;
        technical: AgentContribution;
    };
    market_context: MarketContext;
    execution_details?: ExecutionDetails;
    performance_tracking?: PerformanceTracking;
    created_at: Date;
    updated_at: Date;
}

export interface TargetLevels {
    target_price: number;
    stop_loss: number;
    take_profit: number;
    time_horizon: 'short' | 'medium' | 'long';
    confidence: number;
    reasoning: string;
}
