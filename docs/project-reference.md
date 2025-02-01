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
