#!/usr/bin/env python3
from jira import JIRA
from dotenv import load_dotenv
import os

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

# Move TENP-232 to Review
issue = jira.issue('TENP-232')
jira.transition_issue(issue, 'Review')
print("TENP-232 moved to Review")
