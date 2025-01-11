#!/usr/bin/env python3
import os
import sys
from jira import JIRA
from dotenv import load_dotenv
import json
from datetime import datetime

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

class DevelopmentWorkflow:
    def __init__(self):
        self.project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        self.work_log_dir = os.path.join(self.project_root, 'task_work_logs')
        self.program_file = os.path.join(self.project_root, 'development_program.json')
        os.makedirs(self.work_log_dir, exist_ok=True)

    def get_parent_story(self, issue):
        """Get the parent story of a task"""
        if hasattr(issue.fields, 'parent'):
            return issue.fields.parent
        return None

    def create_development_program(self):
        """Create or update the development program"""
        print("\nCreating Development Program")
        print("Enter task IDs to include (one per line, empty line to finish):")
        
        tasks = []
        while True:
            task_id = input().strip()
            if not task_id:
                break
            try:
                issue = jira.issue(task_id)
                tasks.append({
                    'id': task_id,
                    'summary': issue.fields.summary,
                    'status': issue.fields.status.name,
                    'priority': len(tasks) + 1
                })
                # Move to Selected for Development if not already
                if issue.fields.status.name not in ['Selected for Development', 'In Progress', 'Testing', 'Review']:
                    jira.transition_issue(issue, 'Selected for Development')
            except Exception as e:
                print(f"Error with task {task_id}: {str(e)}")
        
        if tasks:
            with open(self.program_file, 'w') as f:
                json.dump(tasks, f, indent=2)
            print("\nDevelopment program created!")
            return tasks
        return None

    def load_development_program(self):
        """Load the existing development program"""
        if os.path.exists(self.program_file):
            with open(self.program_file, 'r') as f:
                return json.load(f)
        return None

    def create_work_log(self, task_id, summary, parent_story=None):
        """Create work log for a task"""
        work_log_path = os.path.join(self.work_log_dir, f'{task_id}_work_log.md')
        
        with open(work_log_path, 'w') as f:
            f.write(f"# Task Work Log - {task_id}\n\n")
            if parent_story:
                f.write(f"Parent Story: {parent_story.key} - {parent_story.fields.summary}\n\n")
            f.write(f"## {summary}\n\n")
            f.write(f"### Development Started: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n\n")
            f.write("#### Implementation Details\n- \n\n")
            f.write("#### Code Changes\n- \n\n")
            f.write("#### Dependencies\n- \n\n")
            f.write("#### Configuration Changes\n- \n\n")
            f.write("#### Testing Notes\n- \n\n")
            f.write("#### Related Tasks\n- \n")
        
        return work_log_path

    def update_project_brief(self, story_key, task_id, summary):
        """Update PROJECT_BRIEF.md with story-level documentation"""
        brief_path = os.path.join(self.project_root, 'PROJECT_BRIEF.md')
        
        with open(brief_path, 'a') as f:
            f.write(f"\n## Story Update ({story_key}) - {datetime.now().strftime('%Y-%m-%d')}\n")
            f.write(f"Task Completed: {task_id} - {summary}\n\n")
            f.write("### Changes\n- \n\n")
            f.write("### Design Decisions\n- \n\n")
            f.write("### Integration Points\n- \n\n")
            f.write("### User Impact\n- \n\n")

    def start_task(self, task):
        """Start working on a task"""
        issue = jira.issue(task['id'])
        
        # Move to In Progress
        if issue.fields.status.name != 'In Progress':
            jira.transition_issue(issue, 'In Progress')
        
        # Create work log
        parent_story = self.get_parent_story(issue)
        work_log = self.create_work_log(task['id'], task['summary'], parent_story)
        print(f"\nTask {task['id']} moved to In Progress")
        print(f"Work log created at: {work_log}")

    def complete_task(self, task):
        """Complete a task"""
        work_log_path = os.path.join(self.work_log_dir, f"{task['id']}_work_log.md")
        
        if not os.path.exists(work_log_path):
            print(f"Error: Work log for {task['id']} not found!")
            return
            
        # Update work log with completion time
        with open(work_log_path, 'a') as f:
            f.write(f"\n### Development Completed: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n")
        
        issue = jira.issue(task['id'])
        
        # Determine next status based on task type
        if 'test' in issue.fields.summary.lower() or 'testing' in issue.fields.summary.lower():
            next_status = 'Review'
        else:
            next_status = 'Testing'
        
        # Move to next status
        jira.transition_issue(issue, next_status)
        print(f"\nTask {task['id']} moved to {next_status}")
        print("Don't forget to update the work log with final details!")

    def complete_review(self, task):
        """Handle review completion"""
        issue = jira.issue(task['id'])
        parent_story = self.get_parent_story(issue)
        
        print("\nReview Completion Options:")
        print("1. Approve and Move to Done")
        print("2. Send Back to In Progress")
        print("3. Discard Task")
        
        choice = input("\nEnter your choice (1-3): ")
        
        if choice == '1':
            # Update work log with completion
            work_log_path = os.path.join(self.work_log_dir, f"{task['id']}_work_log.md")
            with open(work_log_path, 'a') as f:
                f.write(f"\n### Review Completed: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n")
                f.write("Status: Approved\n")
            
            # Move to Done
            jira.transition_issue(issue, 'Done')
            
            # If this completes a story feature, update PROJECT_BRIEF
            if parent_story:
                print("\nThis task is part of story:", parent_story.key)
                update_brief = input("Would you like to update PROJECT_BRIEF with story documentation? (y/n): ")
                if update_brief.lower() == 'y':
                    self.update_project_brief(parent_story.key, task['id'], task['summary'])
            
            print(f"\nTask {task['id']} completed and moved to Done")
            
        elif choice == '2':
            reason = input("Enter reason for returning to development: ")
            # Update work log
            work_log_path = os.path.join(self.work_log_dir, f"{task['id']}_work_log.md")
            with open(work_log_path, 'a') as f:
                f.write(f"\n### Review Feedback: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n")
                f.write(f"Status: Returned to Development\n")
                f.write(f"Reason: {reason}\n")
            
            # Move back to In Progress
            jira.transition_issue(issue, 'In Progress')
            print(f"\nTask {task['id']} moved back to In Progress")
            
        elif choice == '3':
            reason = input("Enter reason for discarding: ")
            # Update work log
            work_log_path = os.path.join(self.work_log_dir, f"{task['id']}_work_log.md")
            with open(work_log_path, 'a') as f:
                f.write(f"\n### Task Discarded: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n")
                f.write(f"Reason: {reason}\n")
            
            # Move to Won't Do or similar status
            jira.transition_issue(issue, "Won't Do")
            print(f"\nTask {task['id']} discarded")

    def show_program_status(self):
        """Show the current status of all tasks in the program"""
        tasks = self.load_development_program()
        if not tasks:
            print("No development program found.")
            return
            
        print("\nDevelopment Program Status:")
        print("---------------------------")
        
        for task in tasks:
            issue = jira.issue(task['id'])
            current_status = issue.fields.status.name
            print(f"{task['id']} - {task['summary']}")
            print(f"Priority: {task['priority']}")
            print(f"Status: {current_status}")
            
            work_log_path = os.path.join(self.work_log_dir, f"{task['id']}_work_log.md")
            if os.path.exists(work_log_path):
                print("Work Log: ")
            else:
                print("Work Log: ")
            print("---------------------------")

def main():
    workflow = DevelopmentWorkflow()
    
    while True:
        print("\nDevelopment Workflow Menu:")
        print("1. Create New Development Program")
        print("2. Show Program Status")
        print("3. Start Task")
        print("4. Complete Current Task")
        print("5. Complete Review")
        print("0. Exit")
        
        try:
            choice = input("\nEnter your choice (0-5): ")
            
            if choice == '1':
                workflow.create_development_program()
            
            elif choice == '2':
                workflow.show_program_status()
            
            elif choice == '3':
                tasks = workflow.load_development_program()
                if not tasks:
                    print("No development program found. Create one first.")
                    continue
                    
                print("\nAvailable tasks:")
                for task in tasks:
                    issue = jira.issue(task['id'])
                    if issue.fields.status.name == 'Selected for Development':
                        print(f"{task['priority']}. {task['id']} - {task['summary']}")
                
                task_num = int(input("\nEnter task priority number to start: "))
                task = next((t for t in tasks if t['priority'] == task_num), None)
                if task:
                    workflow.start_task(task)
                else:
                    print("Invalid task number!")
            
            elif choice == '4':
                tasks = workflow.load_development_program()
                if not tasks:
                    print("No development program found.")
                    continue
                    
                print("\nIn Progress tasks:")
                in_progress = []
                for task in tasks:
                    issue = jira.issue(task['id'])
                    if issue.fields.status.name == 'In Progress':
                        in_progress.append(task)
                        print(f"{task['priority']}. {task['id']} - {task['summary']}")
                
                if not in_progress:
                    print("No tasks in progress!")
                    continue
                    
                task_num = int(input("\nEnter task priority number to complete: "))
                task = next((t for t in tasks if t['priority'] == task_num), None)
                if task:
                    workflow.complete_task(task)
                else:
                    print("Invalid task number!")
            
            elif choice == '5':
                tasks = workflow.load_development_program()
                if not tasks:
                    print("No development program found.")
                    continue
                    
                print("\nTasks in Review:")
                in_review = []
                for task in tasks:
                    issue = jira.issue(task['id'])
                    if issue.fields.status.name == 'Review':
                        in_review.append(task)
                        print(f"{task['priority']}. {task['id']} - {task['summary']}")
                
                if not in_review:
                    print("No tasks in review!")
                    continue
                    
                task_num = int(input("\nEnter task priority number to complete review: "))
                task = next((t for t in tasks if t['priority'] == task_num), None)
                if task:
                    workflow.complete_review(task)
                else:
                    print("Invalid task number!")
            
            elif choice == '0':
                break
                
            else:
                print("Invalid choice!")
                
        except ValueError as e:
            print(f"Invalid input: {str(e)}")
        except Exception as e:
            print(f"Error: {str(e)}")

if __name__ == '__main__':
    main()
