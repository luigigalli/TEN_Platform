#!/bin/bash
# Automates post-pull checks and notifications

# Text formatting
BOLD='\033[1m'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BOLD}🔍 Running post-pull checks...${NC}\n"

# Verify branch configuration first
echo -e "${BOLD}🔧 Verifying branch configuration...${NC}"
if ! ./scripts/verify-branch-config.sh; then
    echo -e "${RED}❌ Branch configuration verification failed${NC}"
    echo "Please run ./scripts/setup-repository.sh to fix configuration"
    exit 1
fi
echo -e "${GREEN}✓ Branch configuration verified${NC}\n"

# Check current branch
current_branch=$(git symbolic-ref --short HEAD)
echo -e "${BOLD}📍 Current branch: ${current_branch}${NC}"

# Verify we're not on protected branches
if [[ "$current_branch" =~ ^(main|develop)$ ]]; then
    echo -e "${RED}❌ Warning: You are on a protected branch ($current_branch)${NC}"
    echo "Please switch to a feature branch for development"
    exit 1
fi

# Check branch sync status
echo -e "\n${BOLD}🔄 Checking branch sync status...${NC}"
if ! git remote update origin --prune; then
    echo -e "${RED}❌ Failed to update remote references${NC}"
    exit 1
fi

# Get the divergence status
UPSTREAM=${1:-'@{u}'}
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse "$UPSTREAM")
BASE=$(git merge-base @ "$UPSTREAM")

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  No upstream branch set${NC}"
else
    if [ "$LOCAL" = "$REMOTE" ]; then
        echo -e "${GREEN}✓ Branch is up to date${NC}"
    elif [ "$LOCAL" = "$BASE" ]; then
        echo -e "${YELLOW}⚠️  Need to pull${NC}"
    elif [ "$REMOTE" = "$BASE" ]; then
        echo -e "${YELLOW}⚠️  Need to push${NC}"
    else
        echo -e "${RED}❌ Branches have diverged${NC}"
    fi
fi

# Check for new dependencies
echo -e "\n${BOLD}📦 Checking dependencies...${NC}"
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
for file in team-updates/*.md; do
    if [ -f "$file" ]; then
        if [ $(find "$file" -mtime -1 2>/dev/null) ]; then
            echo -e "${YELLOW}⚠️  Recent changes in ${file}${NC}"
            echo -e "${BOLD}Recent updates:${NC}"
            tail -n 5 "$file"
            echo
        fi
    fi
done

echo -e "\n${GREEN}✅ Post-pull checks completed${NC}"
if [ -f "team-updates/post-pull-checklist.md" ]; then
    echo -e "${YELLOW}⚠️  Remember to review the full checklist in team-updates/post-pull-checklist.md${NC}"
fi