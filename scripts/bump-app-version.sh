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

# Function to validate version component
validate_component() {
    local component=$1
    local max=$2
    local name=$3
    
    if ! [[ $component =~ ^[0-9]+$ ]] || [ $component -lt 0 ] || [ $component -gt $max ]; then
        print_status "$RED" "Error: Invalid $name number. Must be between 0 and $max"
        exit 1
    fi
}

# Check if version components are provided
if [ "$#" -lt 3 ]; then
    print_status "$RED" "Usage: $0 MAJOR MINOR PATCH [BUILD]"
    print_status "$RED" "Example: $0 2 0 4 [23]"
    exit 1
fi

MAJOR=$1
MINOR=$2
PATCH=$3
BUILD=${4:-$(date +%d)} # Use day of month as build number if not provided

# Validate version components
validate_component $MAJOR 99 "major"
validate_component $MINOR 99 "minor"
validate_component $PATCH 99 "patch"
validate_component $BUILD 99 "build"

# Format version string
VERSION="${MAJOR}.${MINOR}.${PATCH}.${BUILD}"

# Update version.json
VERSION_FILE="version.json"
if [ ! -f "$VERSION_FILE" ]; then
    print_status "$RED" "Error: version.json not found"
    exit 1
fi

# Get current management version requirement
MIN_MGMT_VERSION=$(jq -r '.compatibility.minManagementVersion' "$VERSION_FILE")

# Update version file
cat > "$VERSION_FILE" << EOF
{
  "version": "$VERSION",
  "lastUpdate": "$(date +%Y-%m-%d)",
  "compatibility": {
    "minManagementVersion": "$MIN_MGMT_VERSION"
  }
}
EOF

# Create release branch
RELEASE_BRANCH="release/app/v${VERSION}"
git checkout -b "$RELEASE_BRANCH"

if [ $? -ne 0 ]; then
    print_status "$RED" "Error: Failed to create release branch"
    exit 1
fi

# Commit version bump
git add "$VERSION_FILE"
git commit -m "chore(release): bump app version to ${VERSION}"

print_status "$GREEN" "App version bumped to ${VERSION}"
print_status "$GREEN" "Release branch created: ${RELEASE_BRANCH}"
print_status "$GREEN" "Next steps:"
print_status "$GREEN" "1. Review changes"
print_status "$GREEN" "2. Run tests"
print_status "$GREEN" "3. Run ./scripts/finish-release.sh when ready"
