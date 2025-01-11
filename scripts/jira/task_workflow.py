#!/usr/bin/env python3
import os
import sys
from datetime import datetime
from jira import JIRA
from dotenv import load_dotenv
import json
import re

# Load environment variables
load_dotenv()

# Jira connection setup
JIRA_API_TOKEN = os.getenv('JIRA_API_TOKEN')
JIRA_EMAIL = os.getenv('JIRA_EMAIL')
JIRA_URL = os.getenv('JIRA_BASE_URL')
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Initialize Jira client
jira = JIRA(
    basic_auth=(JIRA_EMAIL, JIRA_API_TOKEN),
    server=JIRA_URL
)

class TaskWorkflow:
    def __init__(self, task_id):
        self.task_id = task_id
        self.task = jira.issue(task_id)
        self.work_log_dir = os.path.join(PROJECT_ROOT, 'task_work_logs')
        os.makedirs(self.work_log_dir, exist_ok=True)

    def get_task_info(self):
        """Get basic task information"""
        return {
            'id': self.task_id,
            'summary': self.task.fields.summary,
            'description': self.task.fields.description,
            'status': self.task.fields.status.name,
            'assignee': self.task.fields.assignee.displayName if self.task.fields.assignee else None
        }

    def create_work_log(self):
        """Create or update task work log"""
        work_log_path = os.path.join(self.work_log_dir, f'{self.task_id}_work_log.md')
        task_info = self.get_task_info()
        
        if not os.path.exists(work_log_path):
            with open(work_log_path, 'w') as f:
                f.write(f"# Task Work Log - {task_info['id']}\n\n")
                f.write(f"## {task_info['summary']}\n")
                f.write(f"**Status**: {task_info['status']}\n\n")
                f.write("## Work Log\n\n")
                f.write(f"### {datetime.now().strftime('%Y-%m-%d %H:%M')}\n")
                f.write("#### Work Done\n- \n\n")
                f.write("#### Technical Details\n- \n\n")
                f.write("#### Verification Steps\n- \n\n")
                f.write("#### Next Steps\n- \n\n")
                f.write("#### Related Tasks\n- \n")
        
        return work_log_path

    def check_dependencies(self):
        """Check and manage task dependencies"""
        links = self.task.fields.issuelinks
        blocking = []
        blocked = []
        
        for link in links:
            if hasattr(link, 'outwardIssue'):
                blocked.append(link.outwardIssue.key)
            if hasattr(link, 'inwardIssue'):
                blocking.append(link.inwardIssue.key)
        
        return {
            'blocking': blocking,
            'blocked': blocked
        }

    def update_project_brief(self, major_decision=None):
        """Update PROJECT_BRIEF.md if major decisions were made"""
        if not major_decision:
            return
            
        brief_path = os.path.join(PROJECT_ROOT, 'PROJECT_BRIEF.md')
        if os.path.exists(brief_path):
            with open(brief_path, 'a') as f:
                f.write(f"\n### {datetime.now().strftime('%Y-%m-%d')}\n")
                f.write(f"**Major Decision ({self.task_id})**: {major_decision}\n")

    def create_subtasks(self, subtasks):
        """Create subtasks for the current task"""
        created = []
        for subtask in subtasks:
            subtask_dict = {
                'project': {'key': 'TENP'},
                'summary': subtask['summary'],
                'description': subtask.get('description', ''),
                'issuetype': {'name': 'Sub-task'},
                'parent': {'key': self.task_id}
            }
            new_subtask = jira.create_issue(fields=subtask_dict)
            created.append(new_subtask.key)
            
            if 'blocks' in subtask:
                for blocked in subtask['blocks']:
                    jira.create_issue_link(
                        type='Blocks',
                        inwardIssue=new_subtask.key,
                        outwardIssue=blocked
                    )
        return created

    def start_development(self):
        """Start development phase"""
        # Move to In Progress
        self.task.update(fields={'status': {'name': 'In Progress'}})
        return self.create_work_log()

    def complete_task(self):
        """Complete the task"""
        # Verify work log exists and is updated
        work_log_path = os.path.join(self.work_log_dir, f'{self.task_id}_work_log.md')
        if not os.path.exists(work_log_path):
            raise Exception("Work log must exist before completing task")
            
        # Move to Done
        self.task.update(fields={'status': {'name': 'Done'}})
        
        # Update blocked tasks
        deps = self.check_dependencies()
        for blocked in deps['blocked']:
            blocked_task = jira.issue(blocked)
            if all(link.inwardIssue.fields.status.name == 'Done' 
                  for link in blocked_task.fields.issuelinks 
                  if hasattr(link, 'inwardIssue')):
                print(f"All blocking tasks for {blocked} are done!")

def main(task_id=None):
    if not task_id:
        task_id = input("Enter task ID (e.g., TENP-123): ")
    
    workflow = TaskWorkflow(task_id)
    
    print("\nTask Workflow Menu:")
    print("1. Start Development")
    print("2. Create Subtasks")
    print("3. Check Dependencies")
    print("4. Update Work Log")
    print("5. Complete Task")
    print("6. Update Project Brief")
    print("0. Exit")
    
    choice = input("\nEnter your choice (0-6): ")
    
    if choice == '1':
        work_log = workflow.start_development()
        print(f"Development started. Work log created at: {work_log}")
    elif choice == '2':
        subtasks = []
        while True:
            summary = input("Enter subtask summary (or 'done' to finish): ")
            if summary.lower() == 'done':
                break
            description = input("Enter subtask description: ")
            subtasks.append({'summary': summary, 'description': description})
        created = workflow.create_subtasks(subtasks)
        print(f"Created subtasks: {', '.join(created)}")
    elif choice == '3':
        deps = workflow.check_dependencies()
        print("\nDependencies:")
        print(f"Blocking tasks: {', '.join(deps['blocking'])}")
        print(f"Blocked tasks: {', '.join(deps['blocked'])}")
    elif choice == '4':
        work_log = workflow.create_work_log()
        print(f"Work log available at: {work_log}")
    elif choice == '5':
        workflow.complete_task()
        print("Task completed!")
    elif choice == '6':
        decision = input("Enter major decision to add to PROJECT_BRIEF: ")
        workflow.update_project_brief(decision)
        print("Project brief updated!")
    elif choice == '0':
        sys.exit(0)

if __name__ == '__main__':
    if len(sys.argv) > 1:
        main(sys.argv[1])
    else:
        main()
