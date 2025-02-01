#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_ROOT/logs"
LOCK_FILE="/tmp/refresh-context.lock"

# Ensure log directory exists
mkdir -p "$LOG_DIR"

# Function to log with timestamp
log() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $1" | tee -a "$LOG_DIR/context-refresh.log"
}

# Check for existing lock
if [ -f "$LOCK_FILE" ]; then
    PID=$(cat "$LOCK_FILE")
    if ps -p $PID > /dev/null; then
        log "Another refresh process is already running (PID: $PID)"
        exit 1
    else
        log "Removing stale lock file"
        rm "$LOCK_FILE"
    fi
fi

# Create new lock file
echo $$ > "$LOCK_FILE"

# Cleanup function
cleanup() {
    rm -f "$LOCK_FILE"
}
trap cleanup EXIT

# Change to project directory
cd "$PROJECT_ROOT" || exit 1

log "Starting context refresh..."

# Ensure Jira environment is set
if [ ! -f "$PROJECT_ROOT/.env" ]; then
    log "Warning: .env file not found, Jira integration may not work"
fi

# Run TypeScript context refresh
if ! tsx scripts/refresh-context.ts; then
    log "Error: Context refresh failed"
    exit 1
fi

# Update last refresh time
echo "$(date '+%Y-%m-%d %H:%M:%S')" > "$PROJECT_ROOT/.last-refresh"

log "Context refresh complete"
