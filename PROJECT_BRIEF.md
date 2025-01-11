# The Experiences Network (TEN) - Project Brief

## Project Overview
The Experiences Network (TEN) is a platform for creating, discovering, and booking unique experiences. The platform connects experience creators with participants, handling everything from discovery to booking and payment processing.

## Project Structure
- Root Directory: `/Users/luigigalli/CascadeProjects/TEN_2_Replit/`
- Key Directories:
  - `/scripts/jira/`: Contains Jira integration scripts
  - `/server/`: Contains server-side application code
  - `/db/`: Contains database schema and migrations
  - `/tests/`: Contains test files and utilities

## Major Decisions & Milestones

### 2025-01-09
1. **Technology Stack Selection**
   - Express.js with TypeScript for backend
   - Rationale: Strong typing, better maintainability, extensive ecosystem
   - Modular architecture for scalability
   - Test-driven development approach

2. **Project Management Setup**
   - Jira project key: `TENP`
   - Base URL: `https://the-experiences-network.atlassian.net`
   - Structured epics for major features
   - Automated task management via Python Jira API
   - Required packages: `jira-python`, `python-dotenv`
   - Secure API token management

### 2025-01-10
**Strategic Code Reset**
- Decision: Complete reset of application code while preserving infrastructure
- Rationale: New requirements necessitate different architecture
- Preserved Components:
  - Development infrastructure
  - Testing framework
  - Database schema
  - Configuration system
  - Security middleware
  - Basic health monitoring

### 2025-01-11
**Task Management Enhancement**
- Decision: Use Python for all Jira API interactions
- Rationale: Better API support, robust error handling
- Implementation:
  * Python scripts for task transitions
  * Environment-based configuration
  * Secure token management
  * Automated task logging

## Current Project State
- Clean, minimal codebase with robust infrastructure
- Ready for new feature implementation
- Test-driven development environment established
- Basic health monitoring in place

## Next Major Steps
1. Implement core features on clean foundation
2. Maintain strict type safety and test coverage
3. Follow modular architecture principles

## Key Guidelines
- Test-driven development mandatory
- Documentation required for all APIs
- Modular architecture approach
- Regular project brief updates
