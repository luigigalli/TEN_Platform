import os
import requests
from requests.auth import HTTPBasicAuth
from datetime import datetime
from config import *

def get_auth():
    return HTTPBasicAuth(JIRA_EMAIL, JIRA_API_TOKEN)

def get_headers():
    return {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }

def get_transition_id(auth, headers, issue_key, target_status):
    """Get the transition ID for moving to a specific status"""
    base_url = f"{JIRA_BASE_URL}/rest/api/{JIRA_API_VERSION}"
    transitions_url = f"{base_url}/issue/{issue_key}/transitions"
    
    response = requests.get(
        transitions_url,
        auth=auth,
        headers=headers
    )
    response.raise_for_status()
    
    transitions = response.json()['transitions']
    transition = next(
        (t for t in transitions if target_status.lower() in t['name'].lower()),
        None
    )
    
    if not transition:
        print(f"Available transitions for {issue_key}:", [t['name'] for t in transitions])
        return None
        
    return transition['id']

def update_task_status(issue_key, new_status, comment=None):
    """Update the status of a task and optionally add a comment"""
    base_url = f"{JIRA_BASE_URL}/rest/api/{JIRA_API_VERSION}"
    auth = get_auth()
    headers = get_headers()

    try:
        # Get the transition ID
        transition_id = get_transition_id(auth, headers, issue_key, new_status)
        if not transition_id:
            print(f"Could not find transition to '{new_status}' for {issue_key}")
            return False

        # Move the issue
        transitions_url = f"{base_url}/issue/{issue_key}/transitions"
        response = requests.post(
            transitions_url,
            auth=auth,
            headers=headers,
            json={'transition': {'id': transition_id}}
        )
        response.raise_for_status()
        
        # Add comment if provided
        if comment:
            comment_url = f"{base_url}/issue/{issue_key}/comment"
            response = requests.post(
                comment_url,
                auth=auth,
                headers=headers,
                json={'body': comment}
            )
            response.raise_for_status()
        
        print(f"Successfully updated {issue_key} to {new_status}")
        if comment:
            print(f"Added comment to {issue_key}")
        return True

    except requests.exceptions.RequestException as e:
        print(f"Error updating {issue_key}: {str(e)}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response content: {e.response.text}")
        return False

def get_task_status(issue_key):
    """Get the current status of a task"""
    base_url = f"{JIRA_BASE_URL}/rest/api/{JIRA_API_VERSION}"
    auth = get_auth()
    headers = get_headers()

    try:
        response = requests.get(
            f"{base_url}/issue/{issue_key}",
            auth=auth,
            headers=headers,
            params={'fields': 'status,summary'}
        )
        response.raise_for_status()
        
        issue = response.json()
        return {
            'key': issue_key,
            'summary': issue['fields']['summary'],
            'status': issue['fields']['status']['name']
        }

    except requests.exceptions.RequestException as e:
        print(f"Error getting status for {issue_key}: {str(e)}")
        return None

def track_selected_tasks():
    """Track the progress of all selected tasks"""
    # List of tasks we're tracking (from move_to_selected.py)
    tasks = [
        # Core API Framework tasks
        "TENP-72",  # API Structure Setup
        "TENP-73",  # Error Handling
        "TENP-74",  # Request Validation
        
        # Database Architecture tasks
        "TENP-79",  # Schema Design
        "TENP-80",  # Migration System
        "TENP-81",  # Entity Models
        
        # Development Environment tasks
        "TENP-71",  # Setup Express.js with TypeScript
        
        # Testing Framework tasks
        "TENP-75",  # API Documentation
        "TENP-78",  # Logging System
        "TENP-84",  # Data Validation
        "TENP-98",  # Unit Testing Framework Setup
        "TENP-99",  # Integration Testing Setup
        "TENP-100",  # API Testing Suite
        "TENP-101",  # Database Testing Utils
        "TENP-102",  # Test Data Management
        "TENP-103",  # CI Test Pipeline
    ]
    
    print("\nTracking Selected Tasks:")
    print("======================")
    
    # Group tasks by status
    status_groups = {}
    for task_key in tasks:
        task_info = get_task_status(task_key)
        if task_info:
            status = task_info['status']
            if status not in status_groups:
                status_groups[status] = []
            status_groups[status].append(task_info)
    
    # Print tasks grouped by status
    for status, tasks in status_groups.items():
        print(f"\n{status}:")
        print("-" * (len(status) + 1))
        for task in tasks:
            print(f"{task['key']}: {task['summary']}")

def example_usage():
    """Example of how to use this script"""
    # Track all tasks
    track_selected_tasks()
    
    # Example: Update a specific task
    issue_key = "TENP-71"  # Setup Express.js with TypeScript
    new_status = "In Progress"
    comment = f"Started working on this task at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    
    update_task_status(issue_key, new_status, comment)

if __name__ == "__main__":
    track_selected_tasks()
