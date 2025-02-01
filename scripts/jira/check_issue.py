#!/usr/bin/env python3
import os
import sys
from jira import JIRA
from dotenv import load_dotenv

def main():
    # Load environment variables
    load_dotenv()
    
    # Get Jira credentials from environment
    email = os.getenv('JIRA_EMAIL')
    api_token = os.getenv('JIRA_API_TOKEN')
    server = os.getenv('JIRA_BASE_URL')
    
    if not all([email, api_token, server]):
        print("Error: Missing required environment variables")
        sys.exit(1)
    
    # Check command line arguments
    if len(sys.argv) != 2:
        print("Usage: python check_issue.py <issue-key>")
        sys.exit(1)
    
    issue_key = sys.argv[1]
    
    try:
        # Initialize Jira client
        jira = JIRA(
            server=server,
            basic_auth=(email, api_token)
        )
        
        print(f"\nSuccessfully authenticated as: {jira.current_user()}")
        
        # Get the issue
        issue = jira.issue(issue_key)
        
        # Get issue details
        print(f"\nIssue {issue_key} details:")
        print(f"Status: {issue.fields.status}")
        print(f"Summary: {issue.fields.summary}")
        
        # Get issue history
        print("\nStatus history:")
        for history in jira.issue_changelog(issue):
            for item in history.items:
                if item.field == 'status':
                    print(f"From '{item.fromString}' to '{item.toString}' on {history.created}")
        
    except Exception as e:
        print(f"\nError: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
