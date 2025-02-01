# Context Management Process

## Critical Files Structure
The following files contain essential project context:

### Project Level (Priority 1)
- `project-reference.md`: Core project reference
- `PROJECT_BRIEF.md`: Project overview and decisions

### Documentation (Priority 2)
- `docs/workflow.md`: Development workflows
- `docs/database.md`: Database structure
- `docs/environment-guide.md`: Environment setup
- `docs/context-management-system.md`: Context management system documentation
- `docs/api-configuration.md`: API configuration documentation

### Work Tracking (Priority 3)
- `WORK_LOG.md`: Overall work progress
- `task_work_logs/*.md`: Individual task logs

### Templates (Priority 4)
- `templates/*.md`: Task and documentation templates

## Context Building Process

### 1. Initial Context Loading
When starting a new conversation:
1. Check `project-reference.md` and `PROJECT_BRIEF.md` for latest project state
2. Review recent entries in `WORK_LOG.md`
3. Check active task logs in `task_work_logs/`

### 2. Continuous Context Updates
During the conversation:
1. Track file changes through git history
2. Update work logs for active tasks
3. Reference documentation as needed

### 3. Context Verification
Before major decisions:
1. Verify current state in critical files
2. Cross-reference with Jira for latest task status
3. Check related documentation

## Best Practices

### File Access Pattern
1. Use `view_file` for reading specific sections
2. Use `find_by_name` for locating related files
3. Use `grep_search` for finding specific content
4. Use `codebase_search` for semantic code search

### Context Maintenance
1. Keep work logs updated
2. Document major decisions
3. Cross-reference related files
4. Maintain clear task boundaries

### Security Considerations
1. Never expose sensitive credentials in logs
2. Use environment variables for secrets
3. Verify access permissions before operations

## API Configuration
The context management system uses the following API configuration:

### Environment Variables
Copy `.env.example` to `.env` and configure the following variables:

```bash
# Windsurf API Configuration
WINDSURF_API_ENDPOINT=https://windsurf.codeium.com/api/v1
WINDSURF_API_KEY=your_api_key_here

# Jira Configuration (optional)
JIRA_HOST=your_jira_host
JIRA_TOKEN=your_jira_token
JIRA_USER=your_jira_username

# Project Configuration
PROJECT_ROOT=/path/to/your/project
```
