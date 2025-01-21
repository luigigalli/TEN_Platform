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

# Ensure we're on a release branch
if [[ ! $CURRENT_BRANCH =~ ^release/v[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$ ]]; then
    print_status "$RED" "Error: Not on a release branch"
    print_status "$RED" "Current branch: $CURRENT_BRANCH"
    print_status "$RED" "Expected format: release/vX.Y.Z"
    exit 1
fi

# Extract version from branch name
VERSION=$(echo $CURRENT_BRANCH | sed 's/release\/v//')

# Run final tests
print_status "$YELLOW" "Running final tests..."
npm test

if [ $? -ne 0 ]; then
    print_status "$RED" "Error: Tests failed. Cannot proceed with release."
    exit 1
fi

# Merge to main
print_status "$YELLOW" "Merging to main..."
git checkout main
git pull origin main
git merge --no-ff "$CURRENT_BRANCH" -m "chore(release): merge v${VERSION} to main"

if [ $? -ne 0 ]; then
    print_status "$RED" "Error: Failed to merge to main"
    exit 1
fi

# Create signed tag
print_status "$YELLOW" "Creating signed tag v${VERSION}..."
git tag -s "v${VERSION}" -m "Release v${VERSION}"

if [ $? -ne 0 ]; then
    print_status "$RED" "Error: Failed to create tag"
    exit 1
fi

# Push main and tag
print_status "$YELLOW" "Pushing main and tag..."
git push origin main "v${VERSION}"

if [ $? -ne 0 ]; then
    print_status "$RED" "Error: Failed to push to GitHub"
    exit 1
fi

# Merge back to develop
print_status "$YELLOW" "Merging changes back to develop..."
git checkout develop
git pull origin develop
git merge --no-ff "$CURRENT_BRANCH" -m "chore(release): merge v${VERSION} to develop"

if [ $? -ne 0 ]; then
    print_status "$RED" "Error: Failed to merge to develop"
    exit 1
fi

# Push develop
git push origin develop

if [ $? -ne 0 ]; then
    print_status "$RED" "Error: Failed to push develop"
    exit 1
fi

# Delete release branch
print_status "$YELLOW" "Cleaning up..."
git branch -d "$CURRENT_BRANCH"
git push origin --delete "$CURRENT_BRANCH"

print_status "$GREEN" "Release v${VERSION} completed successfully!"
print_status "$GREEN" "Tag: v${VERSION}"
print_status "$GREEN" "Don't forget to:"
print_status "$GREEN" "1. Create a GitHub release"
print_status "$GREEN" "2. Update Jira version"
print_status "$GREEN" "3. Notify the team"
