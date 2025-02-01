import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables from .env file
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

# Configuration settings
JIRA_EMAIL = os.getenv('JIRA_EMAIL')
JIRA_API_TOKEN = os.getenv('JIRA_API_TOKEN')
JIRA_BASE_URL = os.getenv('JIRA_BASE_URL')
JIRA_API_VERSION = os.getenv('JIRA_API_VERSION', '2')
JIRA_PROJECT_KEY = os.getenv('JIRA_PROJECT_KEY')

# Validate required environment variables
required_vars = [
    'JIRA_EMAIL',
    'JIRA_API_TOKEN',
    'JIRA_BASE_URL',
    'JIRA_PROJECT_KEY'
]

missing_vars = [var for var in required_vars if not os.getenv(var)]
if missing_vars:
    raise EnvironmentError(
        f"Missing required environment variables: {', '.join(missing_vars)}\n"
        f"Please check your .env file and ensure all required variables are set.\n"
        f"You can use .env.template as a reference."
    )
