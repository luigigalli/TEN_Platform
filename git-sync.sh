#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Function to print with color
print_status() {
    echo -e "${GREEN}==>${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}WARNING:${NC} $1"
}

print_error() {
    echo -e "${RED}ERROR:${NC} $1"
}

# Configure git with token auth if needed
setup_git_auth() {
    if [ -n "$GIT_TOKEN" ]; then
        remote_url=$(git config --get remote.origin.url)
        if [[ $remote_url != *"@"* ]]; then
            new_url="https://oauth2:${GIT_TOKEN}@github.com/${remote_url#https://github.com/}"
            git remote set-url origin "$new_url"
            print_status "Git authentication configured"
        fi
    else
        print_warning "GIT_TOKEN not found. Please set it in Replit secrets."
        exit 1
    fi
}

# Validate branch name against our conventions
validate_branch_name() {
    local branch_name=$1
    local valid_patterns=(
        '^main$'
        '^develop$'
        '^feat/[a-z0-9-]+$'
        '^fix/[a-z0-9-]+$'
        '^docs/[a-z0-9-]+$'
        '^env/[a-z0-9-]+$'
        '^issue-[0-9]+-[a-z0-9-]+$'
        '^hotfix-[0-9]+-[a-z0-9-]+$'
    )

    for pattern in "${valid_patterns[@]}"; do
        if [[ $branch_name =~ $pattern ]]; then
            return 0
        fi
    done
    return 1
}

# Function to sync with remote
sync_branch() {
    current_branch=$(git rev-parse --abbrev-ref HEAD)
    print_status "Current branch: $current_branch"

    # Setup git auth
    setup_git_auth

    # Check if we're on a protected branch
    if [[ "$current_branch" =~ ^(main|develop)$ ]]; then
        print_error "Direct sync on protected branch '$current_branch' is not allowed"
        print_status "Please create a feature branch and submit a pull request"
        exit 1
    fi

    # Configure git pull strategy based on environment
    if [ -n "$REPL_ID" ]; then
        git config pull.rebase true
        print_status "Configured pull strategy to use rebase (Replit environment)"
    else
        git config pull.ff only
        print_status "Configured pull strategy to use fast-forward only (Windsurf environment)"
    fi

    # Stash any changes
    if [[ -n $(git status -s) ]]; then
        print_status "Stashing changes..."
        git stash
    fi

    # Pull latest changes with configured strategy
    print_status "Pulling latest changes..."
    if [ -n "$REPL_ID" ]; then
        git pull --rebase origin $current_branch
    else
        git pull --ff-only origin $current_branch
    fi

    # Pop stashed changes if any
    if [[ -n $(git stash list) ]]; then
        print_status "Restoring your changes..."
        git stash pop
    fi
}

# Function to create a new feature branch
create_feature() {
    if [ -z "$1" ]; then
        print_error "Please provide a feature name"
        echo "Usage: ./git-sync.sh feature <feature-name>"
        exit 1
    fi

    # Setup git auth
    setup_git_auth

    # Create branch name and validate
    branch_name="feat/$1"
    if ! validate_branch_name "$branch_name"; then
        print_error "Invalid branch name format: $branch_name"
        echo "Branch names must follow these patterns:"
        echo "  - feat/description (for features)"
        echo "  - fix/description (for bug fixes)"
        echo "  - docs/description (for documentation)"
        echo "  - env/description (for environment configuration)"
        echo "  - issue-XXX-description (for specific issues)"
        echo "  - hotfix-XXX-description (for urgent fixes)"
        exit 1
    fi

    print_status "Creating new feature branch: $branch_name"
    git checkout develop
    git pull origin develop
    git checkout -b $branch_name
    git push -u origin $branch_name
}

# Function to commit changes
commit_changes() {
    if [ -z "$1" ]; then
        print_error "Please provide a commit message"
        echo "Usage: ./git-sync.sh commit \"your commit message\""
        exit 1
    fi

    # Setup git auth
    setup_git_auth

    # Verify we're not on a protected branch
    current_branch=$(git rev-parse --abbrev-ref HEAD)
    if [[ "$current_branch" =~ ^(main|develop)$ ]]; then
        print_error "Direct commits to $current_branch branch are not allowed"
        print_status "Please create a feature branch and submit a pull request"
        exit 1
    fi

    print_status "Committing changes..."
    git add .
    git commit -m "$1"
    git push origin $current_branch
}

# Function to prepare a pull request
prepare_pr() {
    current_branch=$(git rev-parse --abbrev-ref HEAD)

    # Verify branch
    if [[ "$current_branch" =~ ^(main|develop)$ ]]; then
        print_error "Cannot prepare PR from protected branch: $current_branch"
        exit 1
    fi

    # Run pre-PR checks
    print_status "Running pre-PR checks..."

    # Verify branch is up to date
    git fetch origin
    if [ "$(git rev-parse HEAD)" != "$(git rev-parse origin/$current_branch)" ]; then
        print_warning "Branch is not up to date with remote"
        print_status "Please sync your branch first: ./git-sync.sh sync"
        exit 1
    fi

    # Check for uncommitted changes
    if [[ -n $(git status -s) ]]; then
        print_warning "You have uncommitted changes"
        print_status "Please commit or stash your changes first"
        exit 1
    fi

    print_status "Branch is ready for PR"
    echo -e "\n${BOLD}Next steps:${NC}"
    echo "1. Create PR on GitHub"
    echo "2. Reference related issues"
    echo "3. Add proper description"
    echo "4. Request review"
}

# Main script logic
case "$1" in
    "sync")
        sync_branch
        ;;
    "feature")
        create_feature "$2"
        ;;
    "commit")
        commit_changes "$2"
        ;;
    "prepare-pr")
        prepare_pr
        ;;
    *)
        echo -e "${BOLD}TEN Git Sync Tool${NC}"
        echo "Usage: ./git-sync.sh <command> [args]"
        echo -e "\nCommands:"
        echo "  sync              - Sync current branch with remote"
        echo "  feature <name>    - Create a new feature branch"
        echo "  commit \"message\"  - Commit and push changes"
        echo "  prepare-pr        - Prepare branch for pull request"
        ;;
esac