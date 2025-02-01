# Development Workflow Guide

## Overview
This guide outlines the development workflow process for the TEN platform, including task management, documentation requirements, and status transitions.

## Task States and Tracking
Each task's workflow is tracked in two files:

1. **Work Log** (`task_work_logs/TENP-XXX_work_log.md`)
   - Technical documentation
   - Implementation details
   - Testing notes
   - Dependencies

2. **Workflow Tracking** (`task_workflows/TSK_WFL_TENP-XXX.md`)
   - Status transition history
   - Timestamps for each state change
   - Reasons for transitions
   - Review decisions
   - Time spent in each state

## Task States
1. **To Do**
   - Initial state for all tasks
   - Tasks are waiting to be included in a development program

2. **Selected for Development**
   - Tasks that are part of the current development program
   - Ready to be started
   - No work log required yet

3. **In Progress**
   - Active development is happening
   - Requires:
     - Task work log creation
     - Daily updates to work log
     - Code commits linked to task

4. **Testing**
   - Development is complete
   - Code is ready for testing
   - Requires:
     - Test cases documented in work log
     - Test results recorded
     - Any issues found documented

5. **Review**
   - Code and testing are complete
   - Ready for final review
   - Requires:
     - Complete work log
     - All tests passing
     - Code documentation up to date

6. **Done**
   - Task is fully complete
   - Requires:
     - Final work log update
     - Story-level documentation (if applicable)
     - All review comments addressed

## Task Workflow Tracking
The `TSK_WFL_TENP-XXX.md` file records the complete lifecycle of a task:

### Format
```markdown
# Task Workflow: TENP-XXX
Title: [Task Title]
Created: [Timestamp]
Parent Story: [Story Key] (if applicable)

## Status History
1. [Timestamp] TO DO → SELECTED FOR DEVELOPMENT
   Reason: Included in development program
   Program Priority: X

2. [Timestamp] SELECTED FOR DEVELOPMENT → IN PROGRESS
   Assignee: [Developer Name]
   Work Log: [Link to work log file]

3. [Timestamp] IN PROGRESS → TESTING
   Time in Development: X days
   Commit Count: X
   Test Plan: [Link to test cases]

4. [Timestamp] TESTING → REVIEW
   Test Results: [Summary]
   Issues Found: X
   Issues Fixed: X

5. [Timestamp] REVIEW → [DONE/IN PROGRESS/WON'T DO]
   Reviewer: [Name]
   Decision: [Approved/Needs Changes/Discarded]
   Feedback: [Summary]

## Time Analysis
- Development Time: X days
- Testing Time: X days
- Review Time: X days
- Total Time: X days

## Related Changes
- Files Modified: X
- Lines Changed: +X/-X
- Dependencies Added: X
- Configuration Changes: X
```

### Usage
- Created automatically when task moves to IN PROGRESS
- Updated with each status change
- Used for:
  - Progress tracking
  - Time analysis
  - Process improvement
  - Sprint retrospectives
  - Performance metrics

## Documentation Requirements

### Task-Level Documentation (work_log.md)
Required sections:
1. Implementation Details
   - Technical approach
   - Key algorithms
   - Data structures used
   - Performance considerations

2. Code Changes
   - Files modified
   - New components added
   - Database changes
   - API changes

3. Dependencies
   - New packages added
   - Version updates
   - Configuration changes

4. Testing Notes
   - Test cases
   - Edge cases covered
   - Performance test results
   - Known limitations

5. Related Tasks
   - Dependencies on other tasks
   - Tasks that depend on this one
   - Related story/epic references

### Story-Level Documentation (PROJECT_BRIEF.md)
Required sections when completing story-related tasks:
1. Changes
   - High-level system changes
   - Architecture modifications
   - Database schema updates
   - API contract changes

2. Design Decisions
   - Architecture choices
   - Technology selections
   - Trade-offs made
   - Future considerations

3. Integration Points
   - External system dependencies
   - API endpoints
   - Event handlers
   - Message queues

4. User Impact
   - New features
   - Changed behaviors
   - Migration requirements
   - Performance impacts

## Workflow Steps

### 1. Program Creation
- Select tasks for development
- Move tasks to "Selected for Development"
- Assign priorities
- Create development_program.json

### 2. Start Development
- Move task to "In Progress"
- Create work log
- Link to parent story if applicable
- Begin implementation

### 3. Complete Development
- Update work log with implementation details
- Document testing requirements
- Move to "Testing" or "Review"
  - Direct to Review if it's a testing task
  - Otherwise, move to Testing first

### 4. Review Process
Options:
1. **Approve**
   - Move to "Done"
   - Update work log with completion
   - Update story documentation if needed

2. **Return to Development**
   - Move back to "In Progress"
   - Document review feedback
   - Create new tasks if needed

3. **Discard**
   - Move to "Won't Do"
   - Document reason
   - Update dependencies

## Best Practices
1. Keep work logs updated daily
2. Link all commits to tasks
3. Document design decisions immediately
4. Update story documentation while context is fresh
5. Test thoroughly before review
6. Address review feedback promptly

## Common Issues
1. Missing work log updates
2. Incomplete testing documentation
3. Skipped story-level documentation
4. Unclear review feedback
5. Undocumented dependencies
