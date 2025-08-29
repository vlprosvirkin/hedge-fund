-- Migration v4: Create results table for storing trading signal results
-- This migration adds the missing results table that is referenced in the code

-- Create results table
CREATE TABLE results (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    round_id VARCHAR(255) NOT NULL,
    ticker VARCHAR(20) NOT NULL,
    signal_strength DECIMAL(3,2) NOT NULL,
    signal_direction VARCHAR(20) NOT NULL, -- 'buy', 'sell', 'hold'
    confidence DECIMAL(3,2) NOT NULL,
    reasoning TEXT,
    target_price DECIMAL(20,8),
    stop_loss DECIMAL(20,8),
    take_profit DECIMAL(20,8),
    time_horizon VARCHAR(50),
    risk_score DECIMAL(3,2),
    claim_ids TEXT[], -- Array of claim IDs
    evidence_ids TEXT[], -- Array of evidence IDs
    agent_contributions JSONB, -- JSON object with agent contributions
    market_context JSONB, -- JSON object with market context
    execution_details JSONB, -- JSON object with execution details
    performance_tracking JSONB, -- JSON object with performance tracking
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX idx_results_round_id ON results(round_id);
CREATE INDEX idx_results_ticker ON results(ticker);
CREATE INDEX idx_results_signal_direction ON results(signal_direction);
CREATE INDEX idx_results_created_at ON results(created_at);
CREATE INDEX idx_results_confidence ON results(confidence);
CREATE INDEX idx_results_signal_strength ON results(signal_strength);

-- Add constraints
ALTER TABLE results ADD CONSTRAINT chk_signal_direction 
    CHECK (signal_direction IN ('buy', 'sell', 'hold'));
ALTER TABLE results ADD CONSTRAINT chk_signal_strength 
    CHECK (signal_strength >= -1.0 AND signal_strength <= 1.0);
ALTER TABLE results ADD CONSTRAINT chk_confidence 
    CHECK (confidence >= 0.0 AND confidence <= 1.0);
ALTER TABLE results ADD CONSTRAINT chk_risk_score 
    CHECK (risk_score >= 0.0 AND risk_score <= 1.0);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_results_updated_at 
    BEFORE UPDATE ON results 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify migration
SELECT 'Migration v4 completed successfully - results table created' as status;
