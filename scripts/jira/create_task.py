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
    project_key = os.getenv('JIRA_PROJECT_KEY')
    
    if not all([email, api_token, server, project_key]):
        print("Error: Missing required environment variables")
        sys.exit(1)
    
    # Check command line arguments
    if len(sys.argv) != 4:
        print("Usage: python create_task.py <summary> <description> <issue_type>")
        sys.exit(1)
    
    summary = sys.argv[1]
    description = sys.argv[2]
    issue_type = sys.argv[3]
    
    try:
        # Initialize Jira client
        jira = JIRA(
            server=server,
            basic_auth=(email, api_token)
        )
        
        print(f"\nSuccessfully authenticated as: {jira.current_user()}")
        
        # Create issue
        issue_dict = {
            'project': {'key': project_key},
            'summary': summary,
            'description': description,
            'issuetype': {'name': issue_type},
        }
        
        new_issue = jira.create_issue(fields=issue_dict)
        
        print(f"\nSuccessfully created issue: {new_issue.key}")
        print(f"Summary: {summary}")
        
    except Exception as e:
        print(f"\nError: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
