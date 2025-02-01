# Windsurf Context Management

## Directory Structure
```
TEN/
└── TEN_Platform/
    └── .windsurf/
        ├── conversations/
        │   ├── conversation_1/
        │   │   ├── context_cache/
        │   │   ├── logs/
        │   │   └── state.json
        │   └── conversation_2/
        │       ├── context_cache/
        │       ├── logs/
        │       └── state.json
        ├── shared/
        │   ├── cache/
        │   └── logs/
        └── config.json
```

## Purpose
- Maintain context across different Windsurf conversations
- Cache project information for each conversation
- Share common resources between conversations
- Track conversation-specific state

## Implementation
1. Each conversation gets its own isolated context
2. Shared resources available to all conversations
3. State tracking per conversation
4. Centralized logging and monitoring

## Usage
1. On conversation start:
   - Create new conversation directory if needed
   - Initialize context cache
   - Load shared resources

2. During conversation:
   - Update conversation-specific cache
   - Track state changes
   - Log activities

3. Cross-conversation sharing:
   - Use shared cache for common data
   - Maintain conversation isolation
   - Enable selective sharing when needed
