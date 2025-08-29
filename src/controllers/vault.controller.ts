import type { TradingAdapter, MarketDataAdapter } from '../interfaces/adapters.js';
import type { Position, Order } from '../types/index.js';
import { convertQuantityToUsdt, convertUsdtToQuantity } from '../utils.js';
import { Signals } from '../adapters/signals-adapter.js';
import { TechnicalAnalysisService } from '../services/analysis/technical-analysis.service.js';
import pino from 'pino';

export interface VaultOrder {
    symbol: string;
    side: 'buy' | 'sell';
    quantity: number; // Token quantity
    usdtAmount: number; // USDT amount for API
    type: 'market' | 'limit' | 'stop';
    price?: number;
}

export interface VaultPosition {
    symbol: string;
    quantity: number;
    avgPrice: number;
    currentValue: number;
    unrealizedPnL: number;
    realizedPnL: number;
    weight: number; // Portfolio weight
}

export class VaultController {
    private logger: pino.Logger;
    private technicalIndicators: Signals;
    private technicalAnalysis: TechnicalAnalysisService;

    constructor(
        private trading: TradingAdapter,
        private marketData: MarketDataAdapter
    ) {
        this.logger = pino({
            level: 'info',
            transport: {
                target: 'pino-pretty',
                options: {
                    colorize: true
                }
            }
        });
        this.technicalIndicators = new Signals();
        this.technicalAnalysis = new TechnicalAnalysisService();
    }

    /**
     * Calculate token quantity based on portfolio weight and available USDT
     * Enhanced with slippage estimation and market impact analysis
     */
    async calculatePositionSize(
        symbol: string,
        targetWeight: number,
        availableUsdt: number
    ): Promise<number> {
        try {
            // Calculate USD amount to invest
            const usdAmount = availableUsdt * targetWeight;

            // Get current price and market data
            const currentPrice = await this.getCurrentPrice(symbol);
            const marketStats = await this.getMarketStats(symbol);

            // Estimate slippage and market impact
            const slippageEstimate = this.estimateSlippage(usdAmount, marketStats);
            const marketImpact = this.calculateMarketImpact(usdAmount, marketStats);

            // Adjust USD amount for slippage and market impact
            const adjustedUsdAmount = usdAmount * (1 - slippageEstimate - marketImpact);

            // Calculate token quantity
            const quantity = convertUsdtToQuantity(adjustedUsdAmount, symbol, currentPrice);

            // Apply minimum order constraints
            const minOrderSize = await this.getMinimumOrderSize(symbol);
            const finalQuantity = Math.max(quantity, minOrderSize);

            // Apply maximum order constraints
            const maxOrderSize = this.getMaximumOrderSize(symbol, marketStats);
            const constrainedQuantity = Math.min(finalQuantity, maxOrderSize);

            this.logger.info('📊 Enhanced position size calculation', {
                symbol,
                targetWeight,
                availableUsdt,
                usdAmount,
                currentPrice,
                slippageEstimate: slippageEstimate.toFixed(4),
                marketImpact: marketImpact.toFixed(4),
                adjustedUsdAmount,
                quantity,
                minOrderSize,
                maxOrderSize,
                finalQuantity: constrainedQuantity,
                estimatedUsdt: convertQuantityToUsdt(constrainedQuantity, symbol, currentPrice)
            });

            return constrainedQuantity;
        } catch (error) {
            this.logger.error('Failed to calculate position size:', error);
            throw error;
        }
    }

    /**
     * Convert token quantity order to USDT amount for Aspis API
     */
    async convertOrderToUsdt(order: {
        symbol: string;
        side: 'buy' | 'sell';
        quantity: number;
        type: 'market' | 'limit' | 'stop';
        price?: number;
    }): Promise<VaultOrder> {
        try {
            const currentPrice = await this.getCurrentPrice(order.symbol);

            // For buy orders: convert token quantity to USDT amount
            // For sell orders: quantity is already in USDT (from position)
            const usdtAmount = order.side === 'buy'
                ? convertQuantityToUsdt(order.quantity, order.symbol, currentPrice)
                : order.quantity;

            const vaultOrder: VaultOrder = {
                ...order,
                usdtAmount
            };

            this.logger.info('🔄 Order conversion', {
                symbol: order.symbol,
                side: order.side,
                originalQuantity: order.quantity,
                currentPrice,
                usdtAmount,
                estimatedTokens: order.side === 'buy'
                    ? order.quantity
                    : convertUsdtToQuantity(order.quantity, order.symbol, currentPrice)
            });

            return vaultOrder;
        } catch (error) {
            this.logger.error('Failed to convert order to USDT:', error);
            throw error;
        }
    }

    /**
     * Place order with automatic conversion to USDT
     */
    async placeOrder(order: {
        symbol: string;
        side: 'buy' | 'sell';
        quantity: number;
        type: 'market' | 'limit' | 'stop';
        price?: number;
    }): Promise<string> {
        try {
            // Convert to USDT amount
            const vaultOrder = await this.convertOrderToUsdt(order);

            // Place order with USDT amount
            const orderId = await this.trading.placeOrder({
                symbol: vaultOrder.symbol,
                side: vaultOrder.side,
                quantity: vaultOrder.usdtAmount, // Pass USDT amount to adapter
                type: vaultOrder.type,
                ...(vaultOrder.price !== undefined && { price: vaultOrder.price })
            });

            this.logger.info('✅ Order placed successfully', {
                orderId,
                symbol: vaultOrder.symbol,
                side: vaultOrder.side,
                tokenQuantity: order.quantity,
                usdtAmount: vaultOrder.usdtAmount
            });

            return orderId;
        } catch (error) {
            this.logger.error('Failed to place order:', error);
            throw error;
        }
    }

    /**
     * Get portfolio positions with weights
     */
    async getPortfolioPositions(): Promise<VaultPosition[]> {
        try {
            const positions = await this.trading.getPositions();
            const totalValue = await this.calculatePortfolioValue(positions);

            const vaultPositions: VaultPosition[] = await Promise.all(
                positions.map(async (position) => {
                    const currentPrice = await this.getCurrentPrice(position.symbol);
                    const currentValue = position.quantity * currentPrice;
                    const weight = totalValue > 0 ? currentValue / totalValue : 0;

                    return {
                        symbol: position.symbol,
                        quantity: position.quantity,
                        avgPrice: position.avgPrice,
                        currentValue,
                        unrealizedPnL: position.unrealizedPnL,
                        realizedPnL: position.realizedPnL,
                        weight
                    };
                })
            );

            this.logger.info('📈 Portfolio positions', {
                totalPositions: vaultPositions.length,
                totalValue,
                positions: vaultPositions.map(p => ({
                    symbol: p.symbol,
                    quantity: p.quantity,
                    value: p.currentValue,
                    weight: p.weight
                }))
            });

            return vaultPositions;
        } catch (error) {
            this.logger.error('Failed to get portfolio positions:', error);
            throw error;
        }
    }

    /**
     * Calculate rebalancing orders based on target weights
     */
    async calculateRebalancingOrders(
        targetWeights: Array<{ symbol: string; weight: number }>,
        availableUsdt: number
    ): Promise<VaultOrder[]> {
        try {
            this.logger.info('🎯 Starting rebalancing calculation', {
                targetWeightsCount: targetWeights.length,
                availableUsdt,
                targetWeights: targetWeights.map(tw => ({ symbol: tw.symbol, weight: tw.weight }))
            });

            const currentPositions = await this.getPortfolioPositions();
            const orders: VaultOrder[] = [];

            this.logger.info('📊 Current portfolio state', {
                totalPositions: currentPositions.length,
                totalValue: currentPositions.reduce((sum, p) => sum + p.currentValue, 0),
                positions: currentPositions.map(p => ({
                    symbol: p.symbol,
                    quantity: p.quantity,
                    value: p.currentValue,
                    weight: p.weight
                }))
            });

            for (const target of targetWeights) {
                const currentPosition = currentPositions.find(p => p.symbol === target.symbol);
                const currentWeight = currentPosition?.weight || 0;
                const weightDiff = target.weight - currentWeight;

                this.logger.info('📊 Rebalancing analysis', {
                    symbol: target.symbol,
                    currentWeight: (currentWeight * 100).toFixed(2) + '%',
                    targetWeight: (target.weight * 100).toFixed(2) + '%',
                    weightDifference: (weightDiff * 100).toFixed(2) + '%',
                    threshold: '5%',
                    currentPosition: currentPosition ? {
                        quantity: currentPosition.quantity,
                        value: currentPosition.currentValue
                    } : 'No position'
                });

                // Only rebalance if difference is significant (>5%)
                if (Math.abs(weightDiff) > 0.05) {
                    const side = weightDiff > 0 ? 'buy' : 'sell';

                    this.logger.info('🔄 Rebalancing needed', {
                        symbol: target.symbol,
                        side,
                        weightDiff: (weightDiff * 100).toFixed(2) + '%',
                        reason: weightDiff > 0 ? 'Underweight - need to buy' : 'Overweight - need to sell'
                    });

                    const quantity = await this.calculatePositionSize(
                        target.symbol,
                        Math.abs(weightDiff),
                        availableUsdt
                    );

                    const vaultOrder = await this.convertOrderToUsdt({
                        symbol: target.symbol,
                        side,
                        quantity,
                        type: 'market'
                    });

                    orders.push(vaultOrder);

                    this.logger.info('✅ Rebalancing order calculated', {
                        symbol: target.symbol,
                        side,
                        weightDiff: (weightDiff * 100).toFixed(2) + '%',
                        quantity,
                        usdtAmount: vaultOrder.usdtAmount,
                        orderType: vaultOrder.type
                    });
                } else {
                    this.logger.info('⏸️ No rebalancing needed', {
                        symbol: target.symbol,
                        weightDiff: (weightDiff * 100).toFixed(2) + '%',
                        reason: 'Within 5% threshold'
                    });
                }
            }

            this.logger.info('🎯 Rebalancing calculation completed', {
                totalOrders: orders.length,
                orders: orders.map(o => ({
                    symbol: o.symbol,
                    side: o.side,
                    usdtAmount: o.usdtAmount
                }))
            });

            return orders;
        } catch (error) {
            this.logger.error('Failed to calculate rebalancing orders:', error);
            throw error;
        }
    }

    /**
     * Execute rebalancing orders
     */
    async executeRebalancing(orders: VaultOrder[]): Promise<string[]> {
        const orderIds: string[] = [];

        for (const order of orders) {
            try {
                const orderId = await this.trading.placeOrder({
                    symbol: order.symbol,
                    side: order.side,
                    quantity: order.usdtAmount,
                    type: order.type,
                    ...(order.price !== undefined && { price: order.price })
                });

                orderIds.push(orderId);
                this.logger.info('✅ Rebalancing order executed', {
                    orderId,
                    symbol: order.symbol,
                    side: order.side,
                    usdtAmount: order.usdtAmount
                });
            } catch (error) {
                this.logger.error('Failed to execute rebalancing order:', error);
                throw error;
            }
        }

        return orderIds;
    }

    // Private helper methods
    private async getCurrentPrice(symbol: string): Promise<number> {
        try {
            // Try to get price from Aspis API first (most reliable)
            const price = await (this.trading as any).getTokenPrice(symbol);
            if (price > 0) {
                this.logger.info(`Got price for ${symbol} from Aspis API: $${price}`);
                return price;
            }
        } catch (error) {
            this.logger.warn(`Failed to get price for ${symbol} from Aspis API:`, error);
        }

        try {
            // Fallback to technical indicators API
            const price = await this.technicalIndicators.getPrice(symbol);
            if (price > 0) {
                this.logger.info(`Got price for ${symbol} from Technical Indicators API: $${price}`);
                return price;
            }
        } catch (error) {
            this.logger.warn(`Failed to get price for ${symbol} from Technical Indicators API:`, error);
        }

        // Final fallback to estimated price
        const estimatedPrice = this.getEstimatedPrice(symbol);
        this.logger.warn(`Using estimated price for ${symbol}: $${estimatedPrice}`);
        return estimatedPrice;
    }

    private async getMinimumOrderSize(symbol: string): Promise<number> {
        try {
            // Try to get minimum order size from trading adapter
            const symbolInfo = await (this.trading as any).getSymbolInfo(symbol);
            return symbolInfo.minQty || this.getEstimatedMinOrderSize(symbol);
        } catch (error) {
            this.logger.warn(`Failed to get minimum order size for ${symbol}, using estimate:`, error);
            return this.getEstimatedMinOrderSize(symbol);
        }
    }

    private getEstimatedPrice(symbol: string): number {
        const prices: Record<string, number> = {
            'BTC': 114559.26,
            'ETH': 4767.62,
            'ADA': 0.8966691488914345,
            'DOT': 4.043864419907151,
            'LINK': 25.6261780348389,
            'BNB': 863.27021392,
            'SOL': 204.7951866728023,
            'MATIC': 0.24395388229448178,
            'AVAX': 25.13015118530153,
            'UNI': 10.93845490117476,
            'ARB': 0.57
        };
        return prices[symbol] || 1;
    }

    private getEstimatedMinOrderSize(symbol: string): number {
        const minSizes: Record<string, number> = {
            'BTC': 0.001,
            'ETH': 0.01,
            'ADA': 100,
            'DOT': 1,
            'LINK': 5
        };
        return minSizes[symbol] || 1;
    }

    private async calculatePortfolioValue(positions: Position[]): Promise<number> {
        let totalValue = 0;

        for (const position of positions) {
            const currentPrice = await this.getCurrentPrice(position.symbol);
            totalValue += position.quantity * currentPrice;
        }

        return totalValue;
    }

    /**
     * Estimate slippage based on order size and market liquidity
     */
    private estimateSlippage(orderSize: number, marketStats: any): number {
        const volume24h = marketStats.volume24h || 0;
        const price = marketStats.price || 1;

        // Calculate order size as percentage of daily volume
        const volumePercentage = (orderSize / volume24h) * 100;

        // Slippage model: higher volume percentage = higher slippage
        if (volumePercentage < 0.1) return 0.0001; // 0.01% for very small orders
        if (volumePercentage < 1.0) return 0.001;  // 0.1% for small orders
        if (volumePercentage < 5.0) return 0.005;  // 0.5% for medium orders
        if (volumePercentage < 10.0) return 0.01;  // 1% for large orders

        return 0.02; // 2% for very large orders (discourage)
    }

    /**
     * Calculate market impact based on order size and market depth
     */
    private calculateMarketImpact(orderSize: number, marketStats: any): number {
        const volume24h = marketStats.volume24h || 0;
        const price = marketStats.price || 1;

        // Calculate order size as percentage of daily volume
        const volumePercentage = (orderSize / volume24h) * 100;

        // Market impact model: exponential increase with order size
        const baseImpact = 0.0005; // 0.05% base impact
        const impactMultiplier = Math.pow(volumePercentage / 10, 0.5); // Square root scaling

        return baseImpact * impactMultiplier;
    }

    /**
     * Get maximum order size based on market conditions
     */
    private getMaximumOrderSize(symbol: string, marketStats: any): number {
        const volume24h = marketStats.volume24h || 0;
        const price = marketStats.price || 1;

        // Maximum order size: 5% of daily volume
        const maxVolumePercentage = 0.05;
        const maxUsdAmount = volume24h * maxVolumePercentage;

        // Convert to token quantity
        return convertUsdtToQuantity(maxUsdAmount, symbol, price);
    }

    /**
     * Get market statistics for a symbol
     */
    private async getMarketStats(symbol: string): Promise<any> {
        try {
            // Try to get from market data adapter
            if (this.marketData && typeof this.marketData.getMarketStats === 'function') {
                return await this.marketData.getMarketStats(symbol);
            }

            // Fallback to basic stats
            const price = await this.getCurrentPrice(symbol);
            return {
                price,
                volume24h: 1000000, // Default 1M volume
                priceChange24h: 0
            };
        } catch (error) {
            this.logger.warn(`Failed to get market stats for ${symbol}:`, error);
            return {
                price: 1,
                volume24h: 1000000,
                priceChange24h: 0
            };
        }
    }
}
