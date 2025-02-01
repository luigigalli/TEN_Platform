#!/usr/bin/env python3
import os
import sys
from task_workflow import JiraAPI, PROJECT_KEY
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def update_migration_tasks():
    jira = JiraAPI(
        os.getenv('JIRA_EMAIL'),
        os.getenv('JIRA_API_TOKEN'),
        os.getenv('JIRA_BASE_URL')
    )
    
    start_time = datetime.now().strftime('%Y-%m-%d %H:%M')
    
    # 1. Authentication System Migration (TENP-21)
    auth_subtasks = [
        {
            "summary": "[Migration] Implement User Model Migration",
            "description": f"""# Task Information
- **Started**: {start_time}
- **Status**: To Do
- **Description**: Migrate and enhance user model from TEN1 to TEN2.

## Technical Requirements
1. Core User Model
   - Migrate existing fields (prefix, name parts, email, etc.)
   - Add new fields (emailVerified, twoFactorEnabled)
   - Implement TypeORM schema
   - Setup data validation

2. Related Models
   - Address model
   - Location model
   - User skills model
   - Accounting data

## Migration Notes
### TEN1 Structure:
```typescript
interface User {{
  prefix: string;
  customer_id: string;
  fname: string;
  mname: string;
  lname: string;
  email: string;
  password: string;
  group_id: number;
  bday: Date;
  type: number;
  role: string;
  active: number;
}}
```

### TEN2 Structure:
```typescript
interface TEN2User {{
  id: string;
  fullName: {{
    prefix?: string;
    first: string;
    middle?: string;
    last: string;
  }};
  email: string;
  role: 'user' | 'provider' | 'admin';
  status: 'active' | 'pending' | 'inactive';
  emailVerified: boolean;
  twoFactorEnabled: boolean;
}}
```

## Acceptance Criteria
- [ ] All user data fields are migrated
- [ ] New fields are properly implemented
- [ ] Data validation is in place
- [ ] Migration script is tested
- [ ] Rollback procedure exists"""
        },
        {
            "summary": "[Migration] Setup Authentication Flow",
            "description": f"""# Task Information
- **Started**: {start_time}
- **Status**: To Do
- **Description**: Implement enhanced authentication flow based on TEN1.

## Technical Requirements
1. Registration Process
   - Email uniqueness check
   - Enhanced validation
   - Secure password hashing
   - Welcome email system
   - Verification flow

2. Login System
   - Email/password auth
   - Two-factor support
   - Session management
   - Remember-me feature

## Migration Notes
### TEN1 Flow:
1. Basic email/password
2. Role-based access
3. Session cookies

### TEN2 Enhancements:
```typescript
interface AuthFlow {{
  register: {{
    validateEmail: boolean;
    createUser: boolean;
    sendVerification: boolean;
    setupProfile: boolean;
  }};
  login: {{
    credentials: boolean;
    twoFactor?: boolean;
    rememberMe?: boolean;
  }};
}}
```

## Acceptance Criteria
- [ ] Registration works end-to-end
- [ ] Login system is secure
- [ ] Sessions are managed properly
- [ ] 2FA is implemented
- [ ] Email verification works"""
        }
    ]
    
    # Create auth subtasks
    for subtask in auth_subtasks:
        result = jira.create_task(
            summary=subtask['summary'],
            description=subtask['description'],
            issue_type='Sub-task',
            parent_key='TENP-21'
        )
        if result:
            logger.info(f"Created auth subtask: {result['key']}")
        else:
            logger.error(f"Failed to create subtask: {subtask['summary']}")
    
    # 2. Role-Based Access Migration (TENP-23)
    rbac_subtasks = [
        {
            "summary": "[Migration] Implement Permission System",
            "description": f"""# Task Information
- **Started**: {start_time}
- **Status**: To Do
- **Description**: Migrate and enhance permission system from TEN1.

## Technical Requirements
1. User Groups
   - Migrate existing groups
   - Enhance group structure
   - Add permission sets
   - Setup inheritance

2. Permissions
   - Define permission types
   - Create validation rules
   - Setup access control
   - Add audit logging

## Migration Notes
### TEN1 Structure:
- User types (3 = end user)
- Group-based providers
- Admin role flag

### TEN2 Enhancement:
```typescript
interface UserGroup {{
  name: string;
  code: string;
  type: string;
  permissions: string[];
}}
```

## Acceptance Criteria
- [ ] Groups are migrated
- [ ] Permissions are defined
- [ ] Access control works
- [ ] Audit system exists"""
        }
    ]
    
    # Create RBAC subtasks
    for subtask in rbac_subtasks:
        result = jira.create_task(
            summary=subtask['summary'],
            description=subtask['description'],
            issue_type='Sub-task',
            parent_key='TENP-23'
        )
        if result:
            logger.info(f"Created RBAC subtask: {result['key']}")
        else:
            logger.error(f"Failed to create subtask: {subtask['summary']}")

if __name__ == '__main__':
    update_migration_tasks()
