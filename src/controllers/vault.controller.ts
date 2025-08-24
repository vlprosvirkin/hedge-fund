import type { TradingAdapter, MarketDataAdapter } from '../interfaces/adapters.js';
import type { Position, Order } from '../types/index.js';
import { convertQuantityToUsdt, convertUsdtToQuantity } from '../utils.js';
import { TechnicalIndicatorsAdapter } from '../adapters/technical-indicators-adapter.js';
import { TechnicalAnalysisService } from '../services/technical-analysis.service.js';
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
    private technicalIndicators: TechnicalIndicatorsAdapter;
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
        this.technicalIndicators = new TechnicalIndicatorsAdapter();
        this.technicalAnalysis = new TechnicalAnalysisService();
    }

    /**
     * Calculate token quantity based on portfolio weight and available USDT
     */
    async calculatePositionSize(
        symbol: string,
        targetWeight: number,
        availableUsdt: number
    ): Promise<number> {
        try {
            // Calculate USD amount to invest
            const usdAmount = availableUsdt * targetWeight;

            // Get current price
            const currentPrice = await this.getCurrentPrice(symbol);

            // Calculate token quantity
            const quantity = convertUsdtToQuantity(usdAmount, symbol, currentPrice);

            // Apply minimum order constraints
            const minOrderSize = await this.getMinimumOrderSize(symbol);
            const finalQuantity = Math.max(quantity, minOrderSize);

            this.logger.info('📊 Position size calculation', {
                symbol,
                targetWeight,
                availableUsdt,
                usdAmount,
                currentPrice,
                quantity,
                minOrderSize,
                finalQuantity,
                estimatedUsdt: convertQuantityToUsdt(finalQuantity, symbol, currentPrice)
            });

            return finalQuantity;
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
            const currentPositions = await this.getPortfolioPositions();
            const orders: VaultOrder[] = [];

            for (const target of targetWeights) {
                const currentPosition = currentPositions.find(p => p.symbol === target.symbol);
                const currentWeight = currentPosition?.weight || 0;
                const weightDiff = target.weight - currentWeight;

                this.logger.info('📊 Rebalancing analysis', {
                    symbol: target.symbol,
                    currentWeight,
                    targetWeight: target.weight,
                    weightDifference: weightDiff,
                    threshold: 0.05
                });

                // Only rebalance if difference is significant (>5%)
                if (Math.abs(weightDiff) > 0.05) {
                    const side = weightDiff > 0 ? 'buy' : 'sell';
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

                    this.logger.info('🔄 Rebalancing order calculated', {
                        symbol: target.symbol,
                        side,
                        weightDiff,
                        quantity,
                        usdtAmount: vaultOrder.usdtAmount
                    });
                }
            }

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
            // Try to get price from technical indicators API
            const price = await this.technicalIndicators.getPrice(symbol);
            if (price > 0) {
                return price;
            }

            // Fallback to estimated price
            return this.getEstimatedPrice(symbol);
        } catch (error) {
            this.logger.warn(`Failed to get current price for ${symbol}, using estimate:`, error);
            return this.getEstimatedPrice(symbol);
        }
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
            'BTC': 50000,
            'ETH': 3000,
            'ADA': 0.5,
            'DOT': 5,
            'LINK': 10
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
}
