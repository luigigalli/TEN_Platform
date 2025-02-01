#!/usr/bin/env python3
import os
import sys
from task_workflow import JiraAPI, PROJECT_KEY
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def update_task_statuses():
    jira = JiraAPI(
        os.getenv('JIRA_EMAIL'),
        os.getenv('JIRA_API_TOKEN'),
        os.getenv('JIRA_BASE_URL')
    )
    
    # 1. Update completed tasks with work logs
    completed_tasks = [
        {
            'key': 'TENP-291',
            'log': """# Work Log - Authentication UI Components

## Completed Components
1. Sign-in Form Implementation
   - Created React component with TypeScript
   - Added form validation using Formik
   - Implemented error handling
   - Added responsive design

2. Technical Details
   - Used React 18 with TypeScript
   - Implemented form validation
   - Added error boundary
   - Created reusable components

3. Files Changed
   - Created: src/components/auth/SignInForm.tsx
   - Created: src/components/auth/AuthStyles.ts
   - Created: src/components/common/FormFields.tsx

4. Testing
   - Added unit tests
   - Tested validation
   - Verified error handling

## Next Steps
- Implement sign-up form
- Add password reset flow
- Setup email service"""
        }
    ]
    
    for task in completed_tasks:
        # Update status to Done
        result = jira.update_status(task['key'], 'Done')
        if result:
            logger.info(f"Updated {task['key']} status to Done")
        else:
            logger.error(f"Failed to update {task['key']} status")
        
        # Add work log
        result = jira.create_work_log(task['key'], task['log'])
        if result:
            logger.info(f"Added work log to {task['key']}")
        else:
            logger.error(f"Failed to add work log to {task['key']}")
    
    # 2. Move planned tasks to Selected for Development
    planned_tasks = [
        'TENP-293',  # Password Reset Flow
        'TENP-294',  # Email Service
        'TENP-295',  # Permission Management UI
        'TENP-296',  # Role Management UI
        'TENP-297',  # Permission Check Components
        'TENP-298',  # Admin Dashboard
        'TENP-299',  # User Management Interface
        'TENP-300',  # User Dashboard
        'TENP-301',  # Profile Management
        'TENP-302'   # Admin Control Panel
    ]
    
    for task_key in planned_tasks:
        result = jira.update_status(task_key, 'Selected for Development')
        if result:
            logger.info(f"Updated {task_key} status to Selected for Development")
        else:
            logger.error(f"Failed to update {task_key} status")
    
    # 3. Move first task to In Progress
    next_task = 'TENP-292'  # Sign Up Form
    result = jira.update_status(next_task, 'In Progress')
    if result:
        logger.info(f"Updated {next_task} status to In Progress")
    else:
        logger.error(f"Failed to update {next_task} status")

if __name__ == '__main__':
    update_task_statuses()
