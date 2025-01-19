# TEN Platform Project Reference Guide

## Project Management

### Jira
- **URL**: https://ten-platform.atlassian.net
- **Credentials Location**: Environment variables required:
  - `JIRA_EMAIL`
  - `JIRA_API_TOKEN`
- **Project Key**: TENP
- **Setup Script**: `/scripts/jira/set_jira_env.sh`

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
