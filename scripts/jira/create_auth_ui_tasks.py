#!/usr/bin/env python3
import os
import sys
from task_workflow import JiraAPI, PROJECT_KEY
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_auth_ui_tasks():
    jira = JiraAPI(
        os.getenv('JIRA_EMAIL'),
        os.getenv('JIRA_API_TOKEN'),
        os.getenv('JIRA_BASE_URL')
    )
    
    start_time = datetime.now().strftime('%Y-%m-%d %H:%M')
    
    # 1. Authentication UI Tasks (TENP-21)
    auth_ui_tasks = [
        {
            "summary": "[UI] Implement Authentication Forms",
            "description": f"""# Task Information
- **Started**: {start_time}
- **Status**: To Do
- **Description**: Create authentication UI components.

## Technical Requirements
1. Sign Up Form
   - Email/password fields
   - User details input
   - Validation rules
   - Error handling
   - Success feedback

2. Password Reset Flow
   - Request reset form
   - Reset token handling
   - New password form
   - Validation and feedback

3. Email Service Integration
   - Welcome email template
   - Verification email
   - Password reset email
   - Email preview system

## Acceptance Criteria
- [ ] Sign up form works end-to-end
- [ ] Password reset flow is complete
- [ ] Email templates are ready
- [ ] All forms have proper validation
- [ ] Error handling is implemented
- [ ] Success feedback is clear"""
        }
    ]
    
    # Create auth UI tasks
    auth_parent = None
    for task in auth_ui_tasks:
        result = jira.create_task(
            summary=task['summary'],
            description=task['description'],
            issue_type='Task'
        )
        if result:
            auth_parent = result['key']
            logger.info(f"Created auth UI task: {result['key']}")
        else:
            logger.error(f"Failed to create task: {task['summary']}")
    
    if auth_parent:
        auth_subtasks = [
            {
                "summary": "[Subtask] Implement Sign Up Form",
                "description": f"""# Task Information
- **Started**: {start_time}
- **Status**: To Do
- **Description**: Create sign up form component with validation.

## Technical Requirements
1. Form Fields
   - Email validation
   - Password requirements
   - User details
   - Terms acceptance

2. Features
   - Real-time validation
   - Password strength meter
   - Form submission handling
   - Error display

## Acceptance Criteria
- [ ] All fields are validated
- [ ] Password requirements enforced
- [ ] Error messages are clear
- [ ] Success flow works"""
            },
            {
                "summary": "[Subtask] Create Password Reset Flow",
                "description": f"""# Task Information
- **Started**: {start_time}
- **Status**: To Do
- **Description**: Implement password reset functionality.

## Technical Requirements
1. Request Reset
   - Email input form
   - Token generation
   - Email sending

2. Reset Password
   - Token validation
   - New password form
   - Success confirmation

## Acceptance Criteria
- [ ] Reset request works
- [ ] Tokens are secure
- [ ] Password update works
- [ ] User feedback is clear"""
            },
            {
                "summary": "[Subtask] Setup Email Service",
                "description": f"""# Task Information
- **Started**: {start_time}
- **Status**: To Do
- **Description**: Configure email service and templates.

## Technical Requirements
1. Email Templates
   - Welcome email
   - Verification email
   - Reset password email
   - HTML templates

2. Service Setup
   - Email provider config
   - Template system
   - Error handling
   - Delivery tracking

## Acceptance Criteria
- [ ] All templates created
- [ ] Emails are delivered
- [ ] Content is correct
- [ ] Tracking works"""
            }
        ]
        
        for subtask in auth_subtasks:
            result = jira.create_task(
                summary=subtask['summary'],
                description=subtask['description'],
                issue_type='Sub-task',
                parent_key=auth_parent
            )
            if result:
                logger.info(f"Created auth subtask: {result['key']}")
            else:
                logger.error(f"Failed to create subtask: {subtask['summary']}")
    
    # 2. Permission System UI Tasks
    perm_tasks = [
        {
            "summary": "[UI] Create Permission Management Interface",
            "description": f"""# Task Information
- **Started**: {start_time}
- **Status**: To Do
- **Description**: Build permission management UI components.

## Technical Requirements
1. Role Management
   - Role listing
   - Role creation/editing
   - Permission assignment
   - User assignment

2. Permission Checks
   - Component-level checks
   - Route protection
   - Action validation
   - Error handling

3. Admin Interface
   - User management
   - Role overview
   - Audit logging
   - Bulk actions

## Acceptance Criteria
- [ ] Roles can be managed
- [ ] Permissions are enforced
- [ ] Admin interface works
- [ ] Audit log is available"""
        }
    ]
    
    # Create permission UI tasks
    perm_parent = None
    for task in perm_tasks:
        result = jira.create_task(
            summary=task['summary'],
            description=task['description'],
            issue_type='Task'
        )
        if result:
            perm_parent = result['key']
            logger.info(f"Created permission UI task: {result['key']}")
        else:
            logger.error(f"Failed to create task: {task['summary']}")
    
    if perm_parent:
        perm_subtasks = [
            {
                "summary": "[Subtask] Implement Role Management UI",
                "description": f"""# Task Information
- **Started**: {start_time}
- **Status**: To Do
- **Description**: Create role management interface.

## Technical Requirements
1. Role Interface
   - List/create/edit roles
   - Assign permissions
   - User assignment
   - Bulk actions

2. Features
   - Search and filter
   - Batch updates
   - History tracking
   - Validation

## Acceptance Criteria
- [ ] CRUD operations work
- [ ] Assignments are saved
- [ ] History is tracked
- [ ] UI is responsive"""
            },
            {
                "summary": "[Subtask] Add Permission Check Components",
                "description": f"""# Task Information
- **Started**: {start_time}
- **Status**: To Do
- **Description**: Create reusable permission check components.

## Technical Requirements
1. Components
   - Protected routes
   - Conditional rendering
   - Action buttons
   - Error states

2. Features
   - Role checking
   - Permission validation
   - Caching
   - Fallbacks

## Acceptance Criteria
- [ ] Components work
- [ ] Checks are efficient
- [ ] Cache is implemented
- [ ] Errors handled"""
            },
            {
                "summary": "[Subtask] Build Admin Dashboard",
                "description": f"""# Task Information
- **Started**: {start_time}
- **Status**: To Do
- **Description**: Create admin dashboard interface.

## Technical Requirements
1. Dashboard Features
   - User management
   - Role overview
   - System status
   - Audit logs

2. Actions
   - User operations
   - Role assignments
   - System settings
   - Log viewing

## Acceptance Criteria
- [ ] Dashboard loads
- [ ] Actions work
- [ ] Data is current
- [ ] UI is intuitive"""
            }
        ]
        
        for subtask in perm_subtasks:
            result = jira.create_task(
                summary=subtask['summary'],
                description=subtask['description'],
                issue_type='Sub-task',
                parent_key=perm_parent
            )
            if result:
                logger.info(f"Created permission subtask: {result['key']}")
            else:
                logger.error(f"Failed to create subtask: {subtask['summary']}")
    
    # 3. User Interface Tasks
    ui_tasks = [
        {
            "summary": "[UI] Create User Management Interface",
            "description": f"""# Task Information
- **Started**: {start_time}
- **Status**: To Do
- **Description**: Build user management UI components.

## Technical Requirements
1. User Dashboard
   - Profile overview
   - Activity history
   - Settings panel
   - Notifications

2. Profile Management
   - Edit profile
   - Privacy settings
   - Preferences
   - Account linking

3. Admin Panel
   - User listing
   - Bulk operations
   - Reports
   - Settings

## Acceptance Criteria
- [ ] Dashboard works
- [ ] Profile edits save
- [ ] Admin panel functions
- [ ] UI is responsive"""
        }
    ]
    
    # Create UI tasks
    ui_parent = None
    for task in ui_tasks:
        result = jira.create_task(
            summary=task['summary'],
            description=task['description'],
            issue_type='Task'
        )
        if result:
            ui_parent = result['key']
            logger.info(f"Created UI task: {result['key']}")
        else:
            logger.error(f"Failed to create task: {task['summary']}")
    
    if ui_parent:
        ui_subtasks = [
            {
                "summary": "[Subtask] Build User Dashboard",
                "description": f"""# Task Information
- **Started**: {start_time}
- **Status**: To Do
- **Description**: Create user dashboard interface.

## Technical Requirements
1. Dashboard Features
   - Profile summary
   - Recent activity
   - Quick actions
   - Notifications

2. Components
   - Activity feed
   - Stats widgets
   - Action buttons
   - Settings access

## Acceptance Criteria
- [ ] Dashboard loads
- [ ] Data is current
- [ ] Actions work
- [ ] UI is responsive"""
            },
            {
                "summary": "[Subtask] Implement Profile Management",
                "description": f"""# Task Information
- **Started**: {start_time}
- **Status**: To Do
- **Description**: Create profile management interface.

## Technical Requirements
1. Profile Features
   - Edit personal info
   - Privacy controls
   - Notification settings
   - Account options

2. Components
   - Edit forms
   - Image upload
   - Settings panels
   - Validation

## Acceptance Criteria
- [ ] Profile edits work
- [ ] Settings are saved
- [ ] Validation works
- [ ] UI is intuitive"""
            },
            {
                "summary": "[Subtask] Create Admin Control Panel",
                "description": f"""# Task Information
- **Started**: {start_time}
- **Status**: To Do
- **Description**: Build admin control panel interface.

## Technical Requirements
1. Panel Features
   - User management
   - System settings
   - Reports
   - Maintenance

2. Components
   - Data tables
   - Bulk actions
   - Search/filter
   - Export tools

## Acceptance Criteria
- [ ] Panel functions
- [ ] Actions work
- [ ] Data is accurate
- [ ] UI is efficient"""
            }
        ]
        
        for subtask in ui_subtasks:
            result = jira.create_task(
                summary=subtask['summary'],
                description=subtask['description'],
                issue_type='Sub-task',
                parent_key=ui_parent
            )
            if result:
                logger.info(f"Created UI subtask: {result['key']}")
            else:
                logger.error(f"Failed to create subtask: {subtask['summary']}")

if __name__ == '__main__':
    create_auth_ui_tasks()
