#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print with timestamp
log() {
    echo -e "${2:-$GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

# Function to run a command and check its status
run_command() {
    local command="$1"
    local message="$2"
    
    log "$message" "$YELLOW"
    if eval "$command"; then
        log "✓ Success: $message" "$GREEN"
        return 0
    else
        log "✗ Failed: $message" "$RED"
        return 1
    fi
}

# Main sync function
main() {
    log "Starting Replit session sync..." "$YELLOW"
    log "This will pull Replit changes to your local database" "$YELLOW"
    
    # Pull changes from Replit
    if ! run_command "npm run db:pull" "Pulling changes from Replit..."; then
        log "Error pulling from Replit. Sync aborted." "$RED"
        exit 1
    fi
    
    log "Synchronization completed successfully!" "$GREEN"
    log "Replit changes have been pulled to your local database." "$GREEN"
    log "You can now safely start development in Windsurf." "$GREEN"
}

# Run the main function
main
