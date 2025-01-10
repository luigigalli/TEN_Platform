import os
import requests
from requests.auth import HTTPBasicAuth
from config import *

def get_transition_id(auth, headers, issue_key):
    base_url = f"{JIRA_BASE_URL}/rest/api/{JIRA_API_VERSION}"
    transitions_url = f"{base_url}/issue/{issue_key}/transitions"
    
    response = requests.get(
        transitions_url,
        auth=auth,
        headers=headers
    )
    response.raise_for_status()
    
    transitions = response.json()['transitions']
    # Look for any transition that moves to "Selected for Development"
    selected_transition = next(
        (t for t in transitions if 'Selected for Development' in t['name']),
        None
    )
    
    if not selected_transition:
        print(f"Available transitions for {issue_key}:", [t['name'] for t in transitions])
        return None
        
    return selected_transition['id']

def move_to_selected(task_keys):
    base_url = f"{JIRA_BASE_URL}/rest/api/{JIRA_API_VERSION}"
    auth = HTTPBasicAuth(JIRA_EMAIL, JIRA_API_TOKEN)
    headers = {'Accept': 'application/json', 'Content-Type': 'application/json'}

    try:
        # First verify authentication
        response = requests.get(
            f"{base_url}/myself",
            auth=auth,
            headers=headers
        )
        response.raise_for_status()
        print("Successfully authenticated as:", response.json()['displayName'])

        # Process each task
        for key in task_keys:
            print(f"\nProcessing {key}...")
            
            # Get the transition ID
            transition_id = get_transition_id(auth, headers, key)
            if not transition_id:
                print(f"Could not find 'Selected for Development' transition for {key}")
                continue
            
            # Move the issue
            transitions_url = f"{base_url}/issue/{key}/transitions"
            response = requests.post(
                transitions_url,
                auth=auth,
                headers=headers,
                json={'transition': {'id': transition_id}}
            )
            response.raise_for_status()
            print(f"Successfully moved {key} to Selected for Development")

    except requests.exceptions.RequestException as e:
        print(f"Error: {str(e)}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response content: {e.response.text}")

if __name__ == "__main__":
    # Previously selected tasks
    previously_selected = [
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
    ]
    
    # New testing-related tasks to move
    testing_tasks = [
        # Testing Framework tasks
        "TENP-75",  # API Documentation (needed for testing)
        "TENP-78",  # Logging System (needed for test monitoring)
        "TENP-84",  # Data Validation (needed for test data)
        
        # Create new tasks for testing
        "TENP-98",  # Unit Testing Framework Setup
        "TENP-99",  # Integration Testing Setup
        "TENP-100",  # API Testing Suite
        "TENP-101",  # Database Testing Utils
        "TENP-102",  # Test Data Management
        "TENP-103",  # CI Test Pipeline
    ]
    
    # Move only the new testing tasks
    move_to_selected(testing_tasks)
