# Example GitHub Issues for TEN Platform

## Issue Example 1: New Feature
```
Title: [Feature][Trip] Implement multi-user trip itinerary sharing (#P1)

Description:
Add capability for users to share and collaborate on trip itineraries in real-time.

Technical Components:
- User interface components (React/TypeScript)
- WebSocket integration for real-time updates
- Database schema updates for shared itineraries
- Cross-environment sync handling

Environment Considerations:
- Replit: WebSocket configuration
- Windsurf: Local development setup
- Database sync requirements between environments

Acceptance Criteria:
- Multiple users can view/edit same itinerary
- Real-time updates visible to all participants
- Changes sync correctly across environments
- Proper error handling for offline scenarios
```

## Issue Example 2: Bug Fix
```
Title: [Bug][Auth] Session persistence fails in Replit environment (#P0)

Description:
User sessions are not persisting correctly in the Replit environment, causing unexpected logouts.

Technical Analysis:
- Session configuration differs between environments
- Cookie settings may need environment-specific adjustments
- Database connection pool might be dropping

Environment Impact:
- Replit: Primary issue location
- Windsurf: Working correctly (reference for comparison)
- Database: Session table needs investigation

Steps to Reproduce:
1. Log in to application
2. Wait 5 minutes
3. Attempt any authenticated action
4. Session is lost unexpectedly

Acceptance Criteria:
- Sessions persist for expected duration
- No unexpected logouts
- Consistent behavior across environments
```

## Issue Example 3: Enhancement
```
Title: [Enhancement][DB] Optimize trip search query performance (#P2)

Description:
Current trip search operations are showing high latency (>500ms) under load.

Technical Approach:
- Add database indexes for frequently searched fields
- Implement query caching strategy
- Optimize JOIN operations in search queries

Environment Considerations:
- Both environments affected
- Need to verify index performance impact
- Cache strategy must work cross-environment

Performance Targets:
- Search response time < 200ms
- Query execution plan optimization
- Reduced database load

Acceptance Criteria:
- Performance improvement verified in both environments
- No regression in other database operations
- Monitoring shows sustained improvement
```

## Issue Example 4: Environment Configuration
```
Title: [Environment][Config] Implement automated environment detection and setup (#P1)

Description:
Streamline environment configuration process with automated detection and setup.

Technical Components:
- Environment detection logic
- Configuration validation system
- Cross-environment synchronization
- Error handling and reporting

Implementation Details:
- Add environment detection module
- Implement configuration validators
- Add synchronization checks
- Create comprehensive error messages

Acceptance Criteria:
- Automatic environment detection works
- Correct configuration loaded per environment
- Validation prevents misconfigurations
- Clear error messages for issues
```

## Priority Levels Reference:
- P0: Critical (Production blocking, security issues)
- P1: High (Major features, important fixes)
- P2: Medium (Enhancements, non-critical bugs)
- P3: Low (Minor improvements, documentation)

## Component Tags Reference:
- [Trip]: Trip planning and management
- [Auth]: Authentication/authorization
- [DB]: Database operations
- [UI]: User interface
- [API]: API endpoints/services
- [Config]: Configuration/environment
- [Sync]: Synchronization operations
- [Security]: Security-related changes
