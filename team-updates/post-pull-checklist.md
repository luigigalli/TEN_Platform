# Post-Pull Checklist

⚠️ **IMPORTANT**: Complete this checklist after every `git pull` to ensure you're up to date with all changes.

## 1. Check Team Updates
- [ ] Review `/team-updates/action-items.md` for any pending tasks
- [ ] Check `/team-updates/credentials.md` for credential changes
- [ ] Read latest entries in `/team-updates/breaking-changes.md`

## 2. Environment Configuration
- [ ] Compare your `.env` with `.env.example` for new variables
- [ ] Verify all environment-specific configurations
- [ ] Check database connection strings are current
- [ ] Confirm API keys and external service configurations

## 3. Dependencies
- [ ] Run `npm install` for new dependencies
- [ ] Check `package.json` for version updates
- [ ] Review any new dev dependencies

## 4. Database Changes
- [ ] Check for schema changes
- [ ] Run any pending migrations
- [ ] Verify database sync status between environments

## 5. Documentation Updates
- [ ] Review changes in `/docs` for API updates
- [ ] Check for new environment requirements
- [ ] Note any changes in deployment procedures

## Quick Commands

```bash
# Update dependencies
npm install

# Check database status
npm run db:status

# Verify environment
npm run verify-env

# Run migrations
npm run migrate

# Sync database (if needed)
npm run sync:windsurf  # or sync:replit
```

## Common Issues & Solutions

### Missing Environment Variables
```bash
# Compare with example
diff .env.example .env
```

### Database Sync Issues
1. Check credentials in `.env`
2. Verify database connection
3. See `/team-updates/credentials.md` for latest updates

### New Dependencies Not Working
```bash
# Clean install
rm -rf node_modules
npm install
```

## Important Notes

1. **Never Skip This Checklist**: Missing updates can cause environment inconsistencies
2. **Report Issues**: If you encounter problems, document them in `/team-updates/known-issues.md`
3. **Update the Team**: If you make changes that others should know about, add them to the appropriate files in `/team-updates`

## Automation Script

```bash
#!/bin/bash
# post-pull.sh - Automates post-pull checks

echo "🔍 Running post-pull checks..."

# Check for new dependencies
echo "📦 Checking dependencies..."
npm install

# Verify environment
echo "🌍 Verifying environment..."
npm run verify-env

# Check database status
echo "🗄️ Checking database status..."
npm run db:status

# Display recent updates
echo "📢 Recent team updates:"
tail -n 10 team-updates/action-items.md

echo "✅ Post-pull checks completed"
```

## Adding to Git Hooks (Optional)

Add this to `.git/hooks/post-merge`:
```bash
#!/bin/bash
echo "🔔 Don't forget to check team-updates/*"
echo "Run './scripts/post-pull.sh' for automated checks"
```
