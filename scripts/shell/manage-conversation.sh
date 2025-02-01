#!/bin/bash

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Function to start a new conversation
start_conversation() {
    # Get conversation title from first argument or use default
    local title="${1:-"New Conversation"}"
    
    # Create new conversation with title
    conversation_id=$(node "$PROJECT_ROOT/scripts/manage-conversation.mjs" create "$title")
    if [ -n "$conversation_id" ]; then
        echo "export WINDSURF_CONVERSATION_ID='$conversation_id'" > "$PROJECT_ROOT/.windsurf/current_conversation"
        source "$PROJECT_ROOT/.windsurf/current_conversation"
        echo "Started new conversation: $title ($conversation_id)"
    else
        echo "Failed to create conversation"
        return 1
    fi
}

# Function to refresh context for current conversation
refresh_conversation_context() {
    if [ -f "$PROJECT_ROOT/.windsurf/current_conversation" ]; then
        source "$PROJECT_ROOT/.windsurf/current_conversation"
        if [ -n "$WINDSURF_CONVERSATION_ID" ]; then
            node "$PROJECT_ROOT/scripts/refresh-context.mjs" --conversation="$WINDSURF_CONVERSATION_ID"
            echo "Refreshed context for conversation: $WINDSURF_CONVERSATION_ID"
        else
            echo "No conversation ID found"
            return 1
        fi
    else
        echo "No active conversation. Start one with: start_conversation"
        return 1
    fi
}

# Function to list all conversations
list_conversations() {
    node "$PROJECT_ROOT/scripts/manage-conversation.mjs" list
}

# Add these functions to the shell
if ! declare -F start_conversation > /dev/null; then
    export -f start_conversation
fi

if ! declare -F refresh_conversation_context > /dev/null; then
    export -f refresh_conversation_context
fi

if ! declare -F list_conversations > /dev/null; then
    export -f list_conversations
fi
