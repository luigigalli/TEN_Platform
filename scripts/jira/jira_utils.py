#!/usr/bin/env python3
import os
from typing import Optional, Tuple
from jira import JIRA
from dotenv import load_dotenv

def init_jira() -> Tuple[Optional[JIRA], Optional[str]]:
    """Initialize JIRA client with error handling"""
    try:
        load_dotenv()
        
        email = os.getenv('JIRA_EMAIL')
        api_token = os.getenv('JIRA_API_TOKEN')
        server = os.getenv('JIRA_BASE_URL')
        
        if not all([email, api_token, server]):
            return None, "Missing required environment variables"
        
        jira = JIRA(
            server=server,
            basic_auth=(email, api_token)
        )
        
        return jira, None
        
    except Exception as e:
        return None, f"Failed to initialize JIRA: {str(e)}"

def validate_transition(jira: JIRA, issue_key: str, target_status: str) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Validate if a transition to target_status is valid and necessary
    Returns: (is_valid, error_message, current_status)
    """
    try:
        issue = jira.issue(issue_key)
        current_status = issue.fields.status.name
        
        # Check if already in target status
        if current_status.lower() == target_status.lower():
            return False, f"Issue {issue_key} is already in {target_status} status", current_status
        
        # Get available transitions
        transitions = jira.transitions(issue)
        valid_transition = any(
            t['name'].lower() == target_status.lower() 
            for t in transitions
        )
        
        if not valid_transition:
            return False, f"No transition to {target_status} available from {current_status}", current_status
            
        return True, None, current_status
        
    except Exception as e:
        return False, f"Error validating transition: {str(e)}", None

def get_transition_id(jira: JIRA, issue_key: str, target_status: str) -> Optional[str]:
    """Get the ID for a specific transition"""
    try:
        issue = jira.issue(issue_key)
        transitions = jira.transitions(issue)
        
        transition = next(
            (t for t in transitions if t['name'].lower() == target_status.lower()),
            None
        )
        
        return transition['id'] if transition else None
        
    except Exception:
        return None

def perform_transition(jira: JIRA, issue_key: str, target_status: str) -> Tuple[bool, Optional[str]]:
    """
    Perform status transition with validation
    Returns: (success, error_message)
    """
    try:
        # Validate transition
        is_valid, error_msg, current_status = validate_transition(jira, issue_key, target_status)
        if not is_valid:
            return False, error_msg
            
        # Get transition ID
        transition_id = get_transition_id(jira, issue_key, target_status)
        if not transition_id:
            return False, f"Could not find transition ID for {target_status}"
            
        # Perform transition
        jira.transition_issue(issue_key, transition_id)
        return True, None
        
    except Exception as e:
        return False, f"Error performing transition: {str(e)}"
