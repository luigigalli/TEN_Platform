#!/usr/bin/env python3
import os
import sys
from task_workflow import JiraAPI, PROJECT_KEY
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def update_completed_tasks():
    jira = JiraAPI(
        os.getenv('JIRA_EMAIL'),
        os.getenv('JIRA_API_TOKEN'),
        os.getenv('JIRA_BASE_URL')
    )
    
    completed_tasks = [
        {
            'key': 'TENP-292',
            'log': """# Work Log - Sign Up Form Implementation

## Completed Components
1. Sign Up Form
   - Created React component with TypeScript
   - Added Zod validation
   - Implemented password strength meter
   - Added responsive design
   - Created comprehensive tests

2. Technical Details
   - Used React 18 with TypeScript
   - Implemented Zod validation
   - Added password strength visualization
   - Created reusable components

3. Files Changed
   - Created: src/components/auth/SignUpForm.tsx
   - Created: src/components/common/PasswordStrengthMeter.tsx
   - Created: src/components/auth/__tests__/SignUpForm.test.tsx
   - Created: src/components/common/__tests__/PasswordStrengthMeter.test.tsx

4. Testing
   - Added unit tests for all components
   - Tested validation rules
   - Verified password strength meter
   - Tested error handling"""
        },
        {
            'key': 'TENP-294',
            'log': """# Work Log - Email Service Implementation

## Completed Components
1. Email Service
   - Set up nodemailer integration
   - Created email templates
   - Added email verification flow
   - Implemented password reset

2. Technical Details
   - Used nodemailer for email sending
   - Created React Email templates
   - Added comprehensive testing
   - Set up environment variables

3. Files Changed
   - Created: src/services/EmailService.ts
   - Created: src/emails/WelcomeEmail.tsx
   - Created: src/emails/VerificationEmail.tsx
   - Created: src/emails/ResetPasswordEmail.tsx
   - Created: src/services/__tests__/EmailService.test.ts

4. Testing
   - Added unit tests for email service
   - Tested all email templates
   - Verified email sending
   - Tested error handling"""
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

if __name__ == '__main__':
    update_completed_tasks()
