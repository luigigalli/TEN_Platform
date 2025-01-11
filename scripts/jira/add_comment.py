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
    if len(sys.argv) != 3:
        print("Usage: python add_comment.py <issue-key> <comment>")
        sys.exit(1)
    
    issue_key = sys.argv[1]
    comment = sys.argv[2]
    
    try:
        # Initialize Jira client
        jira = JIRA(
            server=server,
            basic_auth=(email, api_token)
        )
        
        print(f"\nSuccessfully authenticated as: {jira.current_user()}")
        
        # Add comment to the issue
        issue = jira.issue(issue_key)
        jira.add_comment(issue, comment)
        
        print(f"\nSuccessfully added comment to {issue_key}")
        
    except Exception as e:
        print(f"\nError: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
