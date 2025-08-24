import type { TradingAdapter } from '../interfaces/adapters.js';
import type {
  Position,
  Order,
  FillEvent,
  ExecuteOrderInput,
  ExecuteOrderResponse,
  GetBalanceResponse,
  GetVaultByApiKeyResponse,
  TradingFees,
  TradeHistoryItem,
  SymbolInfo,
  ConditionalOrderParams,
  PortfolioMetrics,
  OrderValidationParams,
  OrderValidationResult,
  AccountInfo
} from '../types/index.js';
import { API_CONFIG } from '../config.js';
import { v4 as uuidv4 } from 'uuid';
import axios, { AxiosError } from 'axios';

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

    console.log('AspisAdapter config:', {
      apiKey: this.apiKey ? `${this.apiKey.substring(0, 10)}...` : 'undefined',
      vaultAddress: this.vaultAddress ? `${this.vaultAddress.substring(0, 20)}...` : 'undefined',
      baseUrl: this.baseUrl
    });

    if (!this.apiKey) {
      throw new Error('ASPIS_API_KEY is required');
    }
    if (!this.vaultAddress) {
      throw new Error('ASPIS_VAULT_ADDRESS is required');
    }
  }

  async connect(): Promise<void> {
    try {
      // Test connection by getting balance
      const response = await axios.get<GetBalanceResponse>(`${this.baseUrl}/get_balance`, {
        headers: {
          'x-api-key': this.apiKey!,
        },
        params: {
          chainId: '42161',
          vault: this.vaultAddress,
        },
        timeout: 30000,
      });

      this.isConnectedFlag = true;
      console.log('Connected to Aspis trading API');
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(`Failed to connect to Aspis: ${error.response?.status} ${error.response?.statusText}`);
      }
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
    // Get positions from balance endpoint
    try {
      const accountInfo = await this.getAccountInfo();
      const positions: Position[] = [];

      for (const balance of accountInfo.balances) {
        if (balance.free > 0 || balance.locked > 0) {
          positions.push({
            symbol: balance.asset,
            quantity: balance.free + balance.locked,
            avgPrice: 0, // Would need price data to calculate
            unrealizedPnL: 0,
            realizedPnL: 0,
            timestamp: Date.now()
          });
        }
      }

      return positions;
    } catch (error) {
      console.warn('Failed to get positions:', error);
      return [];
    }
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
    try {
      // Convert symbol to token format (BTC -> BTC, ETH -> ETH)
      const srcToken = params.side === 'buy' ? 'USDT' : params.symbol;
      const dstToken = params.side === 'buy' ? params.symbol : 'USDT';

      const input: ExecuteOrderInput = {
        chainId: '42161',
        vault: this.vaultAddress!,
        srcToken,
        dstToken,
        amountIn: params.quantity.toString(),
        exchange: 'ODOS',
        slippage: '10'
      };

      const response = await axios.post<ExecuteOrderResponse>(`${this.baseUrl}/execute_order`, input, {
        headers: {
          'x-api-key': this.apiKey!,
        },
        timeout: 90000, // 90 seconds timeout
      });

      return response.data.tx_hash || 'order-' + Date.now();
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error('Execute order error:', {
          error: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
        throw new Error(`Failed to place order: ${error.response?.status} ${error.response?.statusText}`);
      }
      throw new Error(`Failed to place order: ${error}`);
    }
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    // Aspis API executes orders immediately, no cancellation possible
    return false;
  }

  async getOrder(orderId: string): Promise<Order | null> {
    // Aspis API executes orders immediately, no order status tracking
    // Return null as orders are not tracked after execution
    return null;
  }

  async getOrders(symbol?: string): Promise<Order[]> {
    // Aspis API doesn't have a direct orders endpoint
    // Orders are executed immediately, so we return empty array
    // In a real implementation, you would track executed orders
    return [];
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
  async getAccountInfo(): Promise<AccountInfo> {
    try {
      const response = await axios.get<GetBalanceResponse>(`${this.baseUrl}/get_balance`, {
        headers: {
          'x-api-key': this.apiKey!,
        },
        params: {
          chainId: '42161',
          vault: this.vaultAddress,
        },
        timeout: 30000,
      });

      // Convert Aspis balance format to our format
      const balances = Object.entries(response.data).map(([asset, balance]) => ({
        asset,
        free: parseFloat(balance.scaled || '0'),
        locked: 0 // Aspis doesn't have locked balances concept
      }));

      const totalValue = balances.reduce((sum, balance) => sum + balance.free, 0);

      return {
        balances,
        totalValue
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(`Failed to get account info: ${error.response?.status} ${error.response?.statusText}`);
      }
      throw new Error(`Failed to get account info: ${error}`);
    }
  }

  async getTradingFees(symbol?: string): Promise<TradingFees> {
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

  async getTradeHistory(symbol?: string, limit = 100): Promise<TradeHistoryItem[]> {
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

  async getSymbolInfo(symbol: string): Promise<SymbolInfo> {
    // Aspis API doesn't have symbol info endpoint
    // Return default values for supported symbols
    if (!this.isSupportedSymbol(symbol)) {
      throw new Error(`Symbol ${symbol} is not supported`);
    }

    return {
      symbol,
      status: 'TRADING',
      minQty: 0.00001,
      maxQty: 1000000,
      stepSize: 0.00001,
      tickSize: 0.01,
      minPrice: 0.01,
      maxPrice: 1000000
    };
  }

  async placeConditionalOrder(params: ConditionalOrderParams): Promise<string> {
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

  async getPortfolioMetrics(): Promise<PortfolioMetrics> {
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
  async validateOrder(params: OrderValidationParams): Promise<OrderValidationResult> {
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

  async getSupportedTokens(): Promise<string[]> {
    try {
      const response = await axios.get<string[]>(`${this.baseUrl}/get_supported_tokens`, {
        headers: {
          'x-api-key': this.apiKey!,
          'Content-Type': 'application/json',
        },
        params: {
          chainId: '42161',
        },
      });

      return response.data;
    } catch (error) {
      console.warn('Failed to get supported tokens, using fallback:', error);
      return ['BTC', 'ETH', 'ADA', 'DOT', 'LINK'];
    }
  }

  private isSupportedSymbol(symbol: string): boolean {
    const supported = ['BTC', 'ETH', 'ADA', 'DOT', 'LINK'];
    return supported.includes(symbol.toUpperCase());
  }

}
