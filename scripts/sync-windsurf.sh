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
    log "Starting Windsurf session sync..." "$YELLOW"
    log "This will push your local changes to Replit" "$YELLOW"
    
    # Push local changes to Replit
    if ! run_command "npm run db:push-replit" "Pushing local changes to Replit..."; then
        log "Error pushing to Replit. Sync aborted." "$RED"
        exit 1
    fi
    
    log "Synchronization completed successfully!" "$GREEN"
    log "Your local changes have been pushed to Replit." "$GREEN"
    log "You can now safely switch to Replit environment." "$GREEN"
}

# Run the main function
main
