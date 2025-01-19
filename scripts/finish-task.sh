#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Get current branch name
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Extract task number from branch name
TASK_NUMBER=$(echo $CURRENT_BRANCH | grep -o 'TENP-[0-9]\+')

if [ -z "$TASK_NUMBER" ]; then
    print_status "$RED" "Error: Current branch name does not contain a valid task number"
    print_status "$RED" "Branch name should be in format: TENP-XXX-description"
    exit 1
fi

# Run tests
print_status "$YELLOW" "Running tests..."
npm test

if [ $? -ne 0 ]; then
    print_status "$RED" "Error: Tests failed. Please fix tests before finishing task."
    exit 1
fi

# Switch to develop and update
print_status "$YELLOW" "Updating develop branch..."
git checkout develop
git pull origin develop

if [ $? -ne 0 ]; then
    print_status "$RED" "Error: Failed to update develop branch"
    exit 1
fi

# Merge task branch
print_status "$YELLOW" "Merging task branch..."
git merge "$CURRENT_BRANCH"

if [ $? -ne 0 ]; then
    print_status "$RED" "Error: Merge conflict. Please resolve conflicts and try again."
    exit 1
fi

# Run tests again after merge
print_status "$YELLOW" "Running tests after merge..."
npm test

if [ $? -ne 0 ]; then
    print_status "$RED" "Error: Tests failed after merge. Please fix tests."
    git merge --abort
    exit 1
fi

# Push to GitHub
print_status "$YELLOW" "Pushing to GitHub..."
git push origin develop

if [ $? -ne 0 ]; then
    print_status "$RED" "Error: Failed to push to GitHub"
    exit 1
fi

# Delete local branch
print_status "$YELLOW" "Deleting local branch..."
git branch -d "$CURRENT_BRANCH"

print_status "$GREEN" "Task completed successfully!"
print_status "$GREEN" "Don't forget to update the work log and Jira status."
