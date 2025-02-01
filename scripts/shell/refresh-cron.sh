#!/bin/bash

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Load environment variables
if [ -f "$PROJECT_ROOT/.env" ]; then
    source "$PROJECT_ROOT/.env"
fi

# Log file for cron output
LOG_FILE="$PROJECT_ROOT/.windsurf/logs/refresh-cron.log"

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Check if there's an active conversation
if [ -f "$PROJECT_ROOT/.windsurf/current_conversation" ]; then
    log "Starting context refresh..."
    
    # Run the refresh script
    cd "$PROJECT_ROOT" && \
    WINDSURF_API_KEY="$WINDSURF_API_KEY" \
    WINDSURF_API_ENDPOINT="$WINDSURF_API_ENDPOINT" \
    npx tsx scripts/refresh-context.mjs --conversation="$(cat "$PROJECT_ROOT/.windsurf/current_conversation")" >> "$LOG_FILE" 2>&1
    
    EXIT_CODE=$?
    if [ $EXIT_CODE -eq 0 ]; then
        log "Context refresh completed successfully"
    else
        log "Context refresh failed with exit code $EXIT_CODE"
    fi
else
    log "No active conversation found"
fi
