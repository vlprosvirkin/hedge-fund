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
import { API_CONFIG } from '../core/config.js';
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

      console.log('Raw account info balances:', accountInfo.balances);

      for (const balance of accountInfo.balances) {
        if (balance.free > 0 || balance.locked > 0) {
          // Get current price for PnL calculation
          let currentPrice = 0;
          try {
            if (balance.asset !== 'USDT') {
              currentPrice = await this.getTokenPrice(balance.asset);
            } else {
              currentPrice = 1; // USDT is pegged to USD
            }
          } catch (error) {
            console.warn(`Failed to get price for ${balance.asset}:`, error);
            // Use a fallback price or skip this position
            if (balance.asset === 'USDT') {
              currentPrice = 1;
            } else {
              // Skip positions with unknown prices to avoid incorrect PnL calculations
              console.warn(`Skipping position for ${balance.asset} due to price fetch failure`);
              continue;
            }
          }

          // Convert wrapped tokens back to original symbols for consistency
          const originalSymbol = this.convertWrappedToOriginal(balance.asset);

          const position = {
            symbol: originalSymbol,
            quantity: balance.free + balance.locked,
            avgPrice: currentPrice, // Use current price as approximation
            unrealizedPnL: 0, // Would need historical data to calculate properly
            realizedPnL: 0, // Would need trade history to calculate
            timestamp: Date.now()
          };

          console.log(`Creating position for ${balance.asset}:`, position);
          positions.push(position);
        }
      }

      console.log('Final positions:', positions);
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
      // Auto-convert BTC to WBTC and ETH to WETH for Aspis API
      const convertedSymbol = this.convertSymbolForAspis(params.symbol);

      // Convert symbol to token format with automatic conversion
      const srcToken = params.side === 'buy' ? 'USDT' : convertedSymbol;
      const dstToken = params.side === 'buy' ? convertedSymbol : 'USDT';

      console.log(`Order conversion: ${params.symbol} -> ${convertedSymbol} (${params.side})`);

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
              console.log('✅ Aspis API response received');

      const balances = Object.entries(response.data).map(([asset, balance]) => {
        const scaledBalance = parseFloat(balance.scaled || '0');
        const nonScaledBalance = parseFloat(balance.non_scaled || '0');

        console.log(`Balance for ${asset}: scaled=${scaledBalance}, non_scaled=${nonScaledBalance}`);

        return {
          asset,
          free: nonScaledBalance, // Use non_scaled instead of scaled
          locked: 0 // Aspis doesn't have locked balances concept
        };
      });

      const totalValue = balances.reduce((sum, balance) => sum + balance.free, 0);
      console.log('Total portfolio value:', totalValue);
      console.log('Processed balances:', balances);

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
    try {
      // Calculate portfolio metrics from current positions
      const positions = await this.getPositions();

      let totalValue = 0;
      let unrealizedPnL = 0;

      for (const position of positions) {
        const positionValue = position.quantity * position.avgPrice;
        totalValue += positionValue;
        // For now, unrealized PnL is 0 since we don't have historical data
        unrealizedPnL += position.unrealizedPnL;
      }

      return {
        totalValue,
        unrealizedPnL,
        realizedPnL: 0,
        // Required fields
        availableBalance: 0,
        usedMargin: 0,
        freeMargin: 0,
        marginLevel: 0,
        // Additional metrics
        fundId: 0,
        fundName: 'Local Portfolio',
        manager: 'System',
        tradeVolume: 0,
        depositVolume: 0,
        assetCount: positions.length,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to get portfolio metrics:', error);
      // Return safe defaults
      return {
        totalValue: 0,
        unrealizedPnL: 0,
        realizedPnL: 0,
        availableBalance: 0,
        usedMargin: 0,
        freeMargin: 0,
        marginLevel: 0,
        fundId: 0,
        fundName: 'Error',
        manager: 'System',
        tradeVolume: 0,
        depositVolume: 0,
        assetCount: 0,
        lastUpdated: new Date().toISOString()
      };
    }
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
    const upperSymbol = symbol.toUpperCase();

    // Check if original symbol is supported
    if (supported.includes(upperSymbol)) {
      return true;
    }

    // Check if wrapped version is supported
    const wrappedSymbol = this.convertSymbolForAspis(upperSymbol);
    return supported.includes(wrappedSymbol) || supported.includes(upperSymbol);
  }

  async getTokenPrice(symbol: string): Promise<number> {
    try {
      // Convert symbol to wrapped version for price lookup
      const wrappedSymbol = this.convertSymbolForAspis(symbol);

      // Get all prices at once (API returns all available prices)
      const response = await axios.get(`https://v2api.aspis.finance/api/rates`, {
        headers: { 'accept': 'application/json' }
      });

      if (response.data?.data?.[wrappedSymbol]?.USD) {
        console.log(`Found price for ${symbol} (${wrappedSymbol}): ${response.data.data[wrappedSymbol].USD}`);
        return response.data.data[wrappedSymbol].USD;
      }

      // If wrapped symbol not found, try with common variations
      const variations = this.getSymbolVariations(wrappedSymbol);
      for (const variation of variations) {
        if (response.data?.data?.[variation]?.USD) {
          console.log(`Found price for ${symbol} (${wrappedSymbol}) using variation: ${variation}`);
          return response.data.data[variation].USD;
        }
      }

      throw new Error(`Price not found for ${symbol} (${wrappedSymbol}) (tried variations: ${variations.join(', ')})`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Price not found')) {
        throw error;
      }
      throw new Error(`Failed to get price for ${symbol}: ${error}`);
    }
  }

  async getTokenPrices(symbols: string[]): Promise<Record<string, number>> {
    try {
      // Get all prices at once (API returns all available prices)
      const response = await axios.get(`https://v2api.aspis.finance/api/rates`, {
        headers: { 'accept': 'application/json' }
      });

      const prices: Record<string, number> = {};

      if (response.data?.data) {
        for (const symbol of symbols) {
          // Convert symbol to wrapped version for price lookup
          const wrappedSymbol = this.convertSymbolForAspis(symbol);

          // Try exact match first with wrapped symbol
          if (response.data.data[wrappedSymbol]?.USD) {
            prices[symbol] = response.data.data[wrappedSymbol].USD;
            console.log(`Found price for ${symbol} (${wrappedSymbol}): ${prices[symbol]}`);
            continue;
          }

          // Try variations if exact match not found
          const variations = this.getSymbolVariations(wrappedSymbol);
          for (const variation of variations) {
            if (response.data.data[variation]?.USD) {
              console.log(`Found price for ${symbol} (${wrappedSymbol}) using variation: ${variation}`);
              prices[symbol] = response.data.data[variation].USD;
              break;
            }
          }
        }
      }

      return prices;
    } catch (error) {
      throw new Error(`Failed to get prices for ${symbols.join(',')}: ${error}`);
    }
  }

  /**
 * Convert trading symbols to Aspis-compatible wrapped tokens
 */
  private convertSymbolForAspis(symbol: string): string {
    const upperSymbol = symbol.toUpperCase();

    // Auto-convert BTC to WBTC and ETH to WETH for Aspis API
    const symbolMapping: Record<string, string> = {
      'BTC': 'WBTC',
      'ETH': 'WETH'
    };

    const convertedSymbol = symbolMapping[upperSymbol] || upperSymbol;

    if (convertedSymbol !== upperSymbol) {
      console.log(`Auto-converting ${upperSymbol} to ${convertedSymbol} for Aspis API`);
    }

    return convertedSymbol;
  }

  /**
   * Convert wrapped tokens back to original symbols for display consistency
   */
  private convertWrappedToOriginal(symbol: string): string {
    const upperSymbol = symbol.toUpperCase();

    // Convert wrapped tokens back to original symbols
    const reverseMapping: Record<string, string> = {
      'WBTC': 'BTC',
      'WETH': 'ETH'
    };

    const originalSymbol = reverseMapping[upperSymbol] || upperSymbol;

    if (originalSymbol !== upperSymbol) {
      console.log(`Converting ${upperSymbol} back to ${originalSymbol} for display`);
    }

    return originalSymbol;
  }

  /**
   * Get common symbol variations for fallback matching
   */
  private getSymbolVariations(symbol: string): string[] {
    const upperSymbol = symbol.toUpperCase();

    // Common variations mapping
    const variations: Record<string, string[]> = {
      'ARB': ['ARB', 'aArbARB'],
      'ETH': ['ETH', 'WETH', 'aBnbETH'],
      'BTC': ['BTC', 'WBTC', 'cbBTC', 'aBnbBTCB'],
      'MATIC': ['MATIC', 'WMATIC', 'MIMATIC'],
      'BNB': ['BNB', 'WBNB', 'aBnbWBNB'],
      'USDC': ['USDC', 'USDC.e', 'aBnbUSDC', 'aPolUSDC'],
      'USDT': ['USDT', 'aArbUSDT', 'aBnbUSDT', 'aPolUSDT'],
      'DAI': ['DAI', 'aArbDAI', 'aPolDAI'],
      'LINK': ['LINK', 'aArbLINK', 'aPolLINK'],
      'AAVE': ['AAVE', 'aArbAAVE', 'aPolAAVE'],
      'WBTC': ['WBTC', 'aArbWBTC', 'aPolWBTC'],
      'WETH': ['WETH', 'aArbWETH', 'aPolWETH'],
      'WMATIC': ['WMATIC', 'aPolWMATIC'],
      'CAKE': ['CAKE', 'aBnbCAKE'],
      'FDUSD': ['FDUSD', 'aBnbFDUSD'],
      'wstETH': ['wstETH', 'aBnbwstETH', 'aPolwstETH'],
      'BAL': ['BAL', 'aPolBAL'],
      'CRV': ['CRV', 'aPolCRV'],
      'SUSHI': ['SUSHI', 'aPolSUSHI'],
      'DPI': ['DPI', 'aPolDPI'],
      'AGEUR': ['agEUR', 'aPolAGEUR']
    };

    // Return variations if found, otherwise return original symbol
    return variations[upperSymbol] || [upperSymbol];
  }
}
