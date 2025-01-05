# Branch Strategy Documentation

## Core Branches
- `main`: Production-ready code
- `develop`: Integration branch for feature development

## Development Workflow

### Issue-Based Development
Development work is tracked through GitHub Issues following standardized naming conventions (see [GitHub Issues Guide](./github-issue-guide.md) for details).

### Branch Rules
1. New Development Work:
   - Create GitHub issue following naming conventions
   - Create temporary branch from `develop`
   - Branch naming: `issue-[NUMBER]-brief-description`
   - Example: `issue-123-trip-sharing`
   - Merge back to `develop` when complete
   - Delete branch after successful merge

2. Production Fixes:
   - Create GitHub issue with [Bug] type and appropriate priority
   - Create temporary branch from `main`
   - Branch naming: `hotfix-[NUMBER]-brief-description`
   - Example: `hotfix-456-auth-session`
   - Merge to both `main` and `develop`
   - Delete branch after successful merge

### Environment-Specific Git Strategies
- Replit: Use rebase strategy
- Windsurf: Use fast-forward only

## Branch Protection Rules
1. Main Branch (`main`)
   - Requires pull request review
   - Must be up-to-date before merging
   - Status checks must pass
   - Linear history enforced

2. Development Branch (`develop`)
   - Requires pull request review
   - Must be up-to-date before merging
   - Status checks must pass

## Development Process
1. Issue Creation
   - Follow standardized naming conventions
   - Use appropriate issue template
   - Include all required information
   - Set correct priority level

2. Development
   - Create temporary branch
   - Reference issue in commits
   - Keep changes focused
   - Update documentation

3. Review Process
   - Create detailed pull request
   - Reference issue number
   - Include testing evidence
   - Document environment considerations

4. Completion
   - Merge using appropriate strategy
   - Delete temporary branch
   - Close associated issue
   - Update related documentation

## Best Practices
1. Keep branches short-lived and temporary
2. Always create GitHub issue before branching
3. Reference issue numbers in commits and PRs
4. Keep changes focused and atomic
5. Test in both environments before merging
6. Delete branches promptly after merging
7. Maintain clean commit history

## Cross-Environment Considerations
1. Document environment impact in issue
2. Test in both environments
3. Verify sync operations
4. Update environment validation
5. Note configuration changes