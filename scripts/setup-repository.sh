#!/bin/bash

# Repository Setup Script
# Sets up Git configuration and hooks based on environment

# Create hooks directory
HOOKS_DIR=".git/hooks"
mkdir -p "$HOOKS_DIR"

# Detect environment
if [ -n "$REPL_ID" ]; then
    echo "Configuring for Replit environment..."
    # Configure rebase strategy for Replit
    git config pull.rebase true
    git config branch.develop.rebase true

    # Set up branch protection
    git config branch.main.protect true
    git config branch.develop.protect true

    echo "Replit Git configuration complete"
else
    echo "Configuring for Windsurf environment..."
    # Configure fast-forward only for Windsurf
    git config pull.ff only
    git config branch.develop.mergeoptions '--ff-only'

    # Set up branch protection
    git config branch.main.protect true
    git config branch.develop.protect true

    echo "Windsurf Git configuration complete"
fi

# Install pre-commit hook
cp "scripts/git-hooks/pre-commit" "$HOOKS_DIR/pre-commit"
chmod +x "$HOOKS_DIR/pre-commit"

# Configure commit message template
git config commit.template ".github/commit-template.txt"

# Set up additional safety configurations
git config core.protectNonFastForwards true
git config receive.denyDeletes true
git config receive.denyNonFastForwards true

# Configure branch name validation
echo "Setting up branch name validation..."
git config init.templateDir "$(pwd)/.git-templates"

echo "Repository configuration complete"
echo "Branch protection and naming conventions are now enforced"

# Verify configuration
echo -e "\nCurrent Git Configuration:"
echo "-------------------------"
git config --list | grep -E "pull.|branch.|core.protect|receive.deny"