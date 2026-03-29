#!/bin/bash

# Chapturs VPS Deployment Script
# This script is executed on the VPS to pull latest code, build, and restart the app

set -e  # Exit on any error

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Chapturs VPS Deployment ===${NC}"

# Configuration
APP_DIR="${APP_DIR:-.}"
NODE_VERSION_REQUIRED="20"

# Check if running as root (recommended for PM2)
if [[ $EUID -ne 0 ]]; then
   echo -e "${YELLOW}Warning: Not running as root. Some operations may require sudo.${NC}"
fi

# 1. Navigate to app directory
echo -e "${YELLOW}Navigating to app directory: $APP_DIR${NC}"
cd "$APP_DIR" || { echo -e "${RED}Failed to navigate to $APP_DIR${NC}"; exit 1; }

# 2. Pull latest from GitHub main
echo -e "${YELLOW}Pulling latest changes from GitHub...${NC}"
if git pull origin main; then
    echo -e "${GREEN}✓ Git pull successful${NC}"
else
    echo -e "${RED}✗ Git pull failed${NC}"
    exit 1
fi

# 3. Check Node version
CURRENT_NODE_VERSION=$(node -v | cut -d'.' -f1 | sed 's/v//')
echo -e "${YELLOW}Current Node version: v${CURRENT_NODE_VERSION}.x${NC}"
if [[ "$CURRENT_NODE_VERSION" -lt "$NODE_VERSION_REQUIRED" ]]; then
    echo -e "${YELLOW}Warning: Expected Node $NODE_VERSION_REQUIRED.x, but have $CURRENT_NODE_VERSION.x. Build may fail.${NC}"
fi

# 4. Install dependencies
echo -e "${YELLOW}Installing npm dependencies...${NC}"
if npm install; then
    echo -e "${GREEN}✓ npm install successful${NC}"
else
    echo -e "${RED}✗ npm install failed${NC}"
    exit 1
fi

# 5. Build Next.js
echo -e "${YELLOW}Building Next.js application...${NC}"
if npm run build; then
    echo -e "${GREEN}✓ Next.js build successful${NC}"
else
    echo -e "${RED}✗ Next.js build failed${NC}"
    exit 1
fi

# 6. Run Prisma migrations (safe on Supabase)
echo -e "${YELLOW}Syncing Prisma schema with database...${NC}"
if npx prisma db push --skip-generate; then
    echo -e "${GREEN}✓ Prisma sync successful${NC}"
else
    echo -e "${RED}✗ Prisma sync failed (continuing anyway)${NC}"
    # Don't exit - DB migrations might not be critical for restart
fi

# 7. Reload PM2 app
# The app name should be set in environment variable or default to 'chapturs'
PM2_APP_NAME="${PM2_APP_NAME:-chapturs}"

echo -e "${YELLOW}Restarting PM2 app: $PM2_APP_NAME${NC}"

# Check if PM2 process exists
if pm2 pid "$PM2_APP_NAME" > /dev/null 2>&1; then
    if pm2 reload "$PM2_APP_NAME"; then
        echo -e "${GREEN}✓ PM2 reload successful${NC}"
    else
        echo -e "${RED}✗ PM2 reload failed${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}PM2 process not running. Starting fresh...${NC}"
    if pm2 start npm --name "$PM2_APP_NAME" -- start; then
        echo -e "${GREEN}✓ PM2 start successful${NC}"
    else
        echo -e "${RED}✗ PM2 start failed${NC}"
        exit 1
    fi
fi

# 8. Save PM2 configuration
echo -e "${YELLOW}Saving PM2 configuration...${NC}"
pm2 save || echo -e "${YELLOW}Warning: PM2 save failed (non-critical)${NC}"

echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo -e "${GREEN}Application restarted and ready!${NC}"

# Optional: Display PM2 status
echo -e "${YELLOW}PM2 Status:${NC}"
pm2 status
