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
        print_status "$RED" "Error: Invalid $name. Must be between 0 and $max"
        exit 1
    fi
}

# Get current year and month if not provided
CURRENT_YEAR=$(date +%Y)
CURRENT_MONTH=$(date +%m)

# Check if sprint and revision are provided
if [ "$#" -lt 2 ]; then
    print_status "$RED" "Usage: $0 SPRINT REVISION [YEAR] [MONTH]"
    print_status "$RED" "Example: $0 2 3 [2025] [01]"
    exit 1
fi

SPRINT=$1
REVISION=$2
YEAR=${3:-$CURRENT_YEAR}
MONTH=${4:-$CURRENT_MONTH}

# Validate version components
validate_component $YEAR 9999 "year"
validate_component $MONTH 12 "month"
validate_component $SPRINT 9 "sprint"
validate_component $REVISION 9 "revision"

# Format version string
VERSION="${YEAR}.$(printf %02d $MONTH).${SPRINT}.${REVISION}"

# Update management-version.json
VERSION_FILE="management/management-version.json"
if [ ! -f "$VERSION_FILE" ]; then
    print_status "$RED" "Error: management-version.json not found"
    exit 1
fi

# Get current app version compatibility
MIN_APP_VERSION=$(jq -r '.compatibility.minAppVersion' "$VERSION_FILE")
MAX_APP_VERSION=$(jq -r '.compatibility.maxAppVersion' "$VERSION_FILE")

# Update version file
cat > "$VERSION_FILE" << EOF
{
  "version": "$VERSION",
  "lastUpdate": "$(date +%Y-%m-%d)",
  "compatibility": {
    "minAppVersion": "$MIN_APP_VERSION",
    "maxAppVersion": "$MAX_APP_VERSION"
  }
}
EOF

# Create release branch
RELEASE_BRANCH="release/mgmt/v${VERSION}"
git checkout -b "$RELEASE_BRANCH"

if [ $? -ne 0 ]; then
    print_status "$RED" "Error: Failed to create release branch"
    exit 1
fi

# Commit version bump
git add "$VERSION_FILE"
git commit -m "chore(release): set management version to ${VERSION}"

print_status "$GREEN" "Management version set to ${VERSION}"
print_status "$GREEN" "Release branch created: ${RELEASE_BRANCH}"
print_status "$GREEN" "Next steps:"
print_status "$GREEN" "1. Review changes"
print_status "$GREEN" "2. Run tests"
print_status "$GREEN" "3. Run ./scripts/finish-release.sh when ready"
