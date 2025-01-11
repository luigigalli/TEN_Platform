# TEN Platform Workflow Documentation

## Critical Information Persistence

### API Credentials
- Jira API Configuration:
  - URL: https://the-experiences-network.atlassian.net
  - Email: luigi@experiencesnetwork.com
  - API Token: Stored in .env.local

### Secure Credential Management
1. API tokens and sensitive credentials are stored in .env.local
2. .env.local is added to .gitignore
3. Credentials are loaded from environment variables at runtime
4. Never commit credentials directly to documentation or source code

### Task Workflow Rules
1. Sprint Planning and Task Status Management
   - All sprint planning must be done collaboratively with USER
   - Tasks must be explicitly moved to SELECTED FOR DEVELOPMENT together

2. Parent Tasks and Subtasks Workflow
   A. Initial Status Changes (Required for ALL tasks):
      - ALL subtasks must be moved from BACKLOG to SELECTED FOR DEVELOPMENT together
      - Then ALL subtasks must be moved to IN PROGRESS together
      - Parent task follows its subtasks in these transitions
   
   B. Development and Review Process:
      - Development is performed on subtasks first
      - Each subtask can be moved to TESTING/REVIEW independently upon completion
      - No additional processes required for subtask review transitions unless development changes are needed
      
   C. Parent Task Review:
      - Parent task can ONLY move to TESTING/REVIEW when ALL subtasks are in TESTING/REVIEW or complete
      - Full review processes are performed at parent task level
      - Parent task review considers the complete feature set across all subtasks

3. Task Status Transitions
   - IN PROGRESS → TESTING/REVIEW: 
     * For subtasks: Can be done independently upon completion
     * For parent tasks: Only when all subtasks are in TESTING/REVIEW
   - TESTING/REVIEW → DONE: Requires explicit USER approval

4. Repository Operations
   - All git push/pull operations require USER approval
   - Branch creation can be done autonomously
   - Merge operations require USER approval

5. Critical Operations Requiring Approval
   - Breaking changes to existing functionality
   - Security-related modifications
   - Database operations and migrations
   - Resource-intensive operations
   - Configuration changes
   - Major dependency version updates

6. Command Auto-execution
   - Safe operations can be executed automatically
   - Safety is determined by potential side effects
   - USER approval required for unsafe operations

### API Integration
1. Jira API Integration
   - Use Python with `jira` package for all Jira API interactions
   - Required packages: `jira-python`, `python-dotenv`
   - Authentication via API token stored in `.env.local`
   - Environment variables:
     * `JIRA_API_URL`: Jira instance URL
     * `JIRA_API_EMAIL`: User email
     * `JIRA_API_TOKEN`: API token from Jira

2. API Token Management
   - Generate token from Jira user settings
   - Store in `.env.local` (never commit to repository)
   - Token permissions must include:
     * Read issues
     * Write issues
     * Transition issues

### Task Logging
1. File Management
   - Name format: `task-log-TENP-<number>.md`
   - Created automatically when task moves to IN PROGRESS
   - Stored in project root directory
   - Updated after any event related to task or subtasks
   - Content copied to Jira when task moves to REVIEW

2. Content Requirements
   - Parent task details and status
   - Subtasks status and progress
   - Development progress and metrics
   - Dependencies and configurations
   - Environment variables
   - API credentials references
   - Technical decisions and rationale
   - Work completed and remaining items

3. Update Triggers
   - Task status changes
   - Subtask status changes
   - Code changes and commits
   - Test results and coverage updates
   - Technical decisions
   - Configuration changes
   - Dependencies updates

4. Review Process
   - Task log must be complete before moving to REVIEW
   - All technical decisions must be documented
   - Current status of all subtasks must be accurate
   - Log content is copied to Jira task description
   - Log file remains in repository for historical reference

### Context Preservation Requirements
1. All checkpoints must include:
   - API credentials and configurations
   - Current task context and status
   - Previous decisions and arrangements
   - Environment-specific settings
   - Model-based command execution preferences

2. Documentation Updates
   - Must be committed to version control
   - Should include rationale for changes
   - Must maintain consistent formatting
