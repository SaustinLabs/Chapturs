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

load_env_file() {
    local env_file="$1"

    if [[ ! -f "$env_file" ]]; then
        return 1
    fi

    echo -e "${YELLOW}Loading environment from ${env_file}${NC}"

    # Use grep+export instead of source so special characters in values
    # (angle brackets, spaces, etc.) don't cause bash syntax errors.
    local line key value
    while IFS= read -r line || [[ -n "$line" ]]; do
        # Skip blank lines and comments
        [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
        # Must look like KEY=...
        [[ "$line" =~ ^[[:space:]]*([A-Za-z_][A-Za-z0-9_]*)[[:space:]]*=(.*)$ ]] || continue
        key="${BASH_REMATCH[1]}"
        value="${BASH_REMATCH[2]}"
        # Strip surrounding single or double quotes
        value="${value%$'\r'}"
        if [[ "$value" =~ ^\'(.*)\'$ ]]; then
            value="${BASH_REMATCH[1]}"
        elif [[ "$value" =~ ^\"(.*)\"$ ]]; then
            value="${BASH_REMATCH[1]}"
        fi
        export "$key=$value"
    done < "$env_file"

    return 0
}

extract_env_var_from_file() {
    local env_file="$1"
    local var_name="$2"

    if [[ ! -f "$env_file" ]]; then
        return 1
    fi

    local raw
    raw=$(grep -E "^[[:space:]]*${var_name}[[:space:]]*=" "$env_file" | tail -n 1)
    if [[ -z "$raw" ]]; then
        return 1
    fi

    raw="${raw#*=}"
    raw="${raw%$'\r'}"
    raw="${raw#\"}"
    raw="${raw%\"}"
    raw="${raw#\'}"
    raw="${raw%\'}"

    printf '%s' "$raw"
    return 0
}

mask_url_scheme() {
    local url="$1"
    if [[ "$url" =~ ^([a-zA-Z0-9+.-]+://) ]]; then
        printf '%s' "${BASH_REMATCH[1]}***"
    else
        printf '%s' "(unrecognized-url-format)"
    fi
}

# Check if running as root (recommended for PM2)
if [[ $EUID -ne 0 ]]; then
   echo -e "${YELLOW}Warning: Not running as root. Some operations may require sudo.${NC}"
fi

# 1. Navigate to app directory
echo -e "${YELLOW}Navigating to app directory: $APP_DIR${NC}"
cd "$APP_DIR" || { echo -e "${RED}Failed to navigate to $APP_DIR${NC}"; exit 1; }

# Avoid false git-dirty state caused by executable bit drift on some hosts
git config core.fileMode false || true

# Load production environment for CLI tools (Prisma/PM2 reload context)
if ! load_env_file ".env.production"; then
    if ! load_env_file ".env"; then
    echo -e "${YELLOW}Warning: No .env.production or .env file found in app directory.${NC}"
    fi
fi

# 2. Pull latest from GitHub main
echo -e "${YELLOW}Pulling latest changes from GitHub...${NC}"

# Ensure deployment script itself is not blocking pull if it was modified locally
if ! git diff --quiet -- .github/scripts/deploy.sh; then
    echo -e "${YELLOW}Resetting local changes in .github/scripts/deploy.sh before pull${NC}"
    git restore -- .github/scripts/deploy.sh || true
fi

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
# --include=dev is required: tailwindcss/postcss/autoprefixer are devDependencies
# but are needed at build time. NODE_ENV=production (from .env.production) would
# otherwise cause npm to skip them silently.
echo -e "${YELLOW}Installing npm dependencies...${NC}"
if npm install --include=dev; then
    echo -e "${GREEN}✓ npm install successful${NC}"
else
    echo -e "${RED}✗ npm install failed${NC}"
    exit 1
fi

# 5. Build Next.js
echo -e "${YELLOW}Building Next.js application...${NC}"
# Increase Node.js heap to avoid OOM on low-memory VPS.
# Adjust down if VPS has < 2 GB RAM (use 800 for 1 GB).
export NODE_OPTIONS="--max-old-space-size=1536"
export NEXT_TELEMETRY_DISABLED=1
if npm run build; then
    echo -e "${GREEN}✓ Next.js build successful${NC}"
else
    echo -e "${RED}✗ Next.js build failed${NC}"
    exit 1
fi

# 6. Run Prisma migrations (safe on Supabase)
echo -e "${YELLOW}Syncing Prisma schema with database...${NC}"
RESOLVED_DATABASE_URL="${DATABASE_URL:-}"
if [[ -z "$RESOLVED_DATABASE_URL" ]]; then
    RESOLVED_DATABASE_URL=$(extract_env_var_from_file ".env.production" "DATABASE_URL" || extract_env_var_from_file ".env" "DATABASE_URL" || true)
fi

RESOLVED_DIRECT_URL="${DIRECT_URL:-}"
if [[ -z "$RESOLVED_DIRECT_URL" ]]; then
    RESOLVED_DIRECT_URL=$(extract_env_var_from_file ".env.production" "DIRECT_URL" || extract_env_var_from_file ".env" "DIRECT_URL" || true)
fi

if [[ -z "$RESOLVED_DATABASE_URL" ]]; then
    echo -e "${YELLOW}Skipping Prisma sync: DATABASE_URL is not set in shell or env files.${NC}"
elif [[ "$RESOLVED_DATABASE_URL" =~ ^prisma\+postgres:// ]]; then
    if [[ "$RESOLVED_DIRECT_URL" =~ ^postgres(ql)?:// ]]; then
        echo -e "${YELLOW}DATABASE_URL uses Prisma Accelerate. Using DIRECT_URL for Prisma sync.${NC}"
        export DATABASE_URL="$RESOLVED_DIRECT_URL"
    else
        echo -e "${RED}✗ CRITICAL: DATABASE_URL is prisma+postgres:// (Prisma Accelerate) but DIRECT_URL is missing or not a valid postgres:// URL.${NC}"
        echo -e "${RED}  Schema changes (new tables, new columns) will NOT be applied to the database until DIRECT_URL is set.${NC}"
        echo -e "${RED}  Fix: Add DIRECT_URL=postgresql://... to GitHub Secrets pointing directly to Supabase (not through pgbouncer).${NC}"
        echo -e "${YELLOW}  Detected DATABASE_URL scheme: $(mask_url_scheme "$RESOLVED_DATABASE_URL")${NC}"
        echo -e "${YELLOW}  Skipping Prisma sync this deploy. New features requiring new DB tables will 500 until resolved.${NC}"
    fi
elif [[ "${RESOLVED_DATABASE_URL}" =~ ^postgres(ql)?:// ]]; then
    export DATABASE_URL="$RESOLVED_DATABASE_URL"
else
    echo -e "${YELLOW}Skipping Prisma sync: DATABASE_URL is not a supported Postgres URL.${NC}"
    echo -e "${YELLOW}Detected DATABASE_URL scheme: $(mask_url_scheme "$RESOLVED_DATABASE_URL")${NC}"
fi

if [[ -n "${DATABASE_URL:-}" && "${DATABASE_URL}" =~ ^postgres(ql)?:// ]]; then
    if npx prisma validate --schema prisma/schema.prisma && npx prisma db push --skip-generate --accept-data-loss --schema prisma/schema.prisma; then
        echo -e "${GREEN}✓ Prisma sync successful${NC}"
    else
        echo -e "${RED}✗ Prisma sync failed (continuing anyway)${NC}"
        echo -e "${YELLOW}Hint: Verify DATABASE_URL/DIRECT_URL and connectivity to your Postgres instance.${NC}"
        # Don't exit - DB migrations might not be critical for restart
    fi
fi

# 7. Reload PM2 app
# The app name should be set in environment variable or default to 'chapturs'
PM2_APP_NAME="${PM2_APP_NAME:-chapturs}"

echo -e "${YELLOW}Restarting PM2 app: $PM2_APP_NAME${NC}"

# Check if PM2 process exists
if pm2 pid "$PM2_APP_NAME" > /dev/null 2>&1; then
    if pm2 reload "$PM2_APP_NAME" --update-env; then
        echo -e "${GREEN}✓ PM2 reload successful${NC}"
    else
        echo -e "${RED}✗ PM2 reload failed${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}PM2 process not running. Starting fresh...${NC}"
    if pm2 start npm --name "$PM2_APP_NAME" -- start --update-env; then
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
