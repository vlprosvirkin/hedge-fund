# Aspis Trading API Setup Guide

## Overview

To use the real Aspis Trading API (instead of mock mode), you need to create an Agent Fund vault and get your API key.

## Step-by-Step Setup

### 1. Create Agent Fund Vault

1. Visit [https://v2.aspis.finance/create-vault](https://v2.aspis.finance/create-vault)
2. Select **Agent Fund** option
3. Complete the vault creation process
4. Note down your **API Key**

### 2. Configure Environment

Add your API key to `.env`:

```env
# Aspis Trading API
ASPIS_API_KEY=your_api_key_here

# Other required keys
BINANCE_API_KEY=your_binance_api_key
BINANCE_SECRET_KEY=your_binance_secret_key
OPENAI_API_KEY=your_openai_api_key

# System configuration
MOCK_MODE=false
RISK_PROFILE=neutral
```

### 3. Test Connection

```bash
# Build the project
npm run build

# Test with real API
npm start
```

## API Key Usage

The Aspis API key is used as follows:

```typescript
// In your code
const adapter = new AspisAdapter(process.env.ASPIS_API_KEY);

// Connect to real API
await adapter.connect();

// Place real orders
const orderId = await adapter.placeOrder({
  symbol: 'BTCUSDT',
  side: 'buy',
  quantity: 0.001,
  type: 'market'
});
```

## Mock Mode vs Real Mode

### Mock Mode (Default)
- No API key required
- Simulated trading
- Safe for testing
- No real money involved

### Real Mode
- Requires valid API key
- Real trading execution
- Real money at risk
- Production use only

## Security Notes

- Keep your API key secure
- Never commit API keys to version control
- Use environment variables
- Test thoroughly in mock mode first

## Troubleshooting

### Common Issues

1. **"Mock mode" message**
   - Check that `ASPIS_API_KEY` is set in `.env`
   - Ensure `MOCK_MODE=false`

2. **Connection errors**
   - Verify API key is correct
   - Check network connectivity
   - Ensure vault is active

3. **Order rejection**
   - Check symbol format (e.g., 'BTCUSDT')
   - Verify minimum quantities
   - Check account balance

## Support

For Aspis platform issues:
- Visit [https://v2.aspis.finance](https://v2.aspis.finance)
- Check their documentation
- Contact Aspis support
