#!/usr/bin/env python3
from jira_utils import init_jira, perform_transition, get_project_tasks, get_epics, update_issue
from typing import List, Tuple
import argparse

def update_tasks(task_key: str = None, status: str = None, comment: str = None) -> List[Tuple[str, bool, str]]:
    """Update Jira tasks and return results"""
    jira, error = init_jira()
    if error:
        return [("INIT", False, f"Failed to initialize JIRA: {error}")]
    
    if task_key and status:
        # Update specific task status
        success, message = perform_transition(jira, task_key, status)
        if success and comment:
            jira.add_comment(task_key, comment)
        return [(task_key, success, message)]
    
    # If no specific task, show project status
    epics = get_epics(jira, "TEN Platform")
    print("\nEpics in TEN Platform project:")
    print("==============================")
    for epic in epics:
        print(f"{epic['key']}: {epic['summary']} ({epic['status']})")
    print("\n")
    
    active_tasks = get_project_tasks(jira, "TEN Platform", ["In Progress", "Selected for Development", "Done"])
    
    print("\nActive tasks in TEN Platform project:")
    print("=====================================")
    for task in active_tasks:
        print(f"\n{task['key']}: {task['summary']}")
        print(f"Status: {task['status']}")
        print(f"Priority: {task['priority']}")
        print(f"Epic: {task['epic_link'] or 'None'}")
        if task['description']:
            print(f"Description: {task['description'][:200]}...")
        print("-" * 50)
    
    return []

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Update Jira task status')
    parser.add_argument('--key', help='Jira task key (e.g., TENP-79)')
    parser.add_argument('--status', help='Target status (e.g., Done)')
    parser.add_argument('--comment', help='Comment to add to the task')
    args = parser.parse_args()
    
    results = update_tasks(args.key, args.status, args.comment)
    for task_id, success, message in results:
        status = "✓" if success else "✗"
        print(f"{status} {task_id}: {message}")
