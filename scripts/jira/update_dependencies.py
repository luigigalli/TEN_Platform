#!/usr/bin/env python3
import os
from jira import JIRA
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Jira connection setup
JIRA_API_TOKEN = os.getenv('JIRA_API_TOKEN')
JIRA_EMAIL = os.getenv('JIRA_EMAIL')
JIRA_URL = os.getenv('JIRA_BASE_URL')

# Initialize Jira client
jira = JIRA(
    basic_auth=(JIRA_EMAIL, JIRA_API_TOKEN),
    server=JIRA_URL
)

# Dependencies to add
DEPENDENCIES = [
    # Request Validation depends on Error Handling
    ('TENP-73', 'TENP-74'),
    
    # API Documentation depends on Request Validation and Error Handling
    ('TENP-74', 'TENP-75'),
    ('TENP-73', 'TENP-75'),
    
    # Request Validation and Data Validation should align
    ('TENP-74', 'TENP-84'),
    
    # Subtask dependencies
    ('TENP-237', 'TENP-241'),  # Error Types -> Validation Middleware
    ('TENP-242', 'TENP-257'),  # Schema Definition -> Validation Rules
]

def update_dependencies():
    print("Updating dependencies...")
    
    for blocker, blocked in DEPENDENCIES:
        print(f"Setting {blocker} blocks {blocked}")
        try:
            jira.create_issue_link(
                type='Blocks',
                inwardIssue=blocker,
                outwardIssue=blocked
            )
            print("✓ Link created")
        except Exception as e:
            print(f"✗ Error: {str(e)}")

if __name__ == '__main__':
    update_dependencies()
