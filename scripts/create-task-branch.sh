#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Check if task number is provided
if [ -z "$1" ]; then
    print_status "$RED" "Error: Please provide a task number (e.g., ./create-task-branch.sh 123)"
    exit 1
fi

# Check if description is provided
if [ -z "$2" ]; then
    print_status "$RED" "Error: Please provide a brief description (e.g., ./create-task-branch.sh 123 'add-logger')"
    exit 1
fi

TASK_NUMBER=$1
DESCRIPTION=$2
BRANCH_NAME="TENP-${TASK_NUMBER}-${DESCRIPTION}"

# Create branch
print_status "$YELLOW" "Creating branch ${BRANCH_NAME}..."
git checkout develop
git pull origin develop
git checkout -b "$BRANCH_NAME"

if [ $? -ne 0 ]; then
    print_status "$RED" "Error: Failed to create branch"
    exit 1
fi

# Create work log from template
WORK_LOG="task_work_logs/TENP-${TASK_NUMBER}_work_log.md"
TEMPLATE="docs/templates/work-log-template.md"

if [ ! -f "$TEMPLATE" ]; then
    print_status "$RED" "Error: Template file not found at $TEMPLATE"
    exit 1
fi

print_status "$YELLOW" "Creating work log ${WORK_LOG}..."
cp "$TEMPLATE" "$WORK_LOG"

if [ $? -ne 0 ]; then
    print_status "$RED" "Error: Failed to create work log"
    exit 1
fi

# Update work log with task number
sed -i '' "s/TENP-XXX/TENP-${TASK_NUMBER}/g" "$WORK_LOG"

print_status "$GREEN" "Success! Branch and work log created."
print_status "$GREEN" "Branch: $BRANCH_NAME"
print_status "$GREEN" "Work log: $WORK_LOG"
