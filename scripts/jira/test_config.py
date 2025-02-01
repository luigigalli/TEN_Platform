#!/usr/bin/env python3
from create_subtasks import get_jira_config

def test_config():
    try:
        config = get_jira_config()
        # Print config with redacted sensitive info
        print("Config loaded successfully:")
        print(f"Email: {'*' * len(config['email'])}")
        print(f"Token: {'*' * len(config['token'])}")
        print(f"URL: {config['url']}")
        return True
    except Exception as e:
        print(f"Error loading config: {e}")
        return False

if __name__ == '__main__':
    test_config()
