# Git Branch Structure and Workflow

## Branch Organization

### Main Branches
- `main`: Production-ready code, used for storing the code in production stage
- `develop`: Development stage code, base for feature development

### Branch Protection Rules
- Both `main` and `develop` branches are protected
- Requires at least 1 reviewer for pull requests
- Required status checks must pass before merging
- `main` branch requires signed commits

## Development Workflow

### Starting New Development
1. All development starts from `develop` branch (except hotfixes)
2. For each issue:
   - Create new branch from `develop`
   - Name format: `feat/issue-description` or `fix/issue-description`
   - Register issue request in Git

### Development Process
1. Make changes in feature branch
2. Commit regularly with descriptive messages
3. Keep branch up to date with `develop`
4. Push changes to remote for review

### Review and Merge Process
1. Create pull request to merge into `develop`
2. Ensure all status checks pass
3. Get required reviews
4. After successful merge, delete feature branch

### Production Release
- When `develop` accumulates enough changes for a new version:
  1. Create release branch from `develop`
  2. Perform final testing
  3. Merge into `main` using fast-forward only
  4. Tag release with version number

### Hotfix Process
- For critical production issues:
  1. Branch from `main`
  2. Fix issue
  3. Merge to both `main` and `develop`

## Branch Configuration
- `main`: Fast-forward only merges
- `develop`: No fast-forward merges to preserve feature history
- Feature branches: Regular merges

## Commands Quick Reference

### Start New Feature
```bash
git checkout develop
git pull
git checkout -b feat/your-feature-name
```

### Update Feature Branch
```bash
git checkout develop
git pull
git checkout feat/your-feature-name
git rebase develop
```

### Prepare for Production
```bash
git checkout develop
git pull
git checkout main
git merge develop --ff-only
git tag v1.x.x
git push origin v1.x.x
```
