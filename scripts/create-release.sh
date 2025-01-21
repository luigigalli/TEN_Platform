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

# Check if version is provided
if [ -z "$1" ]; then
    print_status "$RED" "Error: Please provide version number (e.g., ./create-release.sh 1.2.0)"
    exit 1
fi

VERSION=$1
RELEASE_BRANCH="release/v${VERSION}"

# Validate version format
if ! [[ $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$ ]]; then
    print_status "$RED" "Error: Invalid version format. Must be X.Y.Z or X.Y.Z-STAGE"
    exit 1
fi

# Ensure we're on develop
git checkout develop
git pull origin develop

if [ $? -ne 0 ]; then
    print_status "$RED" "Error: Failed to update develop branch"
    exit 1
fi

# Create release branch
print_status "$YELLOW" "Creating release branch ${RELEASE_BRANCH}..."
git checkout -b "$RELEASE_BRANCH"

if [ $? -ne 0 ]; then
    print_status "$RED" "Error: Failed to create release branch"
    exit 1
fi

# Update version in package.json
print_status "$YELLOW" "Updating version in package.json..."
npm version "$VERSION" --no-git-tag-version

if [ $? -ne 0 ]; then
    print_status "$RED" "Error: Failed to update version in package.json"
    exit 1
fi

# Generate changelog
print_status "$YELLOW" "Generating changelog..."
./scripts/generate-changelog.sh "$VERSION"

if [ $? -ne 0 ]; then
    print_status "$RED" "Error: Failed to generate changelog"
    exit 1
fi

# Run tests
print_status "$YELLOW" "Running tests..."
npm test

if [ $? -ne 0 ]; then
    print_status "$RED" "Error: Tests failed. Please fix before releasing."
    exit 1
fi

# Commit changes
git add package.json package-lock.json CHANGELOG.md
git commit -m "chore(release): prepare v${VERSION}"

print_status "$GREEN" "Release branch created successfully!"
print_status "$GREEN" "Next steps:"
print_status "$GREEN" "1. Review changes in CHANGELOG.md"
print_status "$GREEN" "2. Make any final adjustments"
print_status "$GREEN" "3. Run ./scripts/finish-release.sh when ready"
