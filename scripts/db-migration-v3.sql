-- Migration v3: Support for discriminated Evidence union types
-- This migration adds support for the new Evidence structure with kind field

-- Drop existing evidence table if it exists (for clean migration)
DROP TABLE IF EXISTS evidence CASCADE;

-- Create new evidence table with flexible structure for all types
CREATE TABLE evidence (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  ticker VARCHAR(20) NOT NULL, -- BTC, ETH, etc.
  kind VARCHAR(20) NOT NULL, -- 'news', 'market', 'tech'
  source VARCHAR(255) NOT NULL,
  relevance DECIMAL(3,2) NOT NULL DEFAULT 0.5,
  impact DECIMAL(3,2), -- -1.0 to 1.0
  confidence DECIMAL(3,2), -- 0.0 to 1.0
  
  -- News-specific fields
  url TEXT,
  snippet TEXT,
  published_at TIMESTAMP,
  
  -- Market/Tech-specific fields  
  metric VARCHAR(100),
  value DECIMAL(20,8),
  observed_at TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX idx_evidence_ticker ON evidence(ticker);
CREATE INDEX idx_evidence_kind ON evidence(kind);
CREATE INDEX idx_evidence_source ON evidence(source);
CREATE INDEX idx_evidence_published_at ON evidence(published_at);
CREATE INDEX idx_evidence_observed_at ON evidence(observed_at);
CREATE INDEX idx_evidence_metric ON evidence(metric);
CREATE INDEX idx_evidence_relevance ON evidence(relevance);

-- Add constraints for different evidence types
-- News evidence should have url and snippet
ALTER TABLE evidence ADD CONSTRAINT chk_news_evidence 
  CHECK (kind != 'news' OR (url IS NOT NULL AND snippet IS NOT NULL AND published_at IS NOT NULL));

-- Market evidence should have metric and value
ALTER TABLE evidence ADD CONSTRAINT chk_market_evidence 
  CHECK (kind != 'market' OR (metric IS NOT NULL AND value IS NOT NULL AND observed_at IS NOT NULL));

-- Tech evidence should have metric and value
ALTER TABLE evidence ADD CONSTRAINT chk_tech_evidence 
  CHECK (kind != 'tech' OR (metric IS NOT NULL AND value IS NOT NULL AND observed_at IS NOT NULL));

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_evidence_updated_at 
  BEFORE UPDATE ON evidence 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add evidence validation function
CREATE OR REPLACE FUNCTION validate_evidence()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate news evidence
  IF NEW.kind = 'news' THEN
    IF NEW.url IS NULL OR NEW.snippet IS NULL OR NEW.published_at IS NULL THEN
      RAISE EXCEPTION 'News evidence must have url, snippet, and published_at';
    END IF;
  END IF;
  
  -- Validate market evidence
  IF NEW.kind = 'market' THEN
    IF NEW.metric IS NULL OR NEW.value IS NULL OR NEW.observed_at IS NULL THEN
      RAISE EXCEPTION 'Market evidence must have metric, value, and observed_at';
    END IF;
    IF NEW.source != 'binance' THEN
      RAISE EXCEPTION 'Market evidence source must be binance';
    END IF;
  END IF;
  
  -- Validate tech evidence
  IF NEW.kind = 'tech' THEN
    IF NEW.metric IS NULL OR NEW.value IS NULL OR NEW.observed_at IS NULL THEN
      RAISE EXCEPTION 'Tech evidence must have metric, value, and observed_at';
    END IF;
    IF NEW.source != 'indicators' THEN
      RAISE EXCEPTION 'Tech evidence source must be indicators';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER validate_evidence_trigger
  BEFORE INSERT OR UPDATE ON evidence
  FOR EACH ROW EXECUTE FUNCTION validate_evidence();

-- Insert some sample data for testing
INSERT INTO evidence (ticker, kind, source, url, snippet, published_at, relevance, impact, confidence) VALUES
('BTC', 'news', 'coindesk.com', 'https://example.com/btc-news', 'Bitcoin reaches new highs', '2025-08-27T10:00:00Z', 0.9, 0.8, 0.85);

INSERT INTO evidence (ticker, kind, source, metric, value, observed_at, relevance, impact, confidence) VALUES
('BTC', 'market', 'binance', 'vol24h', 25000000, '2025-08-27T10:00:00Z', 0.95, 0.0, 0.95),
('BTC', 'tech', 'indicators', 'RSI(14,4h)', 58.5, '2025-08-27T10:00:00Z', 0.85, 0.3, 0.9);
