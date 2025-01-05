import fetch from 'node-fetch';
import { execSync } from 'child_process';
import { 
  issueSchema, 
  validateBranchName, 
  generateBranchName,
  parseGitHubUrl,
  GitHubError, 
  ValidationError 
} from './utils/github-validation';

interface CreateIssueResponse {
  number: number;
  title: string;
}

interface CreateRefResponse {
  ref: string;
  object: {
    sha: string;
  }
}

function getRepositoryInfo(): { owner: string; repo: string } {
  try {
    // Get the remote URL from git config
    const remoteUrl = execSync('git config --get remote.origin.url')
      .toString()
      .trim();

    return parseGitHubUrl(remoteUrl);
  } catch (error) {
    console.error('Error getting repository info:', error);
    throw error;
  }
}

async function handleGitHubResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    throw new GitHubError(
      `GitHub API error: ${response.statusText}`,
      response.status,
      errorText
    );
  }
  return response.json() as Promise<T>;
}

async function createGitHubIssue() {
  const token = process.env.GIT_TOKEN;
  if (!token) {
    throw new Error('GIT_TOKEN environment variable is required');
  }

  const { owner, repo } = getRepositoryInfo();
  console.log(`Creating issue in ${owner}/${repo}`);

  const issue = {
    title: '[Env][System] Standardize Git workflow and branch management across environments (#P1)',
    body: `## Overview
Implement and standardize Git workflow and branch management system for consistent development across Replit and Windsurf environments.

## Technical Approach
- Configure environment-specific Git pull strategies
  - Replit: Rebase strategy
  - Windsurf: Fast-forward only
- Set up branch protection rules
- Implement pre-commit hooks for validation
- Update documentation for cross-environment development

## Environment Considerations
### Replit Environment
- Configure rebase-based pull strategy
- Set up environment-specific hooks
- Configure authentication for Replit

### Windsurf Environment
- Configure fast-forward only strategy
- Set up environment-specific hooks
- Handle local development setup

## Acceptance Criteria
- [ ] Environment-specific Git configurations working correctly
- [ ] Branch protection rules enforced in both environments
- [ ] Pre-commit hooks validating branch names and commit messages
- [ ] Cross-environment sync process documented and tested
- [ ] Documentation updated with environment-specific workflows

## Related Components
- Git configuration system
- Environment detection
- Branch protection rules
- Cross-environment sync process`,
    labels: ['environment', 'system', 'P1']
  };

  try {
    // Validate issue format
    const validatedIssue = issueSchema.parse(issue);

    // Create the issue
    const issueResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedIssue)
    });

    const issueData = await handleGitHubResponse<CreateIssueResponse>(issueResponse);
    console.log('Issue created successfully:', issueData.number);

    // Get the default branch SHA
    const branchResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/develop`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      }
    });

    const branchData = await handleGitHubResponse<CreateRefResponse>(branchResponse);

    // Generate and validate branch name
    const branchName = generateBranchName(issueData.number, issueData.title);
    const branchValidation = validateBranchName(branchName);

    if (!branchValidation.isValid) {
      throw new ValidationError(branchValidation.message || 'Invalid branch name');
    }

    // Create a new branch for the issue
    const createBranchResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: branchData.object.sha
      })
    });

    await handleGitHubResponse(createBranchResponse);
    console.log(`Created branch: ${branchName}`);

    return {
      issueNumber: issueData.number,
      branchName
    };
  } catch (error) {
    if (error instanceof GitHubError) {
      console.error('GitHub API Error:', error.message);
      console.error('Status:', error.status);
      console.error('Response:', error.response);
    } else if (error instanceof ValidationError) {
      console.error('Validation Error:', error.message);
    } else {
      console.error('Error:', error);
    }
    throw error;
  }
}

// Execute the script
createGitHubIssue()
  .then(({ issueNumber, branchName }) => {
    console.log(`Created issue #${issueNumber} with branch ${branchName}`);
    process.exit(0);
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });