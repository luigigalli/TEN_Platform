#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Source and destination directories
SOURCE_DIR="/Users/luigigalli/local-dev/TEN/TEN_Platform"
DEST_DIR="/Users/luigigalli/Documents/GitHub/luigigalli/TEN_2_Replit"

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Check if source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
    print_status "$RED" "Error: Source directory $SOURCE_DIR does not exist"
    exit 1
fi

# Check if destination directory exists
if [ ! -d "$DEST_DIR" ]; then
    print_status "$RED" "Error: Destination directory $DEST_DIR does not exist"
    exit 1
fi

# Print what's about to be synced
print_status "$YELLOW" "Checking for differences between directories..."

# Show files that exist in GitHub but not in local-dev
print_status "$YELLOW" "\nFiles that exist in GitHub but not in local-dev:"
diff -rq "$DEST_DIR" "$SOURCE_DIR" | grep "Only in $DEST_DIR" || echo "None"

# Show files that exist in local-dev but not in GitHub
print_status "$YELLOW" "\nFiles that exist in local-dev but not in GitHub:"
diff -rq "$DEST_DIR" "$SOURCE_DIR" | grep "Only in $SOURCE_DIR" | grep -v "node_modules" || echo "None"

# Show modified files
print_status "$YELLOW" "\nModified files:"
diff -rq "$DEST_DIR" "$SOURCE_DIR" | grep "differ" | grep -v "node_modules" || echo "None"

# Ask for confirmation
read -p "Do you want to proceed with the sync? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_status "$YELLOW" "Sync cancelled"
    exit 1
fi

# Sync files
print_status "$GREEN" "\nSyncing files..."

# Create an array of directories to sync
declare -a DIRS_TO_SYNC=(
    "server/config"
    "server/middleware"
    "server/openapi"
    "server/routes"
    "server/utils"
    "tests/middleware"
    "tests/api"
    "tests/utils"
    "task_work_logs"
)

# Sync directories
for dir in "${DIRS_TO_SYNC[@]}"; do
    if [ -d "$SOURCE_DIR/$dir" ]; then
        print_status "$GREEN" "Syncing $dir..."
        rsync -av --progress "$SOURCE_DIR/$dir/" "$DEST_DIR/$dir/"
    fi
done

# Sync individual files
declare -a FILES_TO_SYNC=(
    ".mocharc.json"
    "package.json"
    "package-lock.json"
    "tsconfig.json"
    "tsconfig.test.json"
    "tests/mocha.setup.ts"
    "server/app.ts"
)

# Sync files
for file in "${FILES_TO_SYNC[@]}"; do
    if [ -f "$SOURCE_DIR/$file" ]; then
        print_status "$GREEN" "Syncing $file..."
        rsync -av --progress "$SOURCE_DIR/$file" "$DEST_DIR/$file"
    fi
done

print_status "$GREEN" "\nSync completed successfully!"
