#!/usr/bin/env python3
import os
import sys
from jira import JIRA
from dotenv import load_dotenv
import subprocess
from datetime import datetime, timedelta

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

# Status configurations
WORKING_STATUSES = ["In Progress", "Testing", "Review"]
READY_TO_START_STATUSES = ["Selected for Development"]

def get_active_tasks():
    """Get tasks that need workflow attention"""
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    work_log_dir = os.path.join(project_root, 'task_work_logs')
    os.makedirs(work_log_dir, exist_ok=True)
    
    tasks_needing_attention = []
    
    # Get tasks ready to start development
    jql_selected = f'''
    project = TENP 
    AND issuetype = Task 
    AND status in ("{'" , "'.join(READY_TO_START_STATUSES)}")
    ORDER BY created DESC
    '''
    
    selected_issues = jira.search_issues(jql_selected)
    for issue in selected_issues:
        tasks_needing_attention.append({
            'task_id': issue.key,
            'summary': issue.fields.summary,
            'reason': 'Ready to start development',
            'action_needed': 'Start Development',
            'status': issue.fields.status.name
        })
    
    # Get tasks in working statuses (need work logs)
    jql_working = f'''
    project = TENP 
    AND issuetype = Task 
    AND status in ("{'" , "'.join(WORKING_STATUSES)}")
    ORDER BY created DESC
    '''
    
    working_issues = jira.search_issues(jql_working)
    for issue in working_issues:
        task_id = issue.key
        status = issue.fields.status.name
        work_log_path = os.path.join(work_log_dir, f'{task_id}_work_log.md')
        
        if not os.path.exists(work_log_path):
            tasks_needing_attention.append({
                'task_id': task_id,
                'summary': issue.fields.summary,
                'reason': f'Missing work log for {status.lower()} task',
                'action_needed': 'Create Work Log',
                'status': status
            })
        else:
            with open(work_log_path, 'r') as f:
                content = f.read().lower()
                if '#### work done\n- \n' in content or '#### technical details\n- \n' in content:
                    tasks_needing_attention.append({
                        'task_id': task_id,
                        'summary': issue.fields.summary,
                        'reason': f'Work log needs updating for {status.lower()} task',
                        'action_needed': 'Update Work Log',
                        'status': status
                    })
    
    return tasks_needing_attention

def trigger_workflow(task_id, action_needed, status):
    """Trigger the task workflow for a specific task"""
    script_path = os.path.join(os.path.dirname(__file__), 'task_workflow.py')
    print(f"\nTask {task_id} ({status}) needs: {action_needed}")
    response = input(f"Would you like to run the workflow for {task_id}? (y/n): ")
    
    if response.lower() == 'y':
        subprocess.run([sys.executable, script_path, task_id])

def main():
    print("Checking for tasks that need workflow attention...")
    tasks = get_active_tasks()
    
    if not tasks:
        print("No tasks need immediate attention.")
        return
        
    print("\nTasks needing attention:")
    
    # Group tasks by status
    status_groups = {}
    for task in tasks:
        status = task['status']
        if status not in status_groups:
            status_groups[status] = []
        status_groups[status].append(task)
    
    task_index = 1
    for status in READY_TO_START_STATUSES + WORKING_STATUSES:
        if status in status_groups:
            print(f"\n{status} Tasks:")
            for task in status_groups[status]:
                print(f"{task_index}. {task['task_id']} - {task['summary']}")
                print(f"   Action Needed: {task['action_needed']}")
                print(f"   Reason: {task['reason']}")
                task_index += 1
    
    while True:
        try:
            choice = int(input("\nSelect a task to process (0 to exit): "))
            if choice == 0:
                break
            if 1 <= choice <= len(tasks):
                task = tasks[choice - 1]
                trigger_workflow(task['task_id'], task['action_needed'], task['status'])
                break
            else:
                print("Invalid choice. Please try again.")
        except ValueError:
            print("Please enter a valid number.")

if __name__ == '__main__':
    main()
