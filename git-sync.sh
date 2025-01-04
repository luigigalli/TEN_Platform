#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print with color
print_status() {
    echo -e "${GREEN}==>${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}WARNING:${NC} $1"
}

# Configure git with token auth if needed
setup_git_auth() {
    if [ -n "$GIT_TOKEN" ]; then
        remote_url=$(git config --get remote.origin.url)
        if [[ $remote_url != *"@"* ]]; then
            # Convert HTTPS URL to token auth URL
            new_url="https://oauth2:${GIT_TOKEN}@github.com/${remote_url#https://github.com/}"
            git remote set-url origin "$new_url"
            print_status "Git authentication configured"
        fi
    else
        print_warning "GIT_TOKEN not found. Please set it in Replit secrets."
        exit 1
    fi
}

# Function to sync with remote
sync_branch() {
    current_branch=$(git rev-parse --abbrev-ref HEAD)
    print_status "Current branch: $current_branch"

    # Setup git auth
    setup_git_auth

    # Stash any changes
    if [[ -n $(git status -s) ]]; then
        print_status "Stashing changes..."
        git stash
    fi

    # Pull latest changes
    print_status "Pulling latest changes..."
    git pull origin $current_branch

    # Pop stashed changes if any
    if [[ -n $(git stash list) ]]; then
        print_status "Restoring your changes..."
        git stash pop
    fi
}

# Function to create a new feature branch
create_feature() {
    if [ -z "$1" ]; then
        print_warning "Please provide a feature name"
        echo "Usage: ./git-sync.sh feature <feature-name>"
        exit 1
    fi

    # Setup git auth
    setup_git_auth

    branch_name="feat/$1"
    print_status "Creating new feature branch: $branch_name"
    git checkout -b $branch_name
    git push -u origin $branch_name
}

# Function to commit changes
commit_changes() {
    if [ -z "$1" ]; then
        print_warning "Please provide a commit message"
        echo "Usage: ./git-sync.sh commit \"your commit message\""
        exit 1
    fi

    # Setup git auth
    setup_git_auth

    print_status "Committing changes..."
    git add .
    git commit -m "$1"
    git push origin $(git rev-parse --abbrev-ref HEAD)
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
    *)
        echo "Usage: ./git-sync.sh <command> [args]"
        echo "Commands:"
        echo "  sync              - Sync current branch with remote"
        echo "  feature <name>    - Create a new feature branch"
        echo "  commit \"message\"  - Commit and push changes"
        ;;
esac