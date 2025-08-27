-- Migration v2: Add new columns to evidence and claims tables
-- Run this migration to add the new fields we added to the TypeScript types

-- Add new columns to evidence table
ALTER TABLE evidence ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'news';
ALTER TABLE evidence ADD COLUMN IF NOT EXISTS impact DECIMAL(3,2);
ALTER TABLE evidence ADD COLUMN IF NOT EXISTS confidence DECIMAL(3,2);

-- Add new columns to claims table
ALTER TABLE claims ADD COLUMN IF NOT EXISTS direction VARCHAR(20);
ALTER TABLE claims ADD COLUMN IF NOT EXISTS magnitude DECIMAL(3,2);
ALTER TABLE claims ADD COLUMN IF NOT EXISTS rationale TEXT;

-- Update existing evidence records to set type based on source
UPDATE evidence SET type = 'news' WHERE type IS NULL AND source LIKE '%news%';
UPDATE evidence SET type = 'market' WHERE type IS NULL AND source LIKE '%market%';
UPDATE evidence SET type = 'technical' WHERE type IS NULL AND source LIKE '%technical%';
UPDATE evidence SET type = 'news' WHERE type IS NULL; -- Default fallback

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_evidence_type ON evidence(type);
CREATE INDEX IF NOT EXISTS idx_evidence_impact ON evidence(impact);
CREATE INDEX IF NOT EXISTS idx_claims_direction ON claims(direction);
CREATE INDEX IF NOT EXISTS idx_claims_magnitude ON claims(magnitude);

-- Verify migration
SELECT 'Migration v2 completed successfully' as status;
