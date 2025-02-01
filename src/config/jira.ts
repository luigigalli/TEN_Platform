import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

// Define the path to the Jira credentials file
const JIRA_CREDS_PATH = path.join(__dirname, '../../.jira-credentials');

interface JiraConfig {
    apiToken: string;
    email: string;
    baseUrl: string;
}

// Function to save Jira credentials
export function saveJiraCredentials(config: JiraConfig): void {
    try {
        fs.writeFileSync(JIRA_CREDS_PATH, JSON.stringify(config, null, 2));
        fs.chmodSync(JIRA_CREDS_PATH, 0o600); // Read/write for owner only
    } catch (error) {
        console.error('Error saving Jira credentials:', error);
    }
}

// Function to load Jira credentials
export function loadJiraCredentials(): JiraConfig | null {
    try {
        if (fs.existsSync(JIRA_CREDS_PATH)) {
            const content = fs.readFileSync(JIRA_CREDS_PATH, 'utf8');
            return JSON.parse(content);
        }
    } catch (error) {
        console.error('Error loading Jira credentials:', error);
    }
    return null;
}

// Get Jira configuration, prioritizing environment variables
export function getJiraConfig(): JiraConfig {
    // First try environment variables
    const envConfig = {
        apiToken: process.env.JIRA_API_TOKEN,
        email: process.env.JIRA_EMAIL,
        baseUrl: process.env.JIRA_BASE_URL,
    };

    // If all environment variables are present, save them and return
    if (envConfig.apiToken && envConfig.email && envConfig.baseUrl) {
        saveJiraCredentials(envConfig);
        return envConfig;
    }

    // Try to load from credentials file
    const fileConfig = loadJiraCredentials();
    if (fileConfig) {
        return fileConfig;
    }

    throw new Error('Jira credentials not found. Please set JIRA_API_TOKEN, JIRA_EMAIL, and JIRA_BASE_URL environment variables.');
}
