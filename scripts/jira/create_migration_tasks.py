#!/usr/bin/env python3
import os
import sys
from task_workflow import JiraAPI, PROJECT_KEY
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_migration_tasks():
    jira = JiraAPI(
        os.getenv('JIRA_EMAIL'),
        os.getenv('JIRA_API_TOKEN'),
        os.getenv('JIRA_BASE_URL')
    )
    
    # Create main migration task
    migration_task = jira.create_task(
        summary="[Platform Migration] Implement TEN1 to TEN2 Migration Framework",
        description=f"""# Task Information
- **Started**: {datetime.now().strftime('%Y-%m-%d %H:%M')}
- **Status**: To Do
- **Description**: Implement the migration framework for transitioning from TEN1 to TEN2 platform.

## Task Structure
This is a parent task that will track the overall migration process.

### Technical Requirements
1. Database Migration
   - Schema migration patterns
   - Data integrity verification
   - Rollback procedures

2. API Migration
   - Endpoint mapping
   - TypeScript conversion
   - Request/response validation

3. Frontend Migration
   - Component conversion
   - State management
   - Design system implementation

4. Authentication
   - JWT implementation
   - Role-based access
   - Security enhancements

5. Testing
   - Unit test migration
   - E2E test setup
   - Integration tests

6. Documentation
   - API documentation
   - Component documentation
   - Architecture guides

## Acceptance Criteria
- [ ] All TEN1 features are successfully migrated
- [ ] Data integrity is maintained
- [ ] Performance metrics meet or exceed TEN1
- [ ] Test coverage is maintained or improved
- [ ] Documentation is complete and accurate

## Dependencies
Required:
- TypeScript 5.0+
- Node.js 18+
- React 18+
- PostgreSQL 15+

## Environment Setup
- Database migration tools
- TypeScript conversion utilities
- Testing frameworks
- Documentation generators""",
        issue_type='Task'
    )
    
    if not migration_task:
        logger.error("Failed to create migration task")
        return
    
    migration_key = migration_task['key']
    logger.info(f"Created migration task: {migration_key}")
    
    # Create subtasks
    subtasks = [
        {
            "summary": f"[Platform Migration] Setup Database Migration Framework",
            "description": f"""# Task Information
- **Started**: {datetime.now().strftime('%Y-%m-%d %H:%M')}
- **Status**: To Do
- **Description**: Implement database migration framework for TEN1 to TEN2 transition.

## Parent Task
- {migration_key}: TEN1 to TEN2 Migration Framework

## Technical Requirements
1. Schema Migration
   - Create schema comparison tools
   - Implement validation checks
   - Setup migration scripts
   - Configure rollback mechanisms

2. Data Migration
   - Setup data transfer utilities
   - Implement integrity checks
   - Create validation suite
   - Add performance monitoring

## Acceptance Criteria
- [ ] Schema migration is automated
- [ ] Data integrity is verified
- [ ] Rollback procedures work
- [ ] Performance impact is acceptable

## Dependencies
Required:
- PostgreSQL migration tools
- Data validation framework
- Performance monitoring tools"""
        },
        {
            "summary": f"[Platform Migration] Implement API Migration Layer",
            "description": f"""# Task Information
- **Started**: {datetime.now().strftime('%Y-%m-%d %H:%M')}
- **Status**: To Do
- **Description**: Create API migration layer for transitioning TEN1 endpoints to TEN2.

## Parent Task
- {migration_key}: TEN1 to TEN2 Migration Framework

## Technical Requirements
1. Endpoint Migration
   - Map existing patterns
   - Create TypeScript types
   - Setup validation rules
   - Implement error handling

2. Documentation
   - Generate API docs
   - Create usage guides
   - Document changes
   - Setup auto-generation

## Acceptance Criteria
- [ ] All endpoints are migrated
- [ ] TypeScript types are complete
- [ ] Documentation is generated
- [ ] Tests pass

## Dependencies
Required:
- TypeScript compiler
- API documentation tools
- Testing framework"""
        },
        {
            "summary": f"[Platform Migration] Setup Frontend Migration Pipeline",
            "description": f"""# Task Information
- **Started**: {datetime.now().strftime('%Y-%m-%d %H:%M')}
- **Status**: To Do
- **Description**: Establish frontend migration pipeline for TEN1 components.

## Parent Task
- {migration_key}: TEN1 to TEN2 Migration Framework

## Technical Requirements
1. Component Migration
   - Audit existing components
   - Convert to TypeScript
   - Implement new design system
   - Setup testing framework

2. State Management
   - Migrate Redux store
   - Update selectors
   - Convert actions/reducers
   - Add type safety

## Acceptance Criteria
- [ ] Components are migrated
- [ ] Tests are passing
- [ ] Design system is implemented
- [ ] State management works

## Dependencies
Required:
- React 18+
- TypeScript 5.0+
- Testing libraries
- Design system tools"""
        },
        {
            "summary": f"[Platform Migration] Implement Auth Migration System",
            "description": f"""# Task Information
- **Started**: {datetime.now().strftime('%Y-%m-%d %H:%M')}
- **Status**: To Do
- **Description**: Create authentication migration system from TEN1 to TEN2.

## Parent Task
- {migration_key}: TEN1 to TEN2 Migration Framework

## Technical Requirements
1. Authentication
   - Setup JWT system
   - Implement refresh tokens
   - Add security headers
   - Create auth middleware

2. Authorization
   - Migrate user roles
   - Setup permissions
   - Add role validation
   - Implement access control

## Acceptance Criteria
- [ ] Auth system is migrated
- [ ] Roles are preserved
- [ ] Security is enhanced
- [ ] Tests pass

## Dependencies
Required:
- JWT library
- Security tools
- Testing framework"""
        },
        {
            "summary": f"[Platform Migration] Setup Testing Migration Framework",
            "description": f"""# Task Information
- **Started**: {datetime.now().strftime('%Y-%m-%d %H:%M')}
- **Status**: To Do
- **Description**: Implement testing migration framework for TEN1 test suite.

## Parent Task
- {migration_key}: TEN1 to TEN2 Migration Framework

## Technical Requirements
1. Unit Tests
   - Setup Jest
   - Configure RTL
   - Migrate test utils
   - Add type safety

2. E2E Tests
   - Setup Playwright
   - Create test fixtures
   - Implement CI pipeline
   - Add reporting

## Acceptance Criteria
- [ ] All tests are migrated
- [ ] Coverage is maintained
- [ ] CI pipeline works
- [ ] Reports are generated

## Dependencies
Required:
- Jest
- React Testing Library
- Playwright
- CI tools"""
        },
        {
            "summary": f"[Platform Migration] Create Documentation Migration System",
            "description": f"""# Task Information
- **Started**: {datetime.now().strftime('%Y-%m-%d %H:%M')}
- **Status**: To Do
- **Description**: Setup documentation migration system for TEN1 to TEN2.

## Parent Task
- {migration_key}: TEN1 to TEN2 Migration Framework

## Technical Requirements
1. API Documentation
   - Setup OpenAPI/Swagger
   - Create type generation
   - Add validation
   - Implement auto-generation

2. Component Documentation
   - Setup Storybook
   - Add prop types
   - Create examples
   - Generate docs

## Acceptance Criteria
- [ ] Docs are migrated
- [ ] Auto-generation works
- [ ] Examples are updated
- [ ] Navigation works

## Dependencies
Required:
- Documentation tools
- Type generators
- Validation utilities"""
        }
    ]
    
    for subtask in subtasks:
        result = jira.create_task(
            summary=subtask['summary'],
            description=subtask['description'],
            issue_type='Sub-task',
            parent_key=migration_key
        )
        if result:
            logger.info(f"Created subtask: {result['key']}")
        else:
            logger.error(f"Failed to create subtask: {subtask['summary']}")

if __name__ == '__main__':
    create_migration_tasks()
