# Local Issue Branching System

## Branch Naming Convention
- `feat/issue-XXX-description`: For new features
- `fix/issue-XXX-description`: For bug fixes
- `docs/issue-XXX-description`: For documentation updates
- `refactor/issue-XXX-description`: For code refactoring
- `test/issue-XXX-description`: For test-related changes

## Workflow
1. Create a new directory for each issue
2. Name directory using the branch naming convention
3. Include the following files:
   - `description.md`: Task description and requirements
   - `work_log.md`: Daily progress and decisions
   - `changes.md`: List of changes made
   - `tests.md`: Test cases and results
4. Keep branches local only - do not push to Jira
5. Sync documentation with GitHub when ready