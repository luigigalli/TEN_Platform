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
    print_status "$RED" "Error: Please provide version number"
    exit 1
fi

VERSION=$1
DATE=$(date +%Y-%m-%d)
TEMP_FILE=$(mktemp)
CHANGELOG="CHANGELOG.md"

# Create changelog if it doesn't exist
if [ ! -f "$CHANGELOG" ]; then
    echo "# Changelog" > "$CHANGELOG"
    echo "" >> "$CHANGELOG"
    echo "All notable changes to this project will be documented in this file." >> "$CHANGELOG"
    echo "" >> "$CHANGELOG"
fi

# Get all commits since last tag
print_status "$YELLOW" "Gathering commits since last release..."

# Initialize arrays for different types of changes
declare -A changes=(
    ["feat"]="New Features"
    ["fix"]="Bug Fixes"
    ["perf"]="Performance Improvements"
    ["refactor"]="Code Refactoring"
    ["style"]="Style Changes"
    ["docs"]="Documentation"
    ["test"]="Tests"
    ["chore"]="Maintenance"
)

# Create temporary changelog content
echo "## [${VERSION}] - ${DATE}" > "$TEMP_FILE"
echo "" >> "$TEMP_FILE"

# Process each type of change
for type in "${!changes[@]}"; do
    # Get commits for this type
    commits=$(git log --no-merges --format="- %s (%h)" $(git describe --tags --abbrev=0 2>/dev/null || git rev-list --max-parents=0 HEAD)..HEAD | grep "^- ${type}(" || true)
    
    if [ ! -z "$commits" ]; then
        echo "### ${changes[$type]}" >> "$TEMP_FILE"
        echo "$commits" | sed 's/^- \([^:]*\):/- /' >> "$TEMP_FILE"
        echo "" >> "$TEMP_FILE"
    fi
done

# Add breaking changes section if any
breaking=$(git log --no-merges --format="- %b" $(git describe --tags --abbrev=0 2>/dev/null || git rev-list --max-parents=0 HEAD)..HEAD | grep "BREAKING CHANGE:" || true)
if [ ! -z "$breaking" ]; then
    echo "### ⚠ BREAKING CHANGES" >> "$TEMP_FILE"
    echo "$breaking" >> "$TEMP_FILE"
    echo "" >> "$TEMP_FILE"
fi

# Prepend new changes to changelog
print_status "$YELLOW" "Updating $CHANGELOG..."
if [ -f "$CHANGELOG" ]; then
    # Get everything after the header
    tail -n +4 "$CHANGELOG" > "$CHANGELOG.tmp"
    # Create new file with header
    head -n 3 "$CHANGELOG" > "$CHANGELOG.new"
    # Add new changes
    cat "$TEMP_FILE" >> "$CHANGELOG.new"
    # Add previous changes
    cat "$CHANGELOG.tmp" >> "$CHANGELOG.new"
    # Replace old changelog
    mv "$CHANGELOG.new" "$CHANGELOG"
    rm "$CHANGELOG.tmp"
else
    cat "$TEMP_FILE" > "$CHANGELOG"
fi

rm "$TEMP_FILE"

print_status "$GREEN" "Changelog updated successfully!"
