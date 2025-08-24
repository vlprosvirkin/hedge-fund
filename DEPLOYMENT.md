# Hedge Fund MVP - AWS Deployment Guide

## Prerequisites

- Docker and Docker Compose installed on your AWS EC2 instance
- AWS RDS PostgreSQL database (already configured)
- All required API keys and environment variables

## Quick Deployment

### 1. Setup Environment

Create `.env` file with your configuration. Docker Compose will automatically load all variables from this file:

```bash
# Database (AWS RDS)
DB_HOST=your-rds-host.amazonaws.com
DB_PORT=5432
DB_NAME=hedge_fund
DB_USER=postgres
DB_PASSWORD=your_secure_password

# Port (optional, defaults to 4500)
PORT=4500

# API Keys
BINANCE_API_KEY=your_binance_api_key
BINANCE_SECRET_KEY=your_binance_secret_key
ASPIS_API_KEY=your_aspis_api_key
ASPIS_VAULT_ADDRESS=0x8898DB79ecB10be8F66C48e1F9bbD1DEFEAa3354
OPENAI_API_KEY=your_openai_api_key
NEWS_API_KEY=your_news_api_key
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id

# External APIs
TECHNICAL_INDICATORS_URL=http://63.176.129.185:8000
NEWS_API_URL=http://3.79.47.238:4500

# System Configuration
RISK_PROFILE=neutral
DEBATE_INTERVAL=3600
MAX_POSITIONS=8
KILL_SWITCH_ENABLED=true
```

**Note**: Docker Compose uses `env_file: - .env` to automatically load all variables from the `.env` file. No need to manually specify each variable in the docker-compose.yml.

### 2. Verify Configuration

```bash
# Check if Docker Compose can read the .env file
docker-compose config

# This should show all environment variables loaded from .env
```

### 3. Deploy Application

```bash
# Build and start the application
docker-compose up --build -d
```

### 3. Check Status

```bash
# Check if containers are running
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. Stop Application

```bash
# Stop the application
docker-compose down
```

## Commands Reference

| Command | Description |
|---------|-------------|
| `docker-compose up --build -d` | Build and start application in background |
| `docker-compose ps` | Check container status |
| `docker-compose logs -f` | View logs with follow |
| `docker-compose down` | Stop and remove containers |
| `docker-compose restart` | Restart application |
| `docker-compose pull` | Pull latest image (if using remote) |

## Monitoring

- Application runs on port `4500` (or PORT from .env)
- Logs are stored in `./logs` directory
- Data is stored in `./data` directory
- Health check runs every 30 seconds

## Troubleshooting

### Application won't start
```bash
# Check logs for errors
docker-compose logs

# Verify environment variables are loaded
docker-compose config

# Check if .env file exists and is readable
ls -la .env
cat .env | grep -E "(ASPIS_|BINANCE_|OPENAI_)"
```

### Database connection issues
- Verify RDS security group allows connections from EC2
- Check database credentials in `.env`
- Ensure SSL is properly configured

### Port already in use
```bash
# Check what's using port 4500
sudo lsof -i :4500

# Kill process if needed
sudo kill -9 <PID>
```

## Security Notes

- Keep `.env` file secure and never commit to git
- Use AWS IAM roles for database access when possible
- Regularly update API keys
- Monitor application logs for suspicious activity

## GitHub Actions Auto-Deploy

### Setup GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions, and add:

1. **AWS_HOST** - Your EC2 instance public IP or domain
2. **AWS_USERNAME** - SSH username (usually `ubuntu`)
3. **AWS_SSH_KEY** - Your private SSH key for EC2 access
4. **AWS_PORT** - SSH port (usually `22`)

### How it works

1. **Push to main branch** → Automatic deployment
2. **Manual trigger** → Go to Actions tab → Deploy to AWS → Run workflow

### EC2 Setup Requirements

```bash
# Install Docker and Docker Compose
sudo apt update
sudo apt install -y docker.io docker-compose

# Add user to docker group
sudo usermod -aG docker $USER

# Clone repository
git clone https://github.com/your-username/hedge-fund.git
cd hedge-fund

# Create .env file with your configuration
cp .env.example .env
# Edit .env with your settings

# Test deployment
docker-compose up --build -d
```

### Deployment Flow

1. **Test** → Runs tests in GitHub Actions
2. **Deploy** → If tests pass, deploys to EC2
3. **Rollback** → Manual process if needed

### Workflows Overview

- **`.github/workflows/deploy.yml`** - Test and deploy to AWS EC2 (all in one)

### Quick EC2 Setup

```bash
# Run setup script on EC2
curl -sSL https://raw.githubusercontent.com/your-username/hedge-fund/main/scripts/setup-ec2.sh | bash
```

### Monitoring Deployments

- Check GitHub Actions tab for deployment status
- View logs in real-time during deployment
- Monitor application health after deployment
- Check Docker images in GitHub Packages tab
