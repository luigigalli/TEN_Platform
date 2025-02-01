#!/bin/bash

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Source the conversation management functions
source "$PROJECT_ROOT/scripts/shell/manage-conversation.sh"

# Get conversation title from argument or prompt
if [ -z "$1" ]; then
    read -p "Enter conversation title (or press Enter for default): " title
    title=${title:-"New Conversation"}
else
    title="$1"
fi

# Initialize conversation and refresh context
start_conversation "$title" && refresh_conversation_context

echo "Conversation '$title' initialized and context loaded successfully!"
