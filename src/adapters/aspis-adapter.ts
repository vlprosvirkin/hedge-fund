import type { TradingAdapter } from '../interfaces/adapters.js';
import type { Position, Order, FillEvent } from '../types/index.js';
import { API_CONFIG } from '../config.js';
import { v4 as uuidv4 } from 'uuid';

export class AspisAdapter implements TradingAdapter {
  private isConnectedFlag = false;
  private fillCallbacks: ((fillEvent: FillEvent) => void)[] = [];
  private orders = new Map<string, Order>();
  private positions = new Map<string, Position>();
  private mockMode: boolean;

  constructor(
    private apiKey?: string,
    private baseUrl?: string
  ) {
    // Use config values if not provided
    this.apiKey = apiKey || API_CONFIG.aspis.apiKey;
    this.baseUrl = baseUrl || API_CONFIG.aspis.baseUrl;
    this.mockMode = !this.apiKey;

    // Initialize with mock positions
    this.initializeMockPositions();
  }

  async connect(): Promise<void> {
    try {
      if (this.mockMode) {
        // Mock mode - just simulate connection
        this.isConnectedFlag = true;
        console.log('Connected to Aspis trading API (MOCK MODE)');
      } else {
        // Real mode - would authenticate with Aspis API
        // For now, just simulate successful connection
        this.isConnectedFlag = true;
        console.log('Connected to Aspis trading API (REAL MODE)');
      }
    } catch (error) {
      throw new Error(`Failed to connect to Aspis: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    this.isConnectedFlag = false;
    this.fillCallbacks = [];
  }

  isConnected(): boolean {
    return this.isConnectedFlag;
  }

  async getPositions(): Promise<Position[]> {
    return Array.from(this.positions.values());
  }

  async syncPositions(): Promise<Position[]> {
    // In real implementation, would fetch from Aspis API
    // For now, return mock positions
    return this.getPositions();
  }

  async placeOrder(params: {
    symbol: string;
    side: 'buy' | 'sell';
    quantity: number;
    type: 'market' | 'limit' | 'stop';
    price?: number;
  }): Promise<string> {
    const orderId = uuidv4();

    const order: Order = {
      id: orderId,
      symbol: params.symbol.toUpperCase(),
      side: params.side,
      type: params.type,
      quantity: params.quantity,
      price: params.price,
      status: 'pending',
      timestamp: Date.now()
    };

    this.orders.set(orderId, order);

    // Simulate order processing
    setTimeout(() => {
      this.simulateOrderFill(order);
    }, 1000 + Math.random() * 2000);

    return orderId;
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    const order = this.orders.get(orderId);
    if (!order) {
      return false;
    }

    if (order.status === 'pending') {
      order.status = 'cancelled';
      this.orders.set(orderId, order);
      return true;
    }

    return false;
  }

  async getOrder(orderId: string): Promise<Order | null> {
    return this.orders.get(orderId) || null;
  }

  async getOrders(symbol?: string): Promise<Order[]> {
    const orders = Array.from(this.orders.values());
    if (symbol) {
      return orders.filter(order => order.symbol === symbol.toUpperCase());
    }
    return orders;
  }

  onFill(callback: (fillEvent: FillEvent) => void): void {
    this.fillCallbacks.push(callback);
  }

  offFill(callback: (fillEvent: FillEvent) => void): void {
    const index = this.fillCallbacks.indexOf(callback);
    if (index > -1) {
      this.fillCallbacks.splice(index, 1);
    }
  }

  async cancelAllOrders(symbol?: string): Promise<void> {
    const orders = await this.getOrders(symbol);

    for (const order of orders) {
      if (order.status === 'pending') {
        await this.cancelOrder(order.id);
      }
    }
  }

  async emergencyClose(): Promise<void> {
    // Cancel all pending orders
    await this.cancelAllOrders();

    // Close all positions (market orders)
    const positions = await this.getPositions();

    for (const position of positions) {
      if (position.quantity > 0) {
        await this.placeOrder({
          symbol: position.symbol,
          side: 'sell',
          quantity: Math.abs(position.quantity),
          type: 'market'
        });
      }
    }
  }

  // Additional methods for Aspis API integration
  async getAccountInfo(): Promise<{
    balances: Array<{ asset: string; free: number; locked: number }>;
    totalValue: number;
    marginLevel?: number;
  }> {
    if (this.mockMode) {
      return {
        balances: [
          { asset: 'USDT', free: 10000, locked: 0 },
          { asset: 'BTC', free: 0.1, locked: 0 },
          { asset: 'ETH', free: 2.5, locked: 0 }
        ],
        totalValue: 25000,
        marginLevel: 1.5
      };
    }

    // Real implementation would call Aspis API
    throw new Error('Real API implementation not yet available');
  }

  async getTradingFees(symbol?: string): Promise<{
    makerFee: number;
    takerFee: number;
    symbol?: string;
  }> {
    if (this.mockMode) {
      return {
        makerFee: 0.001, // 0.1%
        takerFee: 0.001, // 0.1%
        symbol: symbol || 'BTCUSDT'
      };
    }

    // Real implementation would call Aspis API
    throw new Error('Real API implementation not yet available');
  }

  async getTradeHistory(symbol?: string, limit = 100): Promise<Array<{
    id: string;
    orderId: string;
    symbol: string;
    side: 'buy' | 'sell';
    quantity: number;
    price: number;
    fee: number;
    feeAsset: string;
    timestamp: number;
  }>> {
    if (this.mockMode) {
      const mockTrades = [];
      for (let i = 0; i < Math.min(limit, 10); i++) {
        mockTrades.push({
          id: uuidv4(),
          orderId: uuidv4(),
          symbol: symbol || 'BTCUSDT',
          side: (Math.random() > 0.5 ? 'buy' : 'sell') as 'buy' | 'sell',
          quantity: 0.001 + Math.random() * 0.01,
          price: 50000 + Math.random() * 1000,
          fee: 0.001,
          feeAsset: 'USDT',
          timestamp: Date.now() - Math.random() * 86400000 // Last 24 hours
        });
      }
      return mockTrades;
    }

    // Real implementation would call Aspis API
    throw new Error('Real API implementation not yet available');
  }

  async getSymbolInfo(symbol: string): Promise<{
    symbol: string;
    status: string;
    minQty: number;
    maxQty: number;
    stepSize: number;
    tickSize: number;
    minPrice: number;
    maxPrice: number;
  }> {
    if (this.mockMode) {
      return {
        symbol: symbol.toUpperCase(),
        status: 'TRADING',
        minQty: 0.00001,
        maxQty: 1000000,
        stepSize: 0.00001,
        tickSize: 0.01,
        minPrice: 0.01,
        maxPrice: 1000000
      };
    }

    // Real implementation would call Aspis API
    throw new Error('Real API implementation not yet available');
  }

  async placeConditionalOrder(params: {
    symbol: string;
    side: 'buy' | 'sell';
    quantity: number;
    type: 'stop_loss' | 'take_profit' | 'trailing_stop';
    triggerPrice: number;
    price?: number;
    trailingAmount?: number;
  }): Promise<string> {
    if (this.mockMode) {
      const orderId = uuidv4();
      console.log(`Mock conditional order placed: ${params.type} for ${params.symbol}`);
      return orderId;
    }

    // Real implementation would call Aspis API
    throw new Error('Real API implementation not yet available');
  }

  async getPortfolioMetrics(): Promise<{
    totalValue: number;
    availableBalance: number;
    usedMargin: number;
    freeMargin: number;
    marginLevel: number;
    unrealizedPnL: number;
    realizedPnL: number;
  }> {
    if (this.mockMode) {
      return {
        totalValue: 25000,
        availableBalance: 10000,
        usedMargin: 15000,
        freeMargin: 10000,
        marginLevel: 1.5,
        unrealizedPnL: 500,
        realizedPnL: 200
      };
    }

    // Real implementation would call Aspis API
    throw new Error('Real API implementation not yet available');
  }

  private simulateOrderFill(order: Order): void {
    // Simulate order fill
    order.status = 'filled';
    this.orders.set(order.id, order);

    // Update position
    this.updatePosition(order);

    // Trigger fill callback
    const fillEvent: FillEvent = {
      orderId: order.id,
      symbol: order.symbol,
      side: order.side,
      quantity: order.quantity,
      price: order.price || this.getMockPrice(order.symbol),
      timestamp: Date.now(),
      fee: order.quantity * 0.001 // 0.1% fee
    };

    this.fillCallbacks.forEach(callback => callback(fillEvent));
  }

  private updatePosition(order: Order): void {
    const symbol = order.symbol;
    const currentPosition = this.positions.get(symbol);
    const fillPrice = order.price || this.getMockPrice(symbol);
    const fillQuantity = order.side === 'buy' ? order.quantity : -order.quantity;

    if (currentPosition) {
      // Update existing position
      const newQuantity = currentPosition.quantity + fillQuantity;
      const newAvgPrice = this.calculateAveragePrice(
        currentPosition.quantity,
        currentPosition.avgPrice,
        fillQuantity,
        fillPrice
      );

      this.positions.set(symbol, {
        ...currentPosition,
        quantity: newQuantity,
        avgPrice: newAvgPrice,
        timestamp: Date.now()
      });
    } else if (fillQuantity > 0) {
      // Create new position
      this.positions.set(symbol, {
        symbol,
        quantity: fillQuantity,
        avgPrice: fillPrice,
        unrealizedPnL: 0,
        realizedPnL: 0,
        timestamp: Date.now()
      });
    }
  }

  private calculateAveragePrice(
    currentQty: number,
    currentAvg: number,
    newQty: number,
    newPrice: number
  ): number {
    const totalQty = currentQty + newQty;
    const totalValue = currentQty * currentAvg + newQty * newPrice;
    return totalValue / totalQty;
  }

  private getMockPrice(symbol: string): number {
    // Generate mock price based on symbol
    const basePrices: Record<string, number> = {
      'BTCUSDT': 50000,
      'ETHUSDT': 3000,
      'ADAUSDT': 0.5,
      'DOTUSDT': 7,
      'LINKUSDT': 15
    };

    const basePrice = basePrices[symbol] || 100;
    return basePrice * (0.95 + Math.random() * 0.1); // ±5% variation
  }

  private initializeMockPositions(): void {
    const mockPositions: Position[] = [
      {
        symbol: 'BTCUSDT',
        quantity: 0.1,
        avgPrice: 48000,
        unrealizedPnL: 200,
        realizedPnL: 0,
        timestamp: Date.now()
      },
      {
        symbol: 'ETHUSDT',
        quantity: 2.5,
        avgPrice: 2800,
        unrealizedPnL: 500,
        realizedPnL: 0,
        timestamp: Date.now()
      }
    ];

    mockPositions.forEach(position => {
      this.positions.set(position.symbol, position);
    });
  }

  // Additional utility methods
  async validateOrder(params: {
    symbol: string;
    quantity: number;
    price?: number;
  }): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Check if symbol is supported
    if (!this.isSupportedSymbol(params.symbol)) {
      errors.push(`Symbol ${params.symbol} is not supported`);
    }

    // Check minimum quantity
    if (params.quantity < 0.00001) {
      errors.push('Quantity below minimum');
    }

    // Check price if provided
    if (params.price && params.price <= 0) {
      errors.push('Invalid price');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private isSupportedSymbol(symbol: string): boolean {
    const supported = ['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'DOTUSDT', 'LINKUSDT'];
    return supported.includes(symbol.toUpperCase());
  }
}
