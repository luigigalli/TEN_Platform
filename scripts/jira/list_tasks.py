import os
import requests
from requests.auth import HTTPBasicAuth
from config import *

def list_tasks():
    base_url = f"{JIRA_BASE_URL}/rest/api/{JIRA_API_VERSION}"
    auth = HTTPBasicAuth(JIRA_EMAIL, JIRA_API_TOKEN)
    headers = {'Accept': 'application/json'}

    try:
        # First verify authentication
        response = requests.get(
            f"{base_url}/myself",
            auth=auth,
            headers=headers
        )
        response.raise_for_status()
        print("Successfully authenticated as:", response.json()['displayName'])

        # Get all issues in the TENP project
        search_url = f"{base_url}/search"
        jql = f'project = "TENP" ORDER BY key ASC'
        
        response = requests.get(
            search_url,
            auth=auth,
            headers=headers,
            params={
                'jql': jql,
                'fields': 'summary,status,issuetype,parent',
                'maxResults': 100
            }
        )
        response.raise_for_status()
        data = response.json()
        
        if 'issues' not in data:
            print(f"No issues found. Response: {data}")
            return
            
        issues = data['issues']
        
        print(f"\nAll Tasks in TENP Project:")
        print("=" * 40)
        for issue in issues:
            key = issue['key']
            fields = issue['fields']
            summary = fields['summary']
            status = fields['status']['name']
            issuetype = fields['issuetype']['name']
            parent = fields.get('parent', {}).get('key', 'No parent')
            
            print(f"{key}: {summary}")
            print(f"Type: {issuetype}")
            print(f"Status: {status}")
            if parent != 'No parent':
                print(f"Parent: {parent}")
            print("-" * 50)

    except requests.exceptions.RequestException as e:
        print(f"Error: {str(e)}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response content: {e.response.text}")
            print("\nDebug Information:")
            print(f"URL: {search_url if 'search_url' in locals() else base_url}")
            print(f"JQL: {jql if 'jql' in locals() else 'N/A'}")
            print(f"Headers: {headers}")

if __name__ == "__main__":
    list_tasks()
