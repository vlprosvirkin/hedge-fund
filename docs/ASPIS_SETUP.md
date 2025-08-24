# Aspis Trading API Setup Guide

## Overview

To use the Aspis Trading API, you need to create an Agent Fund vault and get your API key and vault address.

## Step-by-Step Setup

### 1. Create Agent Fund Vault

1. Visit [https://v2.aspis.finance/create-vault](https://v2.aspis.finance/create-vault)
2. Select **Agent Fund** option
3. Complete the vault creation process
4. Note down your **API Key** and **Vault Address**

**Important**: You need both the API key and the vault address. The vault address is typically a long hexadecimal string (e.g., `0x1234567890abcdef...`) that identifies your specific vault on the blockchain.

### 2. Configure Environment

Add your API key and vault address to `.env`:

```env
# Aspis Trading API
ASPIS_API_KEY=your_api_key_here
ASPIS_VAULT_ADDRESS=0x1234567890abcdef...  # Your vault address from Aspis

# Other required keys
BINANCE_API_KEY=your_binance_api_key
BINANCE_SECRET_KEY=your_binance_secret_key
OPENAI_API_KEY=your_openai_api_key

# System configuration
RISK_PROFILE=neutral
```

**Note**: Replace `0x1234567890abcdef...` with your actual vault address from the Aspis platform.

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

## Production Mode

The system runs in production mode with real trading execution:
- Requires valid API key and vault address
- Real trading execution through Aspis
- Real money at risk
- Production use only

## Security Notes

- Keep your API key secure
- Never commit API keys to version control
- Use environment variables
- Test thoroughly in mock mode first

## Troubleshooting

### Common Issues

1. **"ASPIS_API_KEY is required" error**
   - Check that `ASPIS_API_KEY` is set in `.env`
   - Verify `ASPIS_VAULT_ADDRESS` is also set

2. **"ASPIS_VAULT_ADDRESS is required" error**
   - Ensure `ASPIS_VAULT_ADDRESS` is set in `.env`
   - The vault address should be a valid Ethereum address (0x...)
   - Get the vault address from your Aspis dashboard

2. **Connection errors**
   - Verify API key is correct
   - Check network connectivity
   - Ensure vault is active

3. **Order rejection**
   - Check symbol format (e.g., 'BTC', 'ETH')
   - Verify minimum quantities
   - Check account balance

## Support

For Aspis platform issues:
- Visit [https://v2.aspis.finance](https://v2.aspis.finance)
- Check their documentation
- Contact Aspis support
