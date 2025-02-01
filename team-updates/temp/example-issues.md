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