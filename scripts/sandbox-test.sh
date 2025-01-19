#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to print section header
print_header() {
    local message=$1
    echo ""
    print_status "$BLUE" "=== $message ==="
    echo ""
}

# Function to check if command exists
check_command() {
    if ! command -v $1 &> /dev/null; then
        print_status "$RED" "Error: $1 is required but not installed."
        exit 1
    fi
}

# Function to handle errors
handle_error() {
    print_status "$RED" "Error: $1"
    exit 1
}

# Check required commands
check_command "git"
check_command "npm"
check_command "node"

# Set variables
SANDBOX_DIR="/Users/luigigalli/local-dev/TEN_sandbox"
CURRENT_DIR=$(pwd)
APP_VERSION=$(jq -r '.version' version.json)
MGMT_VERSION=$(jq -r '.version' management/management-version.json)

print_header "TEN Platform Sandbox Testing"
print_status "$YELLOW" "App Version: $APP_VERSION"
print_status "$YELLOW" "Management Version: $MGMT_VERSION"

# Step 1: Prepare sandbox environment
print_header "Preparing Sandbox Environment"

# Create or clean sandbox directory
if [ ! -d "$SANDBOX_DIR" ]; then
    print_status "$YELLOW" "Creating sandbox directory..."
    mkdir -p "$SANDBOX_DIR" || handle_error "Failed to create sandbox directory"
else
    print_status "$YELLOW" "Cleaning sandbox directory..."
    rm -rf "${SANDBOX_DIR:?}"/* || handle_error "Failed to clean sandbox directory"
fi

# Step 2: Copy current project to sandbox
print_header "Copying Project to Sandbox"
print_status "$YELLOW" "Copying files..."

# Exclude development files
rsync -av --progress . "$SANDBOX_DIR" \
    --exclude '.git' \
    --exclude 'node_modules' \
    --exclude 'coverage' \
    --exclude '.env' \
    --exclude '*.log' \
    || handle_error "Failed to copy project files"

# Step 3: Setup sandbox environment
print_header "Setting Up Sandbox Environment"
cd "$SANDBOX_DIR" || handle_error "Failed to change to sandbox directory"

# Create sandbox-specific .env file
print_status "$YELLOW" "Creating sandbox environment configuration..."
cat > .env << EOF
NODE_ENV=sandbox
DATABASE_URL=sqlite:///sandbox.db
API_PORT=3001
ENABLE_LOGGING=true
EOF

# Install dependencies
print_status "$YELLOW" "Installing dependencies..."
npm install || handle_error "Failed to install dependencies"

# Step 4: Run database migrations
print_header "Running Database Migrations"
print_status "$YELLOW" "Applying migrations..."
npm run migrate || handle_error "Failed to run migrations"

# Step 5: Run tests
print_header "Running Tests"

# Run unit tests
print_status "$YELLOW" "Running unit tests..."
npm run test:unit || handle_error "Unit tests failed"

# Run integration tests
print_status "$YELLOW" "Running integration tests..."
npm run test:integration || handle_error "Integration tests failed"

# Run E2E tests if available
if [ -f "package.json" ] && grep -q "test:e2e" "package.json"; then
    print_status "$YELLOW" "Running E2E tests..."
    npm run test:e2e || handle_error "E2E tests failed"
fi

# Step 6: Start the application
print_header "Starting Application"
print_status "$YELLOW" "Starting the app in sandbox mode..."
npm run start:sandbox &
APP_PID=$!

# Wait for app to start
print_status "$YELLOW" "Waiting for app to start..."
sleep 5

# Step 7: Run health checks
print_header "Running Health Checks"
print_status "$YELLOW" "Checking API health..."
curl -s http://localhost:3001/health || handle_error "Health check failed"

# Step 8: Run sandbox-specific tests
print_header "Running Sandbox Tests"
print_status "$YELLOW" "Executing sandbox test suite..."
npm run test:sandbox || handle_error "Sandbox tests failed"

# Step 9: Cleanup
print_header "Cleanup"

# Stop the application
if [ ! -z "$APP_PID" ]; then
    print_status "$YELLOW" "Stopping application..."
    kill $APP_PID
fi

# Return to original directory
cd "$CURRENT_DIR"

print_header "Test Summary"
print_status "$GREEN" "✓ Sandbox environment prepared"
print_status "$GREEN" "✓ Dependencies installed"
print_status "$GREEN" "✓ Database migrations applied"
print_status "$GREEN" "✓ Unit tests passed"
print_status "$GREEN" "✓ Integration tests passed"
print_status "$GREEN" "✓ Health checks passed"
print_status "$GREEN" "✓ Sandbox tests passed"

print_header "Next Steps"
print_status "$YELLOW" "1. Review test results in $SANDBOX_DIR/test-results"
print_status "$YELLOW" "2. Check sandbox logs in $SANDBOX_DIR/logs"
print_status "$YELLOW" "3. Run manual tests if needed: cd $SANDBOX_DIR && npm run start:sandbox"

# Create test report
REPORT_FILE="$SANDBOX_DIR/test-report.md"
cat > "$REPORT_FILE" << EOF
# Sandbox Test Report

## Test Information
- Date: $(date +"%Y-%m-%d %H:%M:%S")
- App Version: $APP_VERSION
- Management Version: $MGMT_VERSION

## Test Results
- Unit Tests: ✓ Passed
- Integration Tests: ✓ Passed
- Health Checks: ✓ Passed
- Sandbox Tests: ✓ Passed

## Environment
- Node Version: $(node -v)
- NPM Version: $(npm -v)
- OS: $(uname -s)
- Database: SQLite (sandbox.db)

## Notes
- Test results are available in \`test-results/\`
- Logs are available in \`logs/\`
- Environment configuration in \`.env\`
EOF

print_status "$GREEN" "Test report generated: $REPORT_FILE"
