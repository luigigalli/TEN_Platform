#!/bin/bash

# Get absolute paths
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
REFRESH_SCRIPT="$SCRIPT_DIR/refresh-project-context.sh"
LOG_DIR="$PROJECT_ROOT/logs"

# Ensure directories exist
mkdir -p "$LOG_DIR"

# Create the cron job entry (every 5 minutes)
CRON_JOB="*/5 * * * * $REFRESH_SCRIPT >> $LOG_DIR/context-refresh.log 2>&1"

# Function to log with timestamp
log() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $1" | tee -a "$LOG_DIR/context-refresh.log"
}

# Create or update the crontab
(crontab -l 2>/dev/null | grep -v "$REFRESH_SCRIPT"; echo "$CRON_JOB") | crontab -

log "Cron job has been set up to run every 5 minutes"
log "Logs will be written to: $LOG_DIR/context-refresh.log"

echo ""
echo "Cron job setup complete. Important information:"
echo "1. Logs location: $LOG_DIR/context-refresh.log"
echo "2. Lock file: /tmp/refresh-context.lock"
echo "3. Last refresh time: $PROJECT_ROOT/.last-refresh"
echo ""
echo "To manage the cron job:"
echo "- View current jobs: crontab -l"
echo "- Edit jobs: crontab -e"
echo "- Remove all jobs: crontab -r"
echo ""
echo "To test the refresh system:"
echo "1. Manual refresh: refresh_context"
echo "2. Check status: last_refresh"
echo "3. View logs: tail -f $LOG_DIR/context-refresh.log"
