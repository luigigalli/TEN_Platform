#!/usr/bin/env python3
import sys
from jira_utils import init_jira, perform_transition

def main():
    # Check command line arguments
    if len(sys.argv) != 2:
        print("Usage: python move_to_progress.py <issue-key>")
        sys.exit(1)
    
    issue_key = sys.argv[1]
    
    # Initialize Jira
    jira, error = init_jira()
    if error:
        print(f"\nError: {error}")
        sys.exit(1)
    
    print(f"\nSuccessfully authenticated as: {jira.current_user()}")
    
    # Perform transition
    success, error = perform_transition(jira, issue_key, "In Progress")
    if not success:
        print(f"\nError: {error}")
        sys.exit(1)
    
    print(f"\nSuccessfully moved {issue_key} to In Progress")

if __name__ == "__main__":
    main()
