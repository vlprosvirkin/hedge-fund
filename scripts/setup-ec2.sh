#!/bin/bash

# Hedge Fund MVP - EC2 Setup Script
set -e

echo "🚀 Setting up EC2 instance..."

# Install Docker
sudo apt update
sudo apt install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

# Setup app
mkdir -p /home/ubuntu/hedge-fund
cd /home/ubuntu/hedge-fund
git clone https://github.com/your-username/hedge-fund.git .
cp .env.example .env

echo "✅ Setup completed!"
echo "📋 Next: edit .env and run docker-compose up --build -d"
