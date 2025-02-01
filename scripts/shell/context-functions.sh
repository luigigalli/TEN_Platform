#!/bin/bash

# Function to refresh context manually
refresh_context() {
    local script_path="/Users/luigigalli/local-dev/TEN/TEN_Platform/scripts/refresh-project-context.sh"
    if [ -f "$script_path" ]; then
        "$script_path"
    else
        echo "Error: Context refresh script not found at $script_path"
        return 1
    fi
}

# Function to show last refresh time
last_refresh() {
    local refresh_file="/Users/luigigalli/local-dev/TEN/TEN_Platform/.last-refresh"
    if [ -f "$refresh_file" ]; then
        echo "Last context refresh: $(cat "$refresh_file")"
    else
        echo "No previous refresh found"
    fi
}

# Add these to your shell
# Add to your ~/.zshrc:
# source /Users/luigigalli/local-dev/TEN/TEN_Platform/scripts/shell/context-functions.sh
