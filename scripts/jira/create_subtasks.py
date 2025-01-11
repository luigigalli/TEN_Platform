#!/usr/bin/env python3
import os
from jira import JIRA
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Jira connection setup
JIRA_API_TOKEN = os.getenv('JIRA_API_TOKEN')
JIRA_EMAIL = os.getenv('JIRA_EMAIL')
JIRA_URL = os.getenv('JIRA_BASE_URL')

# Initialize Jira client
jira = JIRA(
    basic_auth=(JIRA_EMAIL, JIRA_API_TOKEN),
    server=JIRA_URL
)

# Subtasks structure with dependencies
SUBTASKS = {
    'TENP-73': [  # Error Handling
        {
            'summary': '[Subtask] Define Error Types and Classes',
            'description': 'Define core error types and implement custom error classes',
            'blocks': ['TENP-73-2']
        },
        {
            'summary': '[Subtask] Implement Global Error Handler',
            'description': 'Create global error handling middleware',
            'key': 'TENP-73-2',
            'blocks': ['TENP-73-3']
        },
        {
            'summary': '[Subtask] Setup Error Response Formatting',
            'description': 'Implement standardized error response format',
            'key': 'TENP-73-3',
            'blocks': ['TENP-73-4']
        },
        {
            'summary': '[Subtask] Integrate Error Logging',
            'description': 'Connect error handling with logging system',
            'depends_on': ['TENP-78']  # Depends on Logging System
        }
    ],
    'TENP-74': [  # Request Validation
        {
            'summary': '[Subtask] Setup Validation Middleware',
            'description': 'Implement base validation middleware',
            'blocks': ['TENP-74-2']
        },
        {
            'summary': '[Subtask] Implement Schema Definition System',
            'description': 'Create system for defining validation schemas',
            'key': 'TENP-74-2'
        },
        {
            'summary': '[Subtask] Add Request Sanitization',
            'description': 'Implement input sanitization for requests'
        },
        {
            'summary': '[Subtask] Create Custom Validators',
            'description': 'Implement custom validation rules'
        }
    ],
    'TENP-75': [  # API Documentation
        {
            'summary': '[Subtask] Setup OpenAPI/Swagger',
            'description': 'Initialize OpenAPI/Swagger documentation system',
            'blocks': ['TENP-75-2']
        },
        {
            'summary': '[Subtask] Create Documentation Generation System',
            'description': 'Implement automated documentation generation',
            'key': 'TENP-75-2',
            'blocks': ['TENP-75-3']
        },
        {
            'summary': '[Subtask] Document API Endpoints',
            'description': 'Create documentation for all API endpoints',
            'key': 'TENP-75-3'
        }
    ],
    'TENP-78': [  # Logging System
        {
            'summary': '[Subtask] Configure Logger',
            'description': 'Setup and configure logging system',
            'blocks': ['TENP-78-2']
        },
        {
            'summary': '[Subtask] Implement Request Logging',
            'description': 'Create middleware for request logging',
            'key': 'TENP-78-2'
        },
        {
            'summary': '[Subtask] Setup Log Rotation',
            'description': 'Implement log rotation and management'
        }
    ],
    'TENP-79': [  # Schema Design
        {
            'summary': '[Subtask] Define Core Entities',
            'description': 'Define core database entities and their attributes',
            'blocks': ['TENP-79-2']
        },
        {
            'summary': '[Subtask] Map Entity Relationships',
            'description': 'Define relationships between entities',
            'key': 'TENP-79-2',
            'blocks': ['TENP-80-1']  # Blocks first Migration System task
        }
    ],
    'TENP-80': [  # Migration System
        {
            'summary': '[Subtask] Setup Migration Tool',
            'description': 'Initialize and configure migration system',
            'key': 'TENP-80-1',
            'blocks': ['TENP-80-2']
        },
        {
            'summary': '[Subtask] Create Base Migration',
            'description': 'Implement initial database migration',
            'key': 'TENP-80-2',
            'blocks': ['TENP-81-1']  # Blocks first Entity Models task
        }
    ],
    'TENP-81': [  # Entity Models
        {
            'summary': '[Subtask] Create Base Model Class',
            'description': 'Implement base model class with common functionality',
            'key': 'TENP-81-1',
            'blocks': ['TENP-81-2']
        },
        {
            'summary': '[Subtask] Implement Core Entity Models',
            'description': 'Create models for core entities',
            'key': 'TENP-81-2',
            'blocks': ['TENP-84-1']  # Blocks first Data Validation task
        }
    ],
    'TENP-84': [  # Data Validation
        {
            'summary': '[Subtask] Setup Validation Rules',
            'description': 'Define and implement data validation rules',
            'key': 'TENP-84-1',
            'blocks': ['TENP-84-2']
        },
        {
            'summary': '[Subtask] Implement Validation Middleware',
            'description': 'Create middleware for data validation',
            'key': 'TENP-84-2'
        }
    ]
}

def create_subtasks():
    for parent_key, subtasks in SUBTASKS.items():
        print(f"\nCreating subtasks for {parent_key}...")
        
        # Get parent issue
        parent = jira.issue(parent_key)
        
        # Create subtasks
        for subtask in subtasks:
            # Create subtask
            subtask_dict = {
                'project': {'key': 'TENP'},
                'summary': subtask['summary'],
                'description': subtask['description'],
                'issuetype': {'name': 'Sub-task'},
                'parent': {'key': parent_key}
            }
            
            new_subtask = jira.create_issue(fields=subtask_dict)
            print(f"Created subtask: {new_subtask.key}")
            
            # Store key if specified
            if 'key' in subtask:
                subtask['created_key'] = new_subtask.key
            
            # Add blocking links
            if 'blocks' in subtask:
                for blocked_key in subtask['blocks']:
                    # Wait for blocked task to be created
                    for other_task in subtasks:
                        if other_task.get('key') == blocked_key:
                            other_task['blocked_by'] = new_subtask.key
            
            # Add dependency links
            if 'depends_on' in subtask:
                for dependency in subtask['depends_on']:
                    jira.create_issue_link(
                        type='Blocks',
                        inwardIssue=dependency,
                        outwardIssue=new_subtask.key
                    )

if __name__ == '__main__':
    create_subtasks()
