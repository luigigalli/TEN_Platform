# Branch Strategy Documentation

## Core Branches
- `main`: Production-ready code
  - Protected branch
  - Requires pull request review
  - Linear history enforced (fast-forward only)
  - Status checks must pass
- `develop`: Integration branch for feature development
  - Protected branch
  - Requires pull request review
  - Status checks must pass

## Development Process

### Issue-Based Development
1. Create GitHub Issue
   - Follow standardized naming conventions
   - Use appropriate issue template
   - Include environment considerations
   - Set correct priority level (#P0-#P3)

2. Branch Creation
   - Create from `develop` branch
   - Use standardized naming:
     - Features: `feat/description`
     - Fixes: `fix/description`
     - Documentation: `docs/description`
     - Issues: `issue-XXX-description`
     - Hotfixes: `hotfix-XXX-description`

3. Development Work
   - Keep changes focused and atomic
   - Follow commit message template
   - Reference issue numbers in commits
   - Test in both environments

4. Review Process
   - Create detailed pull request
   - Reference issue number
   - Include testing evidence
   - Document environment considerations

5. Integration
   - Merge using environment-specific strategy
   - Delete temporary branch after merge
   - Close associated issue
   - Update documentation

### Environment-Specific Git Strategies
- Replit Environment:
  - Use rebase strategy
  - Command: `git pull --rebase origin develop`
  - Purpose: Maintain clean linear history

- Windsurf Environment:
  - Use fast-forward only
  - Command: `git pull --ff-only origin develop`
  - Purpose: Ensure consistent history

### Protected Branch Rules
1. Main Branch (`main`)
   - No direct commits
   - Pull request required
   - Linear history enforced
   - Required status checks
   - Signed commits required

2. Development Branch (`develop`)
   - No direct commits
   - Pull request required
   - Status checks must pass

## Best Practices
1. Keep branches short-lived
2. Always create GitHub issue first
3. Reference issue numbers in commits
4. Keep changes focused
5. Test in both environments
6. Delete branches after merging
7. Maintain clean commit history

## Validation Process
1. Pre-commit checks
   - Branch naming convention
   - Protected branch rules
   - Commit message format
   - Reference issue numbers

2. Pre-merge checks
   - Status checks passing
   - Review requirements met
   - Environment validation
   - Documentation updates

3. Post-merge cleanup
   - Branch deletion
   - Issue closure
   - Documentation updates
   - Cross-environment sync

## Cross-Environment Considerations
1. Document environment impact
2. Test in both environments
3. Verify sync operations
4. Update environment validation
5. Note configuration changes

## Recovery Procedures
1. Branch conflicts
   - Rebase feature branch
   - Resolve conflicts locally
   - Push changes
   - Update pull request

2. Protected branch violations
   - Create proper branch
   - Cherry-pick changes
   - Submit pull request
   - Delete invalid branch