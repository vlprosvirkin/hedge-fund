import { Pool } from 'pg';
import type { PoolClient } from 'pg';
import { DATABASE_CONFIG } from '../core/config.js';
import type { NewsItem, Evidence, Claim, ConsensusRec, Order, Position, SignalResult, PerformanceTracking, ExecutionDetails } from '../types/index.js';
import type { FactStore } from '../interfaces/adapters.js';

export interface DatabaseSchema {
    // News and evidence storage
    news: {
        id: string;
        title: string;
        content: string;
        url: string;
        source: string;
        published_at: Date;
        sentiment_score: number;
        relevance_score: number;
        created_at: Date;
        updated_at: Date;
    };

    evidence: {
        id: string;
        ticker: string;
        news_item_id: string;
        relevance: number;
        quote: string;
        timestamp: Date;
        source: string;
        created_at: Date;
    };

    // Trading decisions and claims
    claims: {
        id: string;
        round_id: string;
        ticker: string;
        agent_role: string;
        claim_text: string;
        confidence: number;
        evidence_ids: string[];
        risk_flags: string[];
        timestamp: Date;
        created_at: Date;
    };

    consensus: {
        id: string;
        round_id: string;
        ticker: string;
        avg_confidence: number;
        coverage: number;
        liquidity: number;
        final_score: number;
        claim_ids: string[];
        created_at: Date;
    };

    // Trading execution
    orders: {
        id: string;
        round_id: string;
        symbol: string;
        side: string;
        type: string;
        quantity: number;
        price: number;
        status: string;
        timestamp: Date;
        created_at: Date;
    };

    positions: {
        id: string;
        symbol: string;
        quantity: number;
        avg_price: number;
        unrealized_pnl: number;
        realized_pnl: number;
        timestamp: Date;
        created_at: Date;
        updated_at: Date;
    };

    // System events and monitoring
    rounds: {
        id: string;
        start_time: Date;
        end_time: Date;
        status: string;
        claims_count: number;
        orders_count: number;
        total_pnl: number;
        created_at: Date;
    };

    risk_violations: {
        id: string;
        round_id: string;
        type: string;
        severity: string;
        message: string;
        timestamp: Date;
        created_at: Date;
    };

    // Signal results and performance tracking
    results: {
        id: string;
        round_id: string;
        ticker: string;
        signal_strength: number;
        signal_direction: 'BUY' | 'SELL' | 'HOLD';
        confidence: number;
        reasoning: string;
        target_price?: number;
        stop_loss?: number;
        take_profit?: number;
        time_horizon: 'short' | 'medium' | 'long';
        risk_score: number;
        agent_contributions: {
            fundamental: { signal: number; confidence: number; reasoning: string };
            sentiment: { signal: number; confidence: number; reasoning: string };
            technical: { signal: number; confidence: number; reasoning: string };
        };
        market_context: {
            price_at_signal: number;
            volume_24h: number;
            volatility: number;
            market_sentiment: number;
        };
        execution_details?: {
            order_id?: string;
            executed_price?: number;
            quantity?: number;
            execution_time?: Date;
        };
        performance_tracking?: {
            current_price?: number;
            unrealized_pnl?: number;
            realized_pnl?: number;
            max_profit?: number;
            max_loss?: number;
            days_held?: number;
            status: 'active' | 'closed' | 'expired';
        };
        created_at: Date;
        updated_at: Date;
    };
}

export class PostgresAdapter implements FactStore {
    private pool: Pool;
    private _isConnected = false;

    constructor() {
        const poolConfig = {
            host: DATABASE_CONFIG.host,
            port: DATABASE_CONFIG.port,
            database: DATABASE_CONFIG.database,
            user: DATABASE_CONFIG.username,
            password: DATABASE_CONFIG.password,
            ssl: DATABASE_CONFIG.ssl ? { rejectUnauthorized: false } : false,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        };



        this.pool = new Pool(poolConfig);

        // Handle pool errors
        this.pool.on('error', (err) => {
            console.error('Unexpected error on idle client', err);
        });
    }

    async connect(): Promise<void> {
        try {
            const client = await this.pool.connect();
            await client.query('SELECT NOW()');
            client.release();
            this._isConnected = true;
            console.log('✅ Connected to PostgreSQL database');

            // Initialize schema
            await this.initializeSchema();
        } catch (error) {
            console.error('Failed to connect to PostgreSQL:', error);
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        if (this._isConnected) {
            await this.pool.end();
            this._isConnected = false;
            console.log('✅ Disconnected from PostgreSQL database');
        }
    }

    isConnected(): boolean {
        return this._isConnected;
    }

    private async initializeSchema(): Promise<void> {
        const client = await this.pool.connect();

        try {
            // Create tables if they don't exist
            await client.query(`
        CREATE TABLE IF NOT EXISTS news (
          id VARCHAR(255) PRIMARY KEY,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          url TEXT NOT NULL,
          source VARCHAR(255) NOT NULL,
          published_at TIMESTAMP NOT NULL,
          sentiment_score DECIMAL(3,2),
          relevance_score DECIMAL(3,2),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

            await client.query(`
        CREATE TABLE IF NOT EXISTS evidence (
          id VARCHAR(255) PRIMARY KEY,
          ticker VARCHAR(20) NOT NULL,
          kind VARCHAR(20) NOT NULL,
          source VARCHAR(255) NOT NULL,
          url TEXT,
          snippet TEXT NOT NULL,
          published_at TIMESTAMP,
          observed_at TIMESTAMP,
          relevance DECIMAL(3,2) NOT NULL,
          impact DECIMAL(3,2),
          confidence DECIMAL(3,2),
          metric VARCHAR(100),
          value DECIMAL(20,8),
          news_item_id VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (news_item_id) REFERENCES news(id) ON DELETE SET NULL
        );
      `);

            await client.query(`
        CREATE TABLE IF NOT EXISTS claims (
          id VARCHAR(255) PRIMARY KEY,
          round_id VARCHAR(255) NOT NULL,
          ticker VARCHAR(20) NOT NULL,
          agent_role VARCHAR(50) NOT NULL,
          claim_text TEXT NOT NULL,
          confidence DECIMAL(3,2) NOT NULL,
          evidence_ids TEXT[] NOT NULL,
          risk_flags TEXT[] NOT NULL,
          direction VARCHAR(10),
          magnitude DECIMAL(3,2),
          rationale TEXT,
          signals JSONB,
          thesis TEXT,
          timestamp TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

            await client.query(`
        CREATE TABLE IF NOT EXISTS consensus (
          id VARCHAR(255) PRIMARY KEY,
          round_id VARCHAR(255) NOT NULL,
          ticker VARCHAR(20) NOT NULL,
          avg_confidence DECIMAL(3,2) NOT NULL,
          coverage DECIMAL(3,2) NOT NULL,
          liquidity DECIMAL(3,2) NOT NULL,
          final_score DECIMAL(3,2) NOT NULL,
          claim_ids TEXT[] NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

            await client.query(`
        CREATE TABLE IF NOT EXISTS orders (
          id VARCHAR(255) PRIMARY KEY,
          round_id VARCHAR(255) NOT NULL,
          symbol VARCHAR(20) NOT NULL,
          side VARCHAR(10) NOT NULL,
          type VARCHAR(20) NOT NULL,
          quantity DECIMAL(20,8) NOT NULL,
          price DECIMAL(20,8),
          status VARCHAR(20) NOT NULL,
          timestamp TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

            await client.query(`
        CREATE TABLE IF NOT EXISTS positions (
          id VARCHAR(255) PRIMARY KEY,
          symbol VARCHAR(20) NOT NULL,
          quantity DECIMAL(20,8) NOT NULL,
          avg_price DECIMAL(20,8) NOT NULL,
          unrealized_pnl DECIMAL(20,8) NOT NULL,
          realized_pnl DECIMAL(20,8) NOT NULL,
          timestamp TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

            await client.query(`
        CREATE TABLE IF NOT EXISTS rounds (
          id VARCHAR(255) PRIMARY KEY,
          start_time TIMESTAMP NOT NULL,
          end_time TIMESTAMP,
          status VARCHAR(20) NOT NULL,
          claims_count INTEGER DEFAULT 0,
          orders_count INTEGER DEFAULT 0,
          total_pnl DECIMAL(20,8) DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

            await client.query(`
        CREATE TABLE IF NOT EXISTS risk_violations (
          id VARCHAR(255) PRIMARY KEY,
          round_id VARCHAR(255) NOT NULL,
          type VARCHAR(50) NOT NULL,
          severity VARCHAR(20) NOT NULL,
          message TEXT NOT NULL,
          timestamp TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

            await client.query(`
        CREATE TABLE IF NOT EXISTS results (
          id VARCHAR(255) PRIMARY KEY,
          round_id VARCHAR(255) NOT NULL,
          ticker VARCHAR(20) NOT NULL,
          signal_strength DECIMAL(5,4) NOT NULL,
          signal_direction VARCHAR(10) NOT NULL CHECK (signal_direction IN ('BUY', 'SELL', 'HOLD')),
          confidence DECIMAL(3,2) NOT NULL,
          reasoning TEXT NOT NULL,
          target_price DECIMAL(20,8),
          stop_loss DECIMAL(20,8),
          take_profit DECIMAL(20,8),
          time_horizon VARCHAR(10) NOT NULL CHECK (time_horizon IN ('short', 'medium', 'long')),
          risk_score DECIMAL(3,2) NOT NULL,
          claim_ids TEXT[] NOT NULL,
          evidence_ids TEXT[] NOT NULL,
          agent_contributions JSONB NOT NULL,
          market_context JSONB NOT NULL,
          execution_details JSONB,
          performance_tracking JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

            // Create indexes for better performance
            await client.query(`
        CREATE INDEX IF NOT EXISTS idx_news_published_at ON news(published_at);
        CREATE INDEX IF NOT EXISTS idx_news_source ON news(source);
        CREATE INDEX IF NOT EXISTS idx_evidence_ticker ON evidence(ticker);
        CREATE INDEX IF NOT EXISTS idx_evidence_timestamp ON evidence(created_at);
        CREATE INDEX IF NOT EXISTS idx_claims_round_id ON claims(round_id);
        CREATE INDEX IF NOT EXISTS idx_claims_ticker ON claims(ticker);
        CREATE INDEX IF NOT EXISTS idx_consensus_round_id ON consensus(round_id);
        CREATE INDEX IF NOT EXISTS idx_orders_round_id ON orders(round_id);
        CREATE INDEX IF NOT EXISTS idx_positions_symbol ON positions(symbol);
        CREATE INDEX IF NOT EXISTS idx_rounds_start_time ON rounds(start_time);
        CREATE INDEX IF NOT EXISTS idx_results_round_id ON results(round_id);
        CREATE INDEX IF NOT EXISTS idx_results_ticker ON results(ticker);
        CREATE INDEX IF NOT EXISTS idx_results_signal_direction ON results(signal_direction);
        CREATE INDEX IF NOT EXISTS idx_results_created_at ON results(created_at);
      `);

            console.log('✅ Database schema initialized');
        } finally {
            client.release();
        }
    }

    // FactStore interface methods
    async putNews(newsItems: NewsItem[]): Promise<void> {
        return this.storeNews(newsItems);
    }

    async putEvidence(evidence: Evidence[]): Promise<void> {
        return this.storeEvidence(evidence);
    }

    validateEvidence(evidence: any, cutoff: number): boolean {
        if (evidence.kind === 'news') {
            return new Date(evidence.publishedAt).getTime() >= cutoff;
        } else {
            return new Date(evidence.observedAt).getTime() >= cutoff;
        }
    }

    // News operations
    async storeNews(newsItems: NewsItem[]): Promise<void> {
        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');

            for (const item of newsItems) {
                await client.query(`
          INSERT INTO news (id, title, content, url, source, published_at, sentiment_score, relevance_score)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            content = EXCLUDED.content,
            sentiment_score = EXCLUDED.sentiment_score,
            relevance_score = EXCLUDED.relevance_score,
            updated_at = CURRENT_TIMESTAMP
        `, [
                    item.id,
                    item.title,
                    item.description || '',
                    item.url,
                    item.source,
                    new Date(item.publishedAt),
                    item.sentiment || 0,
                    0 // Default relevance score since it's not in NewsItem type
                ]);
            }

            await client.query('COMMIT');
            console.log(`✅ Successfully stored ${newsItems.length} news items in database`);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async getNewsByIds(ids: string[]): Promise<NewsItem[]> {
        if (ids.length === 0) return [];

        const client = await this.pool.connect();

        try {
            const result = await client.query(`
        SELECT * FROM news WHERE id = ANY($1)
        ORDER BY published_at DESC
      `, [ids]);

            return result.rows.map(row => ({
                id: row.id,
                title: row.title,
                content: row.content,
                url: row.url,
                source: row.source,
                publishedAt: row.published_at.getTime(),
                sentiment: row.sentiment_score,
                relevanceScore: row.relevance_score
            }));
        } finally {
            client.release();
        }
    }

    // Evidence operations
    async storeEvidence(evidenceItems: any[]): Promise<void> {
        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');

            for (const item of evidenceItems) {
                // Handle new discriminated union structure
                if (item.kind === 'news') {
                    await client.query(`
                        INSERT INTO evidence (ticker, kind, source, url, snippet, published_at, relevance, impact, confidence)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                        ON CONFLICT (id) DO UPDATE SET
                            relevance = EXCLUDED.relevance,
                            impact = EXCLUDED.impact,
                            confidence = EXCLUDED.confidence,
                            updated_at = CURRENT_TIMESTAMP
                    `, [
                        item.ticker,
                        item.kind,
                        item.source,
                        item.url,
                        item.snippet,
                        new Date(item.publishedAt),
                        item.relevance,
                        item.impact || null,
                        item.confidence || null
                    ]);
                } else if (item.kind === 'market' || item.kind === 'tech') {
                    await client.query(`
                        INSERT INTO evidence (ticker, kind, source, metric, value, observed_at, relevance, impact, confidence)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                        ON CONFLICT (id) DO UPDATE SET
                            relevance = EXCLUDED.relevance,
                            impact = EXCLUDED.impact,
                            confidence = EXCLUDED.confidence,
                            updated_at = CURRENT_TIMESTAMP
                    `, [
                        item.ticker,
                        item.kind,
                        item.source,
                        item.metric,
                        item.value,
                        new Date(item.observedAt),
                        item.relevance,
                        item.impact || null,
                        item.confidence || null
                    ]);
                }
            }

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async findEvidence(ticker: string, constraints: {
        since?: number;
        until?: number;
        minRelevance?: number;
        sources?: string[];
    }): Promise<any[]> {
        const client = await this.pool.connect();

        try {
            const cutoff = constraints.since || Date.now() - 24 * 60 * 60 * 1000; // Default to 24 hours ago

            const result = await client.query(`
                SELECT * FROM evidence 
                WHERE ticker = $1
                  AND ((kind = 'news' AND published_at >= $2)
                   OR (kind IN ('market', 'tech') AND observed_at >= $2))
                ORDER BY 
                    CASE 
                        WHEN kind = 'news' THEN published_at 
                        ELSE observed_at 
                    END DESC
            `, [ticker, new Date(cutoff)]);

            return result.rows.map(row => {
                if (row.kind === 'news') {
                    return {
                        id: row.id,
                        ticker: row.ticker,
                        kind: 'news',
                        source: row.source,
                        url: row.url,
                        snippet: row.snippet,
                        publishedAt: row.published_at.toISOString(),
                        relevance: row.relevance,
                        impact: row.impact,
                        confidence: row.confidence
                    };
                } else {
                    return {
                        id: row.id,
                        ticker: row.ticker,
                        kind: row.kind,
                        source: row.source,
                        metric: row.metric,
                        value: row.value,
                        observedAt: row.observed_at.toISOString(),
                        relevance: row.relevance,
                        impact: row.impact,
                        confidence: row.confidence
                    };
                }
            });
        } finally {
            client.release();
        }
    }

    // Claims operations
    async storeClaims(claims: Claim[], roundId?: string): Promise<void> {
        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');

            for (const claim of claims) {
                await client.query(`
          INSERT INTO claims (id, round_id, ticker, agent_role, claim_text, confidence, evidence_ids, risk_flags, direction, magnitude, rationale, timestamp)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
                    claim.id,
                    roundId || 'unknown', // Use provided round ID or default
                    claim.ticker,
                    claim.agentRole,
                    claim.claim,
                    claim.confidence,
                    claim.evidence,
                    claim.riskFlags || [],
                    claim.direction || null,
                    claim.magnitude || null,
                    claim.rationale || null,
                    new Date(claim.timestamp)
                ]);
            }

            await client.query('COMMIT');
            console.log(`✅ Successfully stored ${claims.length} claims in database`);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async getClaimsByRound(roundId: string): Promise<Claim[]> {
        const client = await this.pool.connect();

        try {
            // Если roundId is 'unknown', получаем все claims
            const query = roundId === 'unknown'
                ? `SELECT * FROM claims ORDER BY timestamp DESC`
                : `SELECT * FROM claims WHERE round_id = $1 ORDER BY timestamp DESC`;

            const params = roundId === 'unknown' ? [] : [roundId];
            const result = await client.query(query, params);

            return result.rows.map(row => ({
                id: row.id,
                ticker: row.ticker,
                agentRole: row.agent_role,
                claim: row.claim_text,
                confidence: row.confidence,
                evidence: row.evidence_ids,
                riskFlags: row.risk_flags,
                direction: row.direction,
                magnitude: row.magnitude,
                rationale: row.rationale,
                timestamp: row.timestamp.getTime()
            }));
        } finally {
            client.release();
        }
    }

    // Consensus operations
    async storeConsensus(consensus: ConsensusRec[], roundId: string): Promise<void> {
        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');

            for (const rec of consensus) {
                await client.query(`
          INSERT INTO consensus (id, round_id, ticker, avg_confidence, coverage, liquidity, final_score, claim_ids)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
                    `consensus-${Date.now()}-${Math.random()}`,
                    roundId,
                    rec.ticker,
                    rec.avgConfidence,
                    rec.coverage,
                    rec.liquidity,
                    rec.finalScore,
                    rec.claims
                ]);
            }

            await client.query('COMMIT');
            console.log(`✅ Successfully stored ${consensus.length} consensus records in database`);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // Orders operations
    async storeOrders(orders: Order[], roundId: string): Promise<void> {
        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');

            for (const order of orders) {
                // Ensure timestamp is valid
                const timestamp = order.timestamp && !isNaN(order.timestamp)
                    ? new Date(order.timestamp)
                    : new Date();

                await client.query(`
          INSERT INTO orders (id, round_id, symbol, side, type, quantity, price, status, timestamp)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
                    order.id,
                    roundId,
                    order.symbol,
                    order.side,
                    order.type,
                    order.quantity,
                    order.price,
                    order.status,
                    timestamp
                ]);
            }

            await client.query('COMMIT');
            console.log(`✅ Successfully stored ${orders.length} orders in database`);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // Positions operations
    async storePositions(positions: Position[]): Promise<void> {
        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');

            for (const position of positions) {
                await client.query(`
          INSERT INTO positions (id, symbol, quantity, avg_price, unrealized_pnl, realized_pnl, timestamp)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO UPDATE SET
            quantity = EXCLUDED.quantity,
            avg_price = EXCLUDED.avg_price,
            unrealized_pnl = EXCLUDED.unrealized_pnl,
            realized_pnl = EXCLUDED.realized_pnl,
            timestamp = EXCLUDED.timestamp,
            updated_at = CURRENT_TIMESTAMP
        `, [
                    `position-${position.symbol}-${Date.now()}`,
                    position.symbol,
                    position.quantity,
                    position.avgPrice,
                    position.unrealizedPnL,
                    position.realizedPnL,
                    new Date(position.timestamp)
                ]);
            }

            await client.query('COMMIT');
            console.log(`✅ Successfully stored ${positions.length} positions in database`);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // Round tracking
    async startRound(roundId: string): Promise<void> {
        const client = await this.pool.connect();

        try {
            await client.query(`
        INSERT INTO rounds (id, start_time, status)
        VALUES ($1, CURRENT_TIMESTAMP, 'running')
      `, [roundId]);
            console.log(`✅ Successfully started round ${roundId} in database`);
        } finally {
            client.release();
        }
    }

    async endRound(roundId: string, status: string, claimsCount: number, ordersCount: number, totalPnL: number): Promise<void> {
        const client = await this.pool.connect();

        try {
            await client.query(`
        UPDATE rounds 
        SET end_time = CURRENT_TIMESTAMP, 
            status = $2, 
            claims_count = $3, 
            orders_count = $4, 
            total_pnl = $5
        WHERE id = $1
      `, [roundId, status, claimsCount, ordersCount, totalPnL]);
            console.log(`✅ Successfully ended round ${roundId} in database`);
        } finally {
            client.release();
        }
    }

    // Risk violations
    async storeRiskViolation(roundId: string, type: string, severity: string, message: string): Promise<void> {
        const client = await this.pool.connect();

        try {
            await client.query(`
        INSERT INTO risk_violations (id, round_id, type, severity, message, timestamp)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      `, [
                `violation-${Date.now()}-${Math.random()}`,
                roundId,
                type,
                severity,
                message
            ]);
        } finally {
            client.release();
        }
    }

    // Analytics and reporting
    async getRoundStats(roundId: string): Promise<{
        claimsCount: number;
        ordersCount: number;
        totalPnL: number;
        startTime: Date;
        endTime?: Date;
        status: string;
    } | null> {
        const client = await this.pool.connect();

        try {
            const result = await client.query(`
        SELECT * FROM rounds WHERE id = $1
      `, [roundId]);

            if (result.rows.length === 0) return null;

            const row = result.rows[0];
            return {
                claimsCount: row.claims_count,
                ordersCount: row.orders_count,
                totalPnL: row.total_pnl,
                startTime: row.start_time,
                endTime: row.end_time,
                status: row.status
            };
        } finally {
            client.release();
        }
    }

    async getRecentRounds(limit: number = 10): Promise<Array<{
        id: string;
        startTime: Date;
        endTime?: Date;
        status: string;
        claimsCount: number;
        ordersCount: number;
        totalPnL: number;
    }>> {
        const client = await this.pool.connect();

        try {
            const result = await client.query(`
        SELECT * FROM rounds 
        ORDER BY start_time DESC 
        LIMIT $1
      `, [limit]);

            return result.rows.map(row => ({
                id: row.id,
                startTime: row.start_time,
                endTime: row.end_time,
                status: row.status,
                claimsCount: row.claims_count,
                ordersCount: row.orders_count,
                totalPnL: row.total_pnl
            }));
        } finally {
            client.release();
        }
    }

    // Results operations
    async storeResults(results: SignalResult[]): Promise<void> {
        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');

            for (const result of results) {
                await client.query(`
                    INSERT INTO results (
                        id, round_id, ticker, signal_strength, signal_direction, confidence, reasoning,
                        target_price, stop_loss, take_profit, time_horizon, risk_score,
                        claim_ids, evidence_ids, agent_contributions, market_context,
                        execution_details, performance_tracking
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
                    ON CONFLICT (id) DO UPDATE SET
                        signal_strength = EXCLUDED.signal_strength,
                        signal_direction = EXCLUDED.signal_direction,
                        confidence = EXCLUDED.confidence,
                        reasoning = EXCLUDED.reasoning,
                        target_price = EXCLUDED.target_price,
                        stop_loss = EXCLUDED.stop_loss,
                        take_profit = EXCLUDED.take_profit,
                        time_horizon = EXCLUDED.time_horizon,
                        risk_score = EXCLUDED.risk_score,
                        claim_ids = EXCLUDED.claim_ids,
                        evidence_ids = EXCLUDED.evidence_ids,
                        agent_contributions = EXCLUDED.agent_contributions,
                        market_context = EXCLUDED.market_context,
                        execution_details = EXCLUDED.execution_details,
                        performance_tracking = EXCLUDED.performance_tracking,
                        updated_at = CURRENT_TIMESTAMP
                `, [
                    result.id,
                    result.round_id,
                    result.ticker,
                    result.signal_strength,
                    result.signal_direction,
                    result.confidence,
                    result.reasoning,
                    result.target_price,
                    result.stop_loss,
                    result.take_profit,
                    result.time_horizon,
                    result.risk_score,
                    result.claim_ids || [],
                    result.evidence_ids || [],
                    JSON.stringify(result.agent_contributions),
                    JSON.stringify(result.market_context),
                    result.execution_details ? JSON.stringify(result.execution_details) : null,
                    result.performance_tracking ? JSON.stringify(result.performance_tracking) : null
                ]);
            }

            await client.query('COMMIT');
            console.log(`✅ Successfully stored ${results.length} results in database`);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async getResultsByRound(roundId: string): Promise<SignalResult[]> {
        const client = await this.pool.connect();

        try {
            const result = await client.query(`
                SELECT * FROM results WHERE round_id = $1 ORDER BY created_at DESC
            `, [roundId]);

            return result.rows.map(row => ({
                id: row.id,
                round_id: row.round_id,
                ticker: row.ticker,
                signal_strength: row.signal_strength,
                signal_direction: row.signal_direction,
                confidence: row.confidence,
                reasoning: row.reasoning,
                target_price: row.target_price,
                stop_loss: row.stop_loss,
                take_profit: row.take_profit,
                time_horizon: row.time_horizon,
                risk_score: row.risk_score,
                claim_ids: row.claim_ids,
                evidence_ids: row.evidence_ids,
                agent_contributions: row.agent_contributions,
                market_context: row.market_context,
                execution_details: row.execution_details,
                performance_tracking: row.performance_tracking,
                created_at: row.created_at,
                updated_at: row.updated_at
            }));
        } finally {
            client.release();
        }
    }

    async getResultsByTicker(ticker: string, limit: number = 50): Promise<SignalResult[]> {
        const client = await this.pool.connect();

        try {
            const result = await client.query(`
                SELECT * FROM results WHERE ticker = $1 ORDER BY created_at DESC LIMIT $2
            `, [ticker, limit]);

            return result.rows.map(row => ({
                id: row.id,
                round_id: row.round_id,
                ticker: row.ticker,
                signal_strength: row.signal_strength,
                signal_direction: row.signal_direction,
                confidence: row.confidence,
                reasoning: row.reasoning,
                target_price: row.target_price,
                stop_loss: row.stop_loss,
                take_profit: row.take_profit,
                time_horizon: row.time_horizon,
                risk_score: row.risk_score,
                claim_ids: row.claim_ids,
                evidence_ids: row.evidence_ids,
                agent_contributions: row.agent_contributions,
                market_context: row.market_context,
                execution_details: row.execution_details,
                performance_tracking: row.performance_tracking,
                created_at: row.created_at,
                updated_at: row.updated_at
            }));
        } finally {
            client.release();
        }
    }

    async updateResultPerformance(resultId: string, performance: PerformanceTracking): Promise<void> {
        const client = await this.pool.connect();

        try {
            await client.query(`
                UPDATE results 
                SET performance_tracking = $2, updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
            `, [resultId, JSON.stringify(performance)]);
        } finally {
            client.release();
        }
    }

    async updateResultExecution(resultId: string, execution: ExecutionDetails): Promise<void> {
        const client = await this.pool.connect();

        try {
            await client.query(`
                UPDATE results 
                SET execution_details = $2, updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
            `, [resultId, JSON.stringify(execution)]);
        } finally {
            client.release();
        }
    }

    // Performance analytics
    async getSignalPerformanceStats(ticker?: string, days: number = 30): Promise<{
        total_signals: number;
        profitable_signals: number;
        avg_return: number;
        win_rate: number;
        avg_hold_time: number;
        best_signal: SignalResult | null;
        worst_signal: SignalResult | null;
    }> {
        const client = await this.pool.connect();

        try {
            const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

            const whereClause = ticker
                ? 'WHERE ticker = $1 AND created_at >= $2'
                : 'WHERE created_at >= $1';

            const params = ticker ? [ticker, cutoffDate] : [cutoffDate];

            const result = await client.query(`
                SELECT 
                    COUNT(*) as total_signals,
                    COUNT(CASE WHEN performance_tracking->>'status' = 'closed' THEN 1 END) as closed_signals,
                    COUNT(CASE WHEN (performance_tracking->>'realized_pnl')::numeric > 0 THEN 1 END) as profitable_signals,
                    AVG((performance_tracking->>'realized_pnl')::numeric) as avg_return,
                    AVG((performance_tracking->>'days_held')::numeric) as avg_hold_time
                FROM results 
                ${whereClause}
            `, params);

            const row = result.rows[0];
            const totalSignals = parseInt(row.total_signals);
            const profitableSignals = parseInt(row.profitable_signals);
            const closedSignals = parseInt(row.closed_signals);

            // Get best and worst signals
            const bestResult = await client.query(`
                SELECT * FROM results 
                ${whereClause}
                AND performance_tracking->>'status' = 'closed'
                ORDER BY (performance_tracking->>'realized_pnl')::numeric DESC 
                LIMIT 1
            `, params);

            const worstResult = await client.query(`
                SELECT * FROM results 
                ${whereClause}
                AND performance_tracking->>'status' = 'closed'
                ORDER BY (performance_tracking->>'realized_pnl')::numeric ASC 
                LIMIT 1
            `, params);

            return {
                total_signals: totalSignals,
                profitable_signals: profitableSignals,
                avg_return: parseFloat(row.avg_return) || 0,
                win_rate: closedSignals > 0 ? (profitableSignals / closedSignals) * 100 : 0,
                avg_hold_time: parseFloat(row.avg_hold_time) || 0,
                best_signal: bestResult.rows[0] || null,
                worst_signal: worstResult.rows[0] || null
            };
        } finally {
            client.release();
        }
    }

    // Cleanup old data
    async cleanup(before: number): Promise<void> {
        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');

            const cutoffDate = new Date(before);

            // Clean up old data (keep last 30 days by default)
            await client.query('DELETE FROM risk_violations WHERE timestamp < $1', [cutoffDate]);
            await client.query('DELETE FROM orders WHERE timestamp < $1', [cutoffDate]);
            await client.query('DELETE FROM claims WHERE timestamp < $1', [cutoffDate]);
            await client.query('DELETE FROM consensus WHERE created_at < $1', [cutoffDate]);
            await client.query('DELETE FROM evidence WHERE created_at < $1', [cutoffDate]);
            await client.query('DELETE FROM news WHERE published_at < $1', [cutoffDate]);
            await client.query('DELETE FROM results WHERE created_at < $1', [cutoffDate]);

            await client.query('COMMIT');
            console.log(`✅ Cleaned up data older than ${cutoffDate.toISOString()}`);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}
