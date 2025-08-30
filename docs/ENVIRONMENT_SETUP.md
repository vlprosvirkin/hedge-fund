# Environment Setup Guide

## Overview

This guide covers the complete environment setup for the Hedge Fund AI Trading System, including API keys, database configuration, and system parameters.

## Required Environment Variables

### Database Configuration
```bash
# PostgreSQL Database
DB_HOST=your-database-host
DB_PORT=5432
DB_NAME=your-database-name
DB_USER=your-database-user
DB_PASSWORD=your-database-password
```

### API Keys

#### Binance API (Required)
```bash
BINANCE_API_KEY=your-binance-api-key
BINANCE_SECRET_KEY=your-binance-secret-key
BINANCE_BASE_URL=https://api.binance.com
```

#### Aspis API (Required)
```bash
ASPIS_API_KEY=your-aspis-api-key
ASPIS_BASE_URL=https://api.aspis.com
```

#### OpenAI API (Optional - for enhanced analysis)
```bash
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4
```

#### News API (Optional - for sentiment analysis)
```bash
NEWS_API_KEY=your-newsapi-key
NEWS_BASE_URL=https://newsapi.org/v2
```

#### CoinMarketCap API (Optional - for market data)
```bash
CMC_API_KEY=your-coinmarketcap-api-key
CMC_BASE_URL=https://pro-api.coinmarketcap.com
```

### Telegram Notifications
```bash
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_CHAT_ID=your-chat-id
```

### System Configuration
```bash
# Risk Profile: 'averse', 'neutral', 'bold'
RISK_PROFILE=neutral

# Maximum concurrent positions
MAX_POSITIONS=10

# Kill switch (true/false)
KILL_SWITCH_ENABLED=true

# Log level: 'debug', 'info', 'warn', 'error'
LOG_LEVEL=info

# Environment: 'development', 'production'
NODE_ENV=development
```

## Configuration Notes

### Trading Intervals
The system now uses a single `roundInterval` configuration that controls both analysis and rebalancing frequency:

- **12 hours (43200 seconds)**: Recommended for production
- **1 hour (3600 seconds)**: For development/testing
- **30 minutes (1800 seconds)**: For intensive testing

The interval is configured in `src/core/config.ts` and cannot be overridden via environment variables.

### Risk Profiles

#### Averse (Conservative)
- Lower position sizes
- Higher confidence thresholds
- More conservative decision making

#### Neutral (Balanced) - Default
- Standard position sizes
- Balanced thresholds
- Moderate risk tolerance

#### Bold (Aggressive)
- Higher position sizes
- Lower confidence thresholds
- More aggressive decision making

## Setup Instructions

### 1. Create Environment File
```bash
cp env.example .env
```

### 2. Configure Database
```bash
# Run database migrations
./scripts/run-migrations.sh
```

### 3. Verify Configuration
```bash
# Test configuration
npm run test
```

### 4. Start the System
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Rate Limits

### Binance API
- **Spot Trading**: 1200 requests/minute
- **Market Data**: 2400 requests/minute

### Aspis API
- **Trading**: 100 requests/minute
- **Market Data**: 500 requests/minute

### OpenAI API
- **GPT-4**: 5000 requests/minute
- **GPT-3.5**: 3500 requests/minute

### News API
- **Free Tier**: 100 requests/day
- **Paid Plans**: Varies by subscription

### CoinMarketCap API
- **Free Tier**: 30 requests/day
- **Paid Plans**: Varies by subscription

## Security Considerations

### API Key Security
- Never commit API keys to version control
- Use environment variables for all sensitive data
- Rotate API keys regularly
- Use API keys with minimal required permissions

### Database Security
- Use strong passwords
- Enable SSL connections
- Restrict database access to application servers
- Regular backups

### Network Security
- Use HTTPS for all API communications
- Implement rate limiting
- Monitor for suspicious activity
- Use firewalls to restrict access

## Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Check database connectivity
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME
```

#### API Key Issues
```bash
# Test API connectivity
curl -H "X-API-Key: $YOUR_API_KEY" $API_BASE_URL/endpoint
```

#### Configuration Validation
```bash
# Run configuration tests
npm run test:config
```

### Log Files
- **Application Logs**: `logs/app.log`
- **Error Logs**: `logs/error.log`
- **Debug Logs**: `logs/debug.log`

### Health Checks
```bash
# Check system health
curl http://localhost:9090/health
```

## Performance Tuning

### Database Optimization
- Enable connection pooling
- Optimize indexes
- Monitor query performance
- Regular maintenance

### API Optimization
- Implement caching
- Batch requests where possible
- Use webhooks for real-time data
- Monitor rate limits

### System Resources
- Monitor CPU and memory usage
- Optimize Node.js settings
- Use PM2 for process management
- Implement load balancing if needed

## Monitoring and Alerts

### Telegram Notifications
- Round start/completion
- Signal generation
- Order execution
- Error alerts
- Performance metrics

### Log Monitoring
- Structured logging
- Error tracking
- Performance metrics
- Audit trails

### Health Monitoring
- System uptime
- API response times
- Database performance
- Trading performance
