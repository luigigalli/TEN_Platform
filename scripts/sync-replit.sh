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
    log "Starting Windsurf to Replit sync..." "$YELLOW"
    log "This will pull Windsurf database changes to Replit" "$YELLOW"

    # Pull changes from Windsurf
    if ! run_command "npm run db:pull -- --from-windsurf" "Pulling changes from Windsurf..."; then
        log "Error pulling from Windsurf. Sync aborted." "$RED"
        exit 1
    fi

    log "Synchronization completed successfully!" "$GREEN"
    log "Windsurf changes have been pulled to Replit database." "$GREEN"
    log "You can now safely proceed with Replit development." "$GREEN"
}

# Run the main function
main
