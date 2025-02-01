#!/bin/bash

# Check if JIRA_API_TOKEN is set in environment
if [ -z "$JIRA_API_TOKEN" ]; then
    echo "Error: JIRA_API_TOKEN environment variable is not set"
    echo "Please set it in your environment or .env file first"
    exit 1
fi

# Check if JIRA_EMAIL is set in environment
if [ -z "$JIRA_EMAIL" ]; then
    echo "Error: JIRA_EMAIL environment variable is not set"
    echo "Please set it in your environment or .env file first"
    exit 1
fi

# Export the variables
export JIRA_API_TOKEN
export JIRA_EMAIL

echo "Jira environment variables have been set"
