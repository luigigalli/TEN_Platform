#!/bin/bash
# Automates post-pull checks and notifications

# Text formatting
BOLD='\033[1m'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BOLD}🔍 Running post-pull checks...${NC}\n"

# Function to check file for recent changes
check_updates() {
    local file=$1
    local days=${2:-1}
    if [ -f "$file" ]; then
        local recent_changes=$(find "$file" -mtime -$days)
        if [ ! -z "$recent_changes" ]; then
            echo -e "${YELLOW}⚠️  Recent changes detected in ${file}${NC}"
            echo -e "${BOLD}Recent updates:${NC}"
            tail -n 5 "$file"
            echo
        fi
    fi
}

# Check for new dependencies
echo -e "${BOLD}📦 Checking dependencies...${NC}"
if ! npm install; then
    echo -e "${RED}❌ Error installing dependencies${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Dependencies up to date${NC}\n"

# Verify environment
echo -e "${BOLD}🌍 Verifying environment...${NC}"
if ! npm run verify-env; then
    echo -e "${RED}❌ Environment verification failed${NC}"
    echo "Please check your .env file and environment configuration"
    exit 1
fi
echo -e "${GREEN}✓ Environment verified${NC}\n"

# Check database status and sync
echo -e "${BOLD}🗄️  Checking database status and sync...${NC}"
if ! npm run db:status; then
    echo -e "${YELLOW}⚠️  Database status check failed${NC}"
    echo "Please check database configuration and connectivity"
else
    echo -e "${GREEN}✓ Database connection verified${NC}"
fi

# Verify sync status
echo -e "\n${BOLD}🔄 Checking database sync status...${NC}"
if [ -f "scripts/db-sync.ts" ]; then
    echo "Verifying schema compatibility..."
    if ! tsx scripts/db-sync.ts --verify-only; then
        echo -e "${YELLOW}⚠️  Database sync verification failed${NC}"
        echo "Please check sync logs and run sync if needed"
    else
        echo -e "${GREEN}✓ Database sync verified${NC}"
    fi
fi

# Check for recent updates in team-updates directory
echo -e "\n${BOLD}📢 Checking recent team updates...${NC}"
check_updates "team-updates/action-items.md"
check_updates "team-updates/credentials.md"
check_updates "team-updates/breaking-changes.md"

echo -e "\n${GREEN}✅ Post-pull checks completed${NC}"
echo -e "${YELLOW}⚠️  Remember to review the full checklist in team-updates/post-pull-checklist.md${NC}"