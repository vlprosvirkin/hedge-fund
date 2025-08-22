# Aspis API Methods Documentation

## Overview

Our `AspisAdapter` implements the core trading methods needed for the hedge fund MVP. The adapter supports both mock mode (for testing) and real API mode (for production).

## Core Trading Methods

### Connection Management
- `connect()` - Establish connection to Aspis API
- `disconnect()` - Close connection
- `isConnected()` - Check connection status

### Position Management
- `getPositions()` - Get current positions
- `syncPositions()` - Sync positions from exchange

### Order Management
- `placeOrder(params)` - Place new order (market/limit/stop)
- `cancelOrder(orderId)` - Cancel specific order
- `getOrder(orderId)` - Get order details
- `getOrders(symbol?)` - Get all orders (optionally filtered by symbol)
- `cancelAllOrders(symbol?)` - Cancel all orders (optionally filtered by symbol)

### Event Handling
- `onFill(callback)` - Register fill event callback
- `offFill(callback)` - Unregister fill event callback

### Emergency Functions
- `emergencyClose()` - Close all positions and cancel orders

## Additional Methods

### Account Information
- `getAccountInfo()` - Get account balances and total value
- `getPortfolioMetrics()` - Get portfolio performance metrics

### Trading Information
- `getTradingFees(symbol?)` - Get maker/taker fees
- `getTradeHistory(symbol?, limit?)` - Get recent trades
- `getSymbolInfo(symbol)` - Get symbol trading rules

### Advanced Orders
- `placeConditionalOrder(params)` - Place stop-loss, take-profit, or trailing stop orders

## Usage Examples

### Basic Trading
```typescript
const adapter = new AspisAdapter(apiKey, secretKey);

// Connect
await adapter.connect();

// Place market order
const orderId = await adapter.placeOrder({
  symbol: 'BTCUSDT',
  side: 'buy',
  quantity: 0.001,
  type: 'market'
});

// Get positions
const positions = await adapter.getPositions();
```

### Account Information
```typescript
// Get account info
const account = await adapter.getAccountInfo();
console.log(`Total Value: $${account.totalValue}`);

// Get portfolio metrics
const metrics = await adapter.getPortfolioMetrics();
console.log(`Unrealized PnL: $${metrics.unrealizedPnL}`);
```

### Event Handling
```typescript
// Listen for fill events
adapter.onFill((fillEvent) => {
  console.log(`Order filled: ${fillEvent.orderId}`);
  console.log(`Price: $${fillEvent.price}`);
});
```

## Mock Mode

When no API credentials are provided, the adapter automatically runs in mock mode:

```typescript
// Mock mode - no API keys needed
const mockAdapter = new AspisAdapter();

// All methods return simulated data
const positions = await mockAdapter.getPositions();
const account = await mockAdapter.getAccountInfo();
```

## Real API Integration

For production use, provide API credentials:

```typescript
// Real mode - requires API key
const realAdapter = new AspisAdapter(
  process.env.ASPIS_API_KEY
);
```

## Error Handling

All methods throw descriptive errors:

```typescript
try {
  await adapter.placeOrder({...});
} catch (error) {
  console.error('Order failed:', error.message);
}
```

## Future Enhancements

When integrating with the real Aspis API, the following methods will need real implementations:

1. **Authentication** - HMAC signature generation
2. **Rate Limiting** - Respect API rate limits
3. **WebSocket** - Real-time order updates
4. **Error Handling** - Handle API-specific errors
5. **Validation** - Validate orders against exchange rules

## API Endpoints (Future Implementation)

Based on typical trading API patterns, these endpoints would be used:

- `GET /api/v1/account` - Account information
- `GET /api/v1/positions` - Current positions
- `POST /api/v1/orders` - Place order
- `DELETE /api/v1/orders/{id}` - Cancel order
- `GET /api/v1/orders` - Get orders
- `GET /api/v1/trades` - Trade history
- `GET /api/v1/fees` - Trading fees
- `GET /api/v1/symbols/{symbol}` - Symbol information

## Testing

The mock mode allows for comprehensive testing without real API calls:

```typescript
// Test order placement
const orderId = await adapter.placeOrder({
  symbol: 'BTCUSDT',
  side: 'buy',
  quantity: 0.001,
  type: 'market'
});

// Test position tracking
const positions = await adapter.getPositions();

// Test emergency procedures
await adapter.emergencyClose();
```
