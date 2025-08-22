import axios from 'axios';
import type {
    Claim,
    ConsensusRec,
    Position,
    Order,
    PipelineArtifact
} from '../types/index.js';
import { API_CONFIG } from '../config.js';

export interface TelegramMessage {
    text: string;
    parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
    disable_web_page_preview?: boolean;
    reply_markup?: {
        inline_keyboard?: Array<Array<{
            text: string;
            callback_data?: string;
            url?: string;
        }>>;
    };
}

export interface DecisionSummary {
    roundId: string;
    timestamp: number;
    claims: Claim[];
    consensus: ConsensusRec[];
    orders: Order[];
    positions: Position[];
    performance: {
        totalValue: number;
        unrealizedPnL: number;
        realizedPnL: number;
    };
}

export class TelegramAdapter {
    private botToken: string;
    private chatId: string;
    private baseUrl: string;
    private isConnectedFlag = false;

    constructor(botToken?: string, chatId?: string) {
        this.botToken = botToken || API_CONFIG.telegram?.botToken || '';
        this.chatId = chatId || API_CONFIG.telegram?.chatId || '';
        this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
    }

    async connect(): Promise<void> {
        try {
            if (!this.botToken || !this.chatId) {
                console.warn('Telegram bot token or chat ID not configured - running in mock mode');
                this.isConnectedFlag = true;
                return;
            }

            // Test connection by getting bot info
            const response = await axios.get(`${this.baseUrl}/getMe`);

            if (response.data.ok) {
                this.isConnectedFlag = true;
                console.log(`✅ Connected to Telegram bot: ${response.data.result.username}`);
            } else {
                throw new Error('Failed to connect to Telegram bot');
            }
        } catch (error) {
            console.warn('Telegram connection failed, running in mock mode:', error);
            this.isConnectedFlag = true; // Continue in mock mode
        }
    }

    async disconnect(): Promise<void> {
        this.isConnectedFlag = false;
    }

    isConnected(): boolean {
        return this.isConnectedFlag;
    }

    /**
     * Send a message to the configured Telegram chat
     */
    async sendMessage(message: TelegramMessage): Promise<void> {
        if (!this.botToken || !this.chatId) {
            console.log('📱 [TELEGRAM MOCK]', message.text.substring(0, 100) + '...');
            return;
        }

        try {
            await axios.post(`${this.baseUrl}/sendMessage`, {
                chat_id: this.chatId,
                ...message
            });
        } catch (error) {
            console.error('Failed to send Telegram message:', error);
        }
    }

    /**
     * Post trading round start notification
     */
    async postRoundStart(roundId: string, universe: string[]): Promise<void> {
        const message: TelegramMessage = {
            text: `🚀 <b>Trading Round Started</b>\n\n` +
                `🆔 Round ID: <code>${roundId}</code>\n` +
                `🕐 Time: ${new Date().toLocaleString()}\n` +
                `🎯 Universe: ${universe.join(', ')}\n` +
                `📊 Analyzing ${universe.length} assets...`,
            parse_mode: 'HTML'
        };

        await this.sendMessage(message);
    }

    /**
     * Post agent analysis results
     */
    async postAgentAnalysis(
        roundId: string,
        agentRole: string,
        claims: Claim[],
        processingTime: number
    ): Promise<void> {
        const emoji = {
            fundamental: '📊',
            sentiment: '📰',
            valuation: '📈'
        }[agentRole] || '🤖';

        let text = `${emoji} <b>${agentRole.toUpperCase()} AGENT ANALYSIS</b>\n\n`;
        text += `🆔 Round: <code>${roundId}</code>\n`;
        text += `⏱️ Processing time: ${processingTime}ms\n`;
        text += `📋 Generated ${claims.length} claims\n\n`;

        // Show top 3 claims with details
        const topClaims = claims.slice(0, 3);
        for (let i = 0; i < topClaims.length; i++) {
            const claim = topClaims[i];
            if (!claim) continue;
            
            text += `<b>${i + 1}. ${claim.ticker}</b>\n`;
            text += `💪 Confidence: ${(claim.confidence * 100).toFixed(1)}%\n`;
            text += `📝 ${claim.claim.substring(0, 80)}${claim.claim.length > 80 ? '...' : ''}\n`;

            if (claim.riskFlags && claim.riskFlags.length > 0) {
                text += `⚠️ Risk flags: ${claim.riskFlags.join(', ')}\n`;
            }
            text += '\n';
        }

        const message: TelegramMessage = {
            text,
            parse_mode: 'HTML',
            disable_web_page_preview: true
        };

        await this.sendMessage(message);
    }

    /**
     * Post consensus results
     */
    async postConsensusResults(
        roundId: string,
        consensus: ConsensusRec[],
        conflicts: any[] = []
    ): Promise<void> {
        let text = `🎯 <b>CONSENSUS RESULTS</b>\n\n`;
        text += `🆔 Round: <code>${roundId}</code>\n`;
        text += `📊 ${consensus.length} recommendations generated\n\n`;

        // Show top recommendations
        for (let i = 0; i < Math.min(consensus.length, 5); i++) {
            const rec = consensus[i];
            if (!rec) continue;
            
            text += `<b>${i + 1}. ${rec.ticker}</b>\n`;
            text += `🎯 Final Score: ${(rec.finalScore * 100).toFixed(1)}%\n`;
            text += `💪 Avg Confidence: ${(rec.avgConfidence * 100).toFixed(1)}%\n`;
            text += `📈 Coverage: ${(rec.coverage * 100).toFixed(0)}%\n`;
            text += `💧 Liquidity: ${(rec.liquidity * 100).toFixed(1)}%\n`;
            text += `📋 Claims: ${rec.claims.length}\n\n`;
        }

        if (conflicts.length > 0) {
            text += `⚠️ <b>CONFLICTS DETECTED:</b> ${conflicts.length}\n`;
            conflicts.forEach(conflict => {
                text += `• ${conflict.ticker}: ${conflict.severity} severity\n`;
            });
        }

        const message: TelegramMessage = {
            text,
            parse_mode: 'HTML'
        };

        await this.sendMessage(message);
    }

    /**
     * Post risk assessment results
     */
    async postRiskAssessment(
        roundId: string,
        riskCheck: { ok: boolean; violations: any[]; warnings: any[] }
    ): Promise<void> {
        const status = riskCheck.ok ? '✅ PASSED' : '❌ FAILED';
        const emoji = riskCheck.ok ? '🛡️' : '🚨';

        let text = `${emoji} <b>RISK ASSESSMENT</b>\n\n`;
        text += `🆔 Round: <code>${roundId}</code>\n`;
        text += `📊 Status: ${status}\n\n`;

        if (riskCheck.violations.length > 0) {
            text += `🚨 <b>VIOLATIONS (${riskCheck.violations.length}):</b>\n`;
            riskCheck.violations.forEach(violation => {
                text += `• ${violation.type}: ${violation.severity}\n`;
            });
            text += '\n';
        }

        if (riskCheck.warnings.length > 0) {
            text += `⚠️ <b>WARNINGS (${riskCheck.warnings.length}):</b>\n`;
            riskCheck.warnings.forEach(warning => {
                text += `• ${warning.type}: ${warning.message}\n`;
            });
            text += '\n';
        }

        if (riskCheck.ok) {
            text += `✅ All risk checks passed - proceeding with execution`;
        } else {
            text += `❌ Risk checks failed - execution blocked`;
        }

        const message: TelegramMessage = {
            text,
            parse_mode: 'HTML'
        };

        await this.sendMessage(message);
    }

    /**
     * Post order execution results
     */
    async postOrderExecution(
        roundId: string,
        orders: Order[],
        positions: Position[]
    ): Promise<void> {
        let text = `📈 <b>ORDER EXECUTION</b>\n\n`;
        text += `🆔 Round: <code>${roundId}</code>\n`;
        text += `📋 ${orders.length} orders placed\n\n`;

        // Show executed orders
        if (orders.length > 0) {
            text += `<b>EXECUTED ORDERS:</b>\n`;
            orders.forEach((order, i) => {
                const side = order.side === 'buy' ? '🟢 BUY' : '🔴 SELL';
                text += `${i + 1}. ${side} ${order.quantity} ${order.symbol}\n`;
                text += `   💰 ${order.type} @ ${order.price || 'MARKET'}\n`;
                text += `   📊 Status: ${order.status}\n\n`;
            });
        }

        // Show current positions
        if (positions.length > 0) {
            text += `<b>CURRENT POSITIONS:</b>\n`;
            positions.forEach(position => {
                const pnlEmoji = position.unrealizedPnL >= 0 ? '📈' : '📉';
                text += `• ${position.symbol}: ${position.quantity}\n`;
                text += `  💰 Avg Price: $${position.avgPrice.toLocaleString()}\n`;
                text += `  ${pnlEmoji} PnL: $${position.unrealizedPnL.toLocaleString()}\n\n`;
            });
        }

        const message: TelegramMessage = {
            text,
            parse_mode: 'HTML'
        };

        await this.sendMessage(message);
    }

    /**
     * Post comprehensive round summary
     */
    async postRoundSummary(summary: DecisionSummary): Promise<void> {
        const duration = Date.now() - summary.timestamp;
        const pnlEmoji = summary.performance.unrealizedPnL >= 0 ? '📈' : '📉';

        let text = `🎉 <b>TRADING ROUND COMPLETED</b>\n\n`;
        text += `🆔 Round ID: <code>${summary.roundId}</code>\n`;
        text += `⏱️ Duration: ${Math.round(duration / 1000)}s\n`;
        text += `🕐 Completed: ${new Date().toLocaleString()}\n\n`;

        text += `<b>📊 SUMMARY:</b>\n`;
        text += `• Claims Generated: ${summary.claims.length}\n`;
        text += `• Consensus Recs: ${summary.consensus.length}\n`;
        text += `• Orders Placed: ${summary.orders.length}\n`;
        text += `• Active Positions: ${summary.positions.length}\n\n`;

        text += `<b>💰 PERFORMANCE:</b>\n`;
        text += `• Portfolio Value: $${summary.performance.totalValue.toLocaleString()}\n`;
        text += `• ${pnlEmoji} Unrealized PnL: $${summary.performance.unrealizedPnL.toLocaleString()}\n`;
        text += `• 💵 Realized PnL: $${summary.performance.realizedPnL.toLocaleString()}\n\n`;

        // Show top performing positions
        if (summary.positions.length > 0) {
            text += `<b>🏆 TOP POSITIONS:</b>\n`;
            const sortedPositions = summary.positions
                .sort((a, b) => b.unrealizedPnL - a.unrealizedPnL)
                .slice(0, 3);

            sortedPositions.forEach((pos, i) => {
                const emoji = pos.unrealizedPnL >= 0 ? '🟢' : '🔴';
                text += `${i + 1}. ${emoji} ${pos.symbol}: $${pos.unrealizedPnL.toLocaleString()}\n`;
            });
        }

        const message: TelegramMessage = {
            text,
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [[
                    { text: '📊 View Details', callback_data: `details_${summary.roundId}` },
                    { text: '📈 Portfolio', callback_data: `portfolio_${summary.roundId}` }
                ]]
            }
        };

        await this.sendMessage(message);
    }

    /**
     * Post emergency alert
     */
    async postEmergencyAlert(
        type: 'kill_switch' | 'risk_violation' | 'api_failure',
        details: string
    ): Promise<void> {
        const emoji = {
            kill_switch: '🛑',
            risk_violation: '🚨',
            api_failure: '⚠️'
        }[type];

        let text = `${emoji} <b>EMERGENCY ALERT</b>\n\n`;
        text += `🚨 Type: ${type.replace('_', ' ').toUpperCase()}\n`;
        text += `🕐 Time: ${new Date().toLocaleString()}\n`;
        text += `📝 Details: ${details}\n\n`;
        text += `⚡ All trading operations have been halted`;

        const message: TelegramMessage = {
            text,
            parse_mode: 'HTML'
        };

        await this.sendMessage(message);
    }

    /**
     * Post daily performance report
     */
    async postDailyReport(
        totalRounds: number,
        successfulRounds: number,
        totalPnL: number,
        topPerformers: Array<{ symbol: string; pnl: number }>
    ): Promise<void> {
        const successRate = (successfulRounds / totalRounds * 100).toFixed(1);
        const pnlEmoji = totalPnL >= 0 ? '📈' : '📉';

        let text = `📅 <b>DAILY PERFORMANCE REPORT</b>\n\n`;
        text += `🕐 Date: ${new Date().toLocaleDateString()}\n`;
        text += `🔄 Total Rounds: ${totalRounds}\n`;
        text += `✅ Successful: ${successfulRounds} (${successRate}%)\n`;
        text += `${pnlEmoji} Total PnL: $${totalPnL.toLocaleString()}\n\n`;

        if (topPerformers.length > 0) {
            text += `<b>🏆 TOP PERFORMERS:</b>\n`;
            topPerformers.forEach((performer, i) => {
                const emoji = performer.pnl >= 0 ? '🟢' : '🔴';
                text += `${i + 1}. ${emoji} ${performer.symbol}: $${performer.pnl.toLocaleString()}\n`;
            });
        }

        const message: TelegramMessage = {
            text,
            parse_mode: 'HTML'
        };

        await this.sendMessage(message);
    }
}
