import type { TradingAdapter } from '../interfaces/adapters.js';
import type { Position, Order, FillEvent } from '../types/index.js';
import { API_CONFIG } from '../config.js';
import { v4 as uuidv4 } from 'uuid';

export class AspisAdapter implements TradingAdapter {
  private isConnectedFlag = false;
  private fillCallbacks: ((fillEvent: FillEvent) => void)[] = [];
  private orders = new Map<string, Order>();
  private positions = new Map<string, Position>();

  constructor(
    private apiKey?: string,
    private vaultAddress?: string,
    private baseUrl?: string
  ) {
    // Use config values if not provided
    this.apiKey = apiKey || API_CONFIG.aspis.apiKey;
    this.vaultAddress = vaultAddress || API_CONFIG.aspis.vaultAddress;
    this.baseUrl = baseUrl || API_CONFIG.aspis.baseUrl;

    if (!this.apiKey) {
      throw new Error('ASPIS_API_KEY is required');
    }
    if (!this.vaultAddress) {
      throw new Error('ASPIS_VAULT_ADDRESS is required');
    }
  }

  async connect(): Promise<void> {
    try {
      // Authenticate with Aspis API
      const response = await fetch(`${this.baseUrl}/auth/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vaultAddress: this.vaultAddress
        })
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
      }

      this.isConnectedFlag = true;
      console.log('Connected to Aspis trading API');
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
    const response = await fetch(`${this.baseUrl}/trading/positions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get positions: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  async syncPositions(): Promise<Position[]> {
    return this.getPositions();
  }

  async placeOrder(params: {
    symbol: string;
    side: 'buy' | 'sell';
    quantity: number;
    type: 'market' | 'limit' | 'stop';
    price?: number;
  }): Promise<string> {
    const response = await fetch(`${this.baseUrl}/trading/order`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...params,
        vaultAddress: this.vaultAddress
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to place order: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result.orderId;
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/trading/order/${orderId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    return response.ok;
  }

  async getOrder(orderId: string): Promise<Order | null> {
    const response = await fetch(`${this.baseUrl}/trading/order/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  }

  async getOrders(symbol?: string): Promise<Order[]> {
    const params = symbol ? `?symbol=${symbol}` : '';
    const response = await fetch(`${this.baseUrl}/trading/orders${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get orders: ${response.status} ${response.statusText}`);
    }

    return await response.json();
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
    const response = await fetch(`${this.baseUrl}/account/info`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get account info: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  async getTradingFees(symbol?: string): Promise<{
    makerFee: number;
    takerFee: number;
    symbol?: string;
  }> {
    const response = await fetch(`${this.baseUrl}/trading/fees${symbol ? `?symbol=${symbol}` : ''}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get trading fees: ${response.status} ${response.statusText}`);
    }

    return await response.json();
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
    const params = new URLSearchParams();
    if (symbol) params.append('symbol', symbol);
    params.append('limit', limit.toString());

    const response = await fetch(`${this.baseUrl}/trading/history?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get trade history: ${response.status} ${response.statusText}`);
    }

    return await response.json();
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
    const response = await fetch(`${this.baseUrl}/trading/symbols/${symbol}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get symbol info: ${response.status} ${response.statusText}`);
    }

    return await response.json();
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
    const response = await fetch(`${this.baseUrl}/trading/conditional-order`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      throw new Error(`Failed to place conditional order: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result.orderId;
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
    const response = await fetch(`${this.baseUrl}/portfolio/metrics`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get portfolio metrics: ${response.status} ${response.statusText}`);
    }

    return await response.json();
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
    const supported = ['BTC', 'ETH', 'ADA', 'DOT', 'LINK'];
    return supported.includes(symbol.toUpperCase());
  }
}
