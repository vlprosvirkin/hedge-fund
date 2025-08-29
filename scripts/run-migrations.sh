#!/bin/bash

# Database migration script
# This script runs all database migrations in order

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting database migrations...${NC}"

# Check if database environment variables are set
if [ -z "$DB_HOST" ] || [ -z "$DB_NAME" ] || [ -z "$DB_USER" ]; then
    echo -e "${RED}Error: Database environment variables are not set${NC}"
    echo "Please set DB_HOST, DB_NAME, DB_USER, and optionally DB_PASSWORD before running migrations"
    echo "You can copy from env.example and update the values"
    exit 1
fi

# Construct DATABASE_URL from individual variables
if [ -n "$DB_PASSWORD" ]; then
    DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT:-5432}/${DB_NAME}"
else
    DATABASE_URL="postgresql://${DB_USER}@${DB_HOST}:${DB_PORT:-5432}/${DB_NAME}"
fi

echo -e "${YELLOW}Using database: ${DB_HOST}:${DB_PORT:-5432}/${DB_NAME}${NC}"

# Function to run a migration
run_migration() {
    local migration_file=$1
    local migration_name=$2
    
    echo -e "${YELLOW}Running migration: ${migration_name}${NC}"
    
    if psql "$DATABASE_URL" -f "$migration_file" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Migration ${migration_name} completed successfully${NC}"
    else
        echo -e "${RED}❌ Migration ${migration_name} failed${NC}"
        exit 1
    fi
}

# Run migrations in order
run_migration "scripts/db-migration-v2.sql" "v2 - Add new columns"
run_migration "scripts/db-migration-v3.sql" "v3 - Support for discriminated Evidence union types"
run_migration "scripts/db-migration-v4.sql" "v4 - Create results table"

echo -e "${GREEN}🎉 All migrations completed successfully!${NC}"
