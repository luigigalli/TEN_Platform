# TEN Platform Project Reference Guide

## Quick Start
1. Set up Jira access:
   ```bash
   source scripts/jira/set_jira_env.sh
   ```
2. Create a work log for your task:
   ```bash
   cp docs/templates/work-log-template.md task_work_logs/TENP-[number]_work_log.md
   ```
3. Create your local branch:
   ```bash
   git checkout -b TENP-[number]-description develop
   ```

## Project Management

### Jira
- **Access**:
  - URL: https://ten-platform.atlassian.net
  - Login via Google Workspace (ten.platform@gmail.com)
  - First time setup: Request access from team lead
  
- **Credentials Setup**:
  1. Visit https://id.atlassian.com/manage-profile/security/api-tokens
  2. Create an API token
  3. Add to your environment:
     ```bash
     export JIRA_EMAIL="your.email@ten-platform.com"
     export JIRA_API_TOKEN="your-api-token"
     ```
  4. Or use the setup script: `source scripts/jira/set_jira_env.sh`

- **Project Navigation**:
  - Project Key: TENP
  - Boards: https://ten-platform.atlassian.net/jira/software/projects/TENP/boards
  - Backlog: https://ten-platform.atlassian.net/jira/software/projects/TENP/backlog
  - Active Sprints: https://ten-platform.atlassian.net/jira/software/projects/TENP/boards/active-sprints

- **Task Management**:
  - View Tasks: https://ten-platform.atlassian.net/browse/TENP
  - Create Task: https://ten-platform.atlassian.net/secure/CreateIssue!default.jspa
  - Task Templates available in Jira's create dialog

## Automated Workflows

### Current Automations
1. **Local Development**:
   - `scripts/create-task-branch.sh` - Creates branch and work log for new task
   - `scripts/sync-to-github.sh` - Syncs local changes with GitHub
   - `scripts/finish-task.sh` - Merges task branch and updates work log

2. **Testing**:
   - Pre-commit hooks for code formatting and linting
   - Automated test running on file changes
   - Coverage reports generation

3. **Documentation**:
   - Work log templates
   - API documentation generation
   - Changelog updates

### Future Automation Plans
1. **Task Management**:
   - Automatic work log creation from template
   - Branch creation with correct naming
   - Jira status updates from git actions

2. **Development Flow**:
   - Automated dependency checks
   - Code quality metrics
   - Performance benchmarking

3. **Integration**:
   - Automated merge preparation
   - Test coverage verification
   - Documentation updates

## Repository Structure

### Key Directories
- `/server` - Backend implementation
  - `/server/config` - Configuration files
  - `/server/middleware` - Express middleware
  - `/server/utils` - Utility functions
  - `/server/routes` - API routes
- `/client` - Frontend implementation
- `/docs` - Project documentation
  - `/docs/process` - Process documentation
  - `/docs/guides` - Development guides
  - `/docs/templates` - Templates for documentation
- `/scripts` - Utility scripts
- `/tests` - Test files
- `/task_work_logs` - Task implementation logs

### Important Files
- `package.json` - Project dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `tsconfig.test.json` - Test-specific TypeScript configuration
- `.mocharc.json` - Mocha test configuration
- `drizzle.config.ts` - Database configuration

## Development Environment

### Required Environment Variables
- `NODE_ENV` - Environment mode (development/production/test)
- `JIRA_EMAIL` - Jira account email
- `JIRA_API_TOKEN` - Jira API token
- [List other required env variables]

### Development Tools
- **Database**: DrizzleORM
- **Testing**: Mocha/Chai
- **API Documentation**: OpenAPI
- **Logging**: Winston

## Project Preferences and Standards

### Development Standards
- **Coding Style**: [Describe coding style preferences]
- **Git Workflow**:
  - Branch naming: `TENP-{issue-number}_{brief-description}`
  - Commit messages: Start with ticket number, e.g., "TENP-123: Add feature X"
  - PR requirements: Tests, documentation, migration scripts if needed
- **Testing Requirements**:
  - Unit test coverage minimum: [Specify percentage]
  - Integration test requirements
  - Test naming conventions

### Technical Decisions
- **Architecture Decisions**:
  - Record of major technical choices
  - Rationale for each decision
  - Alternatives considered
- **Technology Stack**:
  - Version requirements
  - Compatibility constraints
  - Third-party integrations

### Current Development Focus
- **Active Areas**:
  - List of current focus areas
  - Known technical debt items
  - Planned refactoring work
- **Work in Progress**:
  - Major features under development
  - Cross-cutting concerns
  - Integration points

### Environment Setup
- **Development Environment**:
  - Required tools and versions
  - Configuration preferences
  - Local setup requirements
- **Build Process**:
  - Build tool preferences
  - Optimization settings
  - Distribution requirements

### Documentation Standards
- **Code Documentation**:
  - Required sections in comments
  - API documentation format
  - Example requirements
- **Project Documentation**:
  - File organization
  - Update frequency
  - Required sections

## Task Management

### Task Documentation Template
```markdown
# Task: [TENP-XXX] Task Title

## Requirements
- Functional requirements
- Technical requirements
- Performance criteria
- Security considerations

## Implementation Notes
- Technical approach
- Key decisions
- Dependencies

## Testing Requirements
- Test scenarios
- Edge cases
- Performance benchmarks

## Documentation Updates
- API changes
- Configuration changes
- Migration steps
```

## Workflow

### Task Management
1. All tasks are tracked in Jira
2. Task naming convention: TENP-[number]
3. Work logs should be created in `/task_work_logs/TENP-[number]_work_log.md`

### Branch Strategy
1. **Local Development Only**
   - Feature branches are created and managed locally
   - No feature branches should be pushed to GitHub
   - Only the main development branch (`develop`) is pushed to GitHub
   - Use branch naming: `TENP-[number]-brief-description`

2. **Branch Workflow**
   - Create local branch from `develop`
   - Make changes and commit locally
   - Test thoroughly
   - Merge back to local `develop`
   - Push only `develop` to GitHub

3. **Sync Process**
   - Pull latest `develop` from GitHub
   - Create local feature branch
   - Work and test locally
   - Merge to local `develop`
   - Push `develop` to GitHub

### Development Process
1. Task Assignment
   - Tasks are assigned through Jira
   - Follow status workflow in `/docs/process/jira-workflow.md`

2. Development
   - Create work log file
   - Create local feature branch
   - Follow coding standards
   - Write tests
   - Update documentation

3. Testing
   - Run test suite: `npm test`
   - Ensure all tests pass
   - Add new tests as needed

4. Integration
   - Merge to local `develop`
   - Run full test suite
   - Push to GitHub if all tests pass

### Utility Scripts
- `scripts/sync-to-github.sh` - Sync between local and GitHub directories
- [List other important scripts]

## Context Management

### Context Categories
1. **Project-Level Context**
   - Architecture and design decisions
   - Coding standards and practices
   - Development workflow preferences
   - Documentation requirements

2. **Task-Level Context**
   - Current task requirements and constraints
   - Implementation decisions and rationale
   - Related tasks and dependencies
   - Testing and validation criteria

3. **Environment Context**
   - Development environment setup
   - Tool configurations and preferences
   - Build and deployment preferences
   - Integration settings

4. **Historical Context**
   - Previous technical decisions
   - Legacy considerations
   - Migration history
   - Known issues and workarounds

### Context Refresh Guidelines
1. **When to Refresh**
   - At the start of each conversation
   - After major project updates
   - When switching tasks
   - Before making significant decisions

2. **What Gets Refreshed**
   - Project documentation
   - Task work logs
   - Jira task status
   - Environment configurations

3. **How to Use Context**
   - Start new conversations with `refresh_context`
   - Update documentation for important decisions
   - Maintain task work logs
   - Record new preferences in appropriate sections

### Critical Files
The following files are monitored for changes and used to maintain project context:
- `project-reference.md` - Main project reference and documentation
- `WORK_LOG.md` - Daily work logs and progress
- `PROJECT_BRIEF.md` - Project overview and requirements
- `docs/workflow.md` - Development workflow documentation
- `docs/database.md` - Database schema and migrations
- `docs/environment-guide.md` - Environment setup guide
- `task_work_logs/*.md` - Individual task work logs

### Context Refresh System
The context refresh system ensures all team members (including AI assistants) have the latest project context.

#### Core Components
1. **refresh-context.ts**
   - Main context management logic
   - Monitors critical files for changes
   - Maintains context cache
   - Integrates with Jira sync

2. **Automatic Triggers**
   - Pre-hooks in package.json (predev, prebuild, etc.)
   - Git pre-commit hook
   - Cron job (every 5 minutes)

3. **Manual Refresh**
   ```bash
   # Refresh context manually
   refresh_context
   
   # Check last refresh time
   last_refresh
   ```

### Jira Integration

#### Core Components
1. **Base Utilities** (`scripts/jira/jira_utils.py`)
   - JIRA client initialization
   - Status transition handling
   - Error management
   - Shared utility functions

2. **Workflow Management** (`scripts/jira/workflow.py`)
   - Development program creation
   - Task organization
   - Program tracking
   - Menu-driven interface for:
     - Creating development programs
     - Managing task statuses
     - Updating work logs

3. **Task Operations** (`scripts/jira/task_workflow.py`)
   - Individual task management
   - Work log creation/updates
   - Status transitions
   - Task information retrieval

4. **TypeScript Bridge** (`scripts/jira/jira-sync.ts`)
   - Integrates Jira with TypeScript codebase
   - Caches task information
   - Provides task status for context system
   - Automatically detects current task from git branch

#### Workflow Integration
1. Context Refresh → Jira Sync
   - Each context refresh triggers Jira sync
   - Updates task status and work logs
   - Maintains task information cache

2. Development Flow
   ```bash
   # Start new task
   source scripts/jira/set_jira_env.sh  # Set up credentials
   python3 scripts/jira/workflow.py     # Select option 3 for task list
   
   # Update task status
   python3 scripts/jira/task_workflow.py TENP-123  # Replace with task ID
   ```

### Logs and Monitoring
- Context refresh logs: `logs/context-refresh.log`
- Last refresh time: `.last-refresh`
- Lock file (prevents parallel runs): `/tmp/refresh-context.lock`
- Jira task cache: `scripts/jira/.task-cache.json`

## Context Management System v2.1
The project uses a comprehensive context management system that integrates with Atlassian tools and maintains consistent task documentation.

### Key Components

1. **Context Refresh System**
   - Categorized context loading
   - Integrated Jira synchronization
   - Work log management
   - Template validation

2. **Atlassian Integration**
   - Direct Jira task synchronization
   - Work log tracking
   - Rich task metadata
   - Confluence integration

3. **Task Documentation**
   - Standardized work log templates
   - Automated validation
   - Version control
   - Backup system

### Task Work Logs

#### Template Structure
Work logs follow a standardized template that includes:
- Task information (status, priority, assignee, reporter)
- Work log entries (time tracking, comments)
- Implementation notes
- Testing documentation
- Review process
- Deployment information
- Atlassian integration details

#### Validation Rules
The system enforces the following requirements:
1. Required sections must be present
2. Work log entries must include time tracking
3. Task information must be complete
4. Proper formatting must be maintained

#### Converting Work Logs
To convert existing work logs to the new format:
```bash
tsx scripts/task-log-manager.ts
```
This will:
- Create a backup of existing logs
- Convert to the new format
- Validate the conversion
- Mark any issues for review

### Best Practices

1. **Task Management**
   - Always use the provided template for new tasks
   - Keep work logs up to date
   - Include time tracking information
   - Link related Confluence pages

2. **Context Maintenance**
   - Run context refresh regularly
   - Update task status in Jira
   - Maintain work log accuracy
   - Document technical decisions

3. **Documentation Standards**
   - Follow the template structure
   - Include all required sections
   - Provide detailed implementation notes
   - Keep deployment information current

## Version Control

### Version Numbering

We maintain two separate versioning schemes:

#### 1. App Version (TEN Platform)
Format: `MAJOR.MINOR.PATCH.BUILD`

1. **MAJOR** (0-99) - Breaking changes
   - Complete rewrites
   - Breaking API changes
   - Major architectural changes
   Example: `2.x.x.xx`

2. **MINOR** (0-99) - New features
   - New functionality
   - Backwards-compatible changes
   - Feature enhancements
   Example: `x.1.x.xx`

3. **PATCH** (0-99) - Bug fixes
   - Bug fixes
   - Minor improvements
   - Non-breaking changes
   Example: `x.x.4.xx`

4. **BUILD** (0-99) - Build number
   - Automated incremental number
   - Reset when PATCH increases
   Example: `x.x.x.23`

Examples:
- `2.0.4.23` = Major version 2, no new features, 4th patch, 23rd build
- `3.1.0.05` = Major version 3, 1st feature update, no patches, 5th build
- `1.3.2.15` = Version 1, 3rd feature set, 2nd patch, 15th build

#### 2. Management System Version (TEN Management)
Format: `YYYY.MM.SPRINT.REVISION`

1. **YYYY** - Year
   - Full year number
   Example: `2025.xx.x.x`

2. **MM** - Month (01-12)
   - Calendar month
   Example: `xxxx.01.x.x`

3. **SPRINT** - Sprint number (1-9)
   - Sprint within the month
   Example: `xxxx.xx.2.x`

4. **REVISION** - Revision (0-9)
   - Changes within sprint
   Example: `xxxx.xx.x.3`

Examples:
- `2025.01.2.3` = 2025, January, Sprint 2, Revision 3
- `2025.02.1.0` = 2025, February, Sprint 1, Initial version
- `2025.03.3.5` = 2025, March, Sprint 3, Revision 5

### Version Files
- App version: `version.json` in project root
- Management version: `management-version.json` in `/management` directory

Example version.json:
```json
{
  "version": "2.0.4.23",
  "lastUpdate": "2025-01-19",
  "compatibility": {
    "minManagementVersion": "2025.01.1.0"
  }
}
```

Example management-version.json:
```json
{
  "version": "2025.01.2.3",
  "lastUpdate": "2025-01-19",
  "compatibility": {
    "minAppVersion": "2.0.0.0",
    "maxAppVersion": "2.99.99.99"
  }
}
```

### Version Management

1. **App Release Process**
   - Version bump via `scripts/bump-app-version.sh`
   - Build number auto-increments
   - Creates release tag `app/v2.0.4.23`

2. **Management Release Process**
   - Version set via `scripts/set-management-version.sh`
   - Creates release tag `mgmt/v2025.01.2.3`

3. **Version Compatibility**
   - Each app version specifies minimum management version
   - Each management version specifies compatible app versions
   - Compatibility checked at startup

### Release Branches
- Named: `release/vX.Y.Z` for app releases, `mgmt/vYYYY.MM.SPRINT.REVISION` for management releases
- Created from: `develop`
- Merged to: `main` and back to `develop`
- Used for: Release preparation and last-minute fixes

### Version Tags
- Format: `vX.Y.Z` for app releases, `vYYYY.MM.SPRINT.REVISION` for management releases
- Created on: `main` branch
- Signed tags for security

### Changelog Management
- Automatically generated from commit messages
- Categorized by change type
- Links to Jira tickets
- Located in `CHANGELOG.md`

### Release Process

1. **Preparation**
   ```bash
   # Create release branch
   ./scripts/create-release.sh 1.2.0
   ```

2. **Validation**
   - Run full test suite
   - Update version numbers
   - Generate changelog
   - Update documentation

3. **Release**
   ```bash
   # Finalize release
   ./scripts/finish-release.sh
   ```

4. **Post-Release**
   - Tag is created
   - Changelog is updated
   - Version is bumped in develop

### Commit Message Format
Format: `type(scope): message [TENP-XXX]`

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `perf`: Performance
- `test`: Tests
- `chore`: Maintenance

Examples:
- `feat(api): add user authentication [TENP-123]`
- `fix(ui): resolve login button issue [TENP-456]`
- `docs(readme): update installation guide [TENP-789]`

## Documentation Updates
This reference guide should be updated whenever:
- New environment variables are added
- Directory structure changes
- New tools or processes are introduced
- Important scripts are added

## TODO
- [ ] Add complete list of required environment variables
- [ ] Add list of all utility scripts
- [ ] Add coding standards reference
- [ ] Add deployment process
- [ ] Add troubleshooting guide

## Related Documentation
- Environment Setup: `/docs/environment-guide.md`
- System Architecture: `/docs/system-architecture.md`
- Technical Implementation: `/docs/technical-implementation.md`
- Workflow Details: `/docs/workflow.md`

## Project Reference

### Version History

#### v1.2.0 (2025-01-21)
- Enhanced work log management system
  - Fixed section extraction and validation
  - Added backup functionality
  - Improved content formatting
- Improved context refresh system
  - Fixed duplicate cron entries
  - Added logging
  - Enhanced error handling

#### v1.1.0 (2025-01-20)
- Initial implementation of work log management
- Added context refresh system
- Implemented cron job for automatic updates

#### v1.0.0 (2025-01-19)
- Initial project setup
- Basic documentation structure
- Environment configuration

### Project Structure

#### Scripts
- `scripts/task-log-manager.ts`: Work log validation and maintenance
- `scripts/fix-work-logs.ts`: Work log format fixing
- `scripts/shell/refresh-cron.sh`: Context refresh cron script
- `scripts/shell/manage-conversation.sh`: Conversation management functions

#### Documentation
- `docs/context-management.md`: Context management system documentation
- `docs/workflow.md`: Development workflows
- `docs/database.md`: Database structure
- `docs/environment-guide.md`: Environment setup

#### Work Logs
- `task_work_logs/`: Directory containing all work log files
- `templates/task_work_log_template.md`: Template for new work logs

#### System Files
- `.windsurf/`: System directory
  - `logs/`: Log files
  - `current_conversation`: Active conversation marker
  - `backups/`: Backup directory for work logs

### Dependencies
- Node.js v18+
- TypeScript v5+
- cron (for automated tasks)
- fs-extra (for file operations)

### Configuration
- Cron job: Runs every 5 minutes
- Work log backup: Automatic before changes
- Context refresh: Automatic with logging

### Known Issues
- None currently

### Future Plans
- Custom work log templates
- Real-time context updates
- Performance metrics
- Enhanced error reporting
