#!/bin/bash

# Text formatting
BOLD='\033[1m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BOLD}Verifying Git branch configuration...${NC}\n"

# Check if we're in a Git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}Error: Not a git repository${NC}"
    exit 1
fi

# Function to check Git config
check_config() {
    local key=$1
    local expected=$2
    local value=$(git config --get "$key")
    
    echo -n "Checking $key... "
    if [ "$value" = "$expected" ]; then
        echo -e "${GREEN}✓${NC}"
        return 0
    else
        echo -e "${RED}✗${NC}"
        echo -e "${YELLOW}Expected: $expected${NC}"
        echo -e "${YELLOW}Got: $value${NC}"
        return 1
    fi
}

# Check environment-specific configurations
if [ -n "$REPL_ID" ]; then
    echo -e "\n${BOLD}Replit Environment Checks:${NC}"
    check_config "pull.rebase" "true"
    check_config "branch.develop.rebase" "true"
else
    echo -e "\n${BOLD}Windsurf Environment Checks:${NC}"
    check_config "pull.ff" "only"
fi

# Check branch protection
echo -e "\n${BOLD}Branch Protection Checks:${NC}"
check_config "branch.main.protect" "true"
check_config "branch.develop.protect" "true"

# Check safety configurations
echo -e "\n${BOLD}Safety Configuration Checks:${NC}"
check_config "core.protectNonFastForwards" "true"
check_config "receive.denyDeletes" "true"
check_config "receive.denyNonFastForwards" "true"

# Verify hooks installation
echo -e "\n${BOLD}Git Hooks Check:${NC}"
if [ -x ".git/hooks/pre-commit" ]; then
    echo -e "${GREEN}✓ pre-commit hook is installed and executable${NC}"
else
    echo -e "${RED}✗ pre-commit hook is missing or not executable${NC}"
fi

# Verify commit template
echo -e "\n${BOLD}Commit Template Check:${NC}"
if [ -f ".github/commit-template.txt" ]; then
    echo -e "${GREEN}✓ Commit template is present${NC}"
else
    echo -e "${RED}✗ Commit template is missing${NC}"
fi

echo -e "\n${BOLD}Configuration verification complete${NC}"
