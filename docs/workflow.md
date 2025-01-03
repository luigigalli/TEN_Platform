# Development Workflow

## Overview
This document outlines the development workflow and best practices for the TEN project.

## Development Environments

### Local Development (Windsurf)
1. Clone repository
2. Install dependencies
3. Set up local PostgreSQL
4. Configure environment variables
5. Start development server

### Cloud Development (Replit)
1. Fork Replit project
2. Environment auto-configures
3. Database provisioned automatically
4. Start development server

## Version Control

### Branch Strategy
- `main`: Production-ready code
- `develop`: Integration branch
- Feature branches: `feature/[feature-name]`
- Hotfix branches: `hotfix/[fix-name]`

### Commit Guidelines
- Use descriptive commit messages
- Reference issue numbers
- Keep commits focused and atomic

## Development Process

### Feature Development
1. Create feature branch
2. Develop and test locally
3. Sync database if needed
4. Submit pull request
5. Code review
6. Merge to develop

### Database Changes
1. Update schema in `db/schema.ts`
2. Test locally
3. Sync across environments
4. Document changes

### Testing
- Write unit tests
- Test in both environments
- Verify cross-environment compatibility

## Deployment
1. Merge to main
2. Run build process
3. Deploy to production
4. Verify deployment

## Documentation
- Update API documentation
- Document schema changes
- Keep README.md current
- Document environment-specific details
