# Database Setup Guide

## Problem Description

The system was failing with the error:
```
error: relation "results" does not exist
```

This error occurs because the `results` table is missing from the database schema, but the code expects it to exist for storing trading signal results.

## Solution

### 1. Database Configuration

First, ensure your database environment variables are properly set. Copy from `env.example`:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hedge_fund
DB_USER=postgres
DB_PASSWORD=your_db_password_here
DB_SSL=false
```

### 2. Run Database Migrations

The system includes a migration script that will create all necessary tables including the missing `results` table:

```bash
# Make sure you're in the project root directory
cd /path/to/hedge-fund

# Set your database environment variables
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=hedge_fund
export DB_USER=postgres
export DB_PASSWORD=your_password

# Run migrations
./scripts/run-migrations.sh
```

### 3. Migration Details

The migration script will run the following migrations in order:

- **v2**: Add new columns to existing tables
- **v3**: Support for discriminated Evidence union types
- **v4**: Create the missing `results` table

### 4. Results Table Schema

The `results` table includes the following fields:

```sql
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
```

### 5. Verification

After running migrations, you can verify the table was created:

```bash
psql "postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}" -c "\dt results"
```

### 6. Troubleshooting

If you encounter issues:

1. **Permission denied**: Make sure the script is executable:
   ```bash
   chmod +x scripts/run-migrations.sh
   ```

2. **Connection refused**: Ensure PostgreSQL is running and accessible:
   ```bash
   # For local PostgreSQL
   brew services start postgresql  # macOS
   sudo systemctl start postgresql  # Linux
   ```

3. **Database doesn't exist**: Create it first:
   ```bash
   createdb hedge_fund
   ```

4. **User doesn't exist**: Create the user:
   ```bash
   createuser -s postgres  # Creates superuser
   ```

## Manual Migration (Alternative)

If the script doesn't work, you can run the migration manually:

```bash
psql "postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}" -f scripts/db-migration-v4.sql
```

## Next Steps

After successfully running the migrations:

1. Restart your hedge fund application
2. The error should be resolved and the system should start storing trading results
3. Monitor the logs to ensure everything is working correctly
