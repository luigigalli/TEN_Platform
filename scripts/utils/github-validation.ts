import { z } from 'zod';

// Branch name patterns from our git hooks
const validBranchPatterns = [
  /^main$/,
  /^develop$/,
  /^feat\/[a-z0-9-]+$/,
  /^fix\/[a-z0-9-]+$/,
  /^docs\/[a-z0-9-]+$/,
  /^env\/[a-z0-9-]+$/,
  /^issue-[0-9]+-[a-z0-9-]+$/,
  /^hotfix-[0-9]+-[a-z0-9-]+$/
] as const;

// Schema for issue creation
export const issueSchema = z.object({
  title: z.string()
    .regex(/^\[(Env|Feature|Bug|Enhancement|Security|Performance)\]/, {
      message: "Title must start with [Env], [Feature], [Bug], [Enhancement], [Security], or [Performance]"
    })
    .regex(/\(#P[0-3]\)$/, {
      message: "Title must end with priority (#P0-#P3)"
    }),
  body: z.string(),
  labels: z.array(z.string())
});

// Validation for branch names
export function validateBranchName(branchName: string): { isValid: boolean; message?: string } {
  const isValid = validBranchPatterns.some(pattern => pattern.test(branchName));

  if (!isValid) {
    return {
      isValid: false,
      message: `Branch name '${branchName}' does not match allowed patterns:
- feat/description (for features)
- fix/description (for bug fixes)
- docs/description (for documentation)
- env/description (for environment configuration)
- issue-XXX-description (for specific issues)
- hotfix-XXX-description (for urgent fixes)`
    };
  }

  return { isValid: true };
}

// Generate branch name from issue
export function generateBranchName(issueNumber: number, title: string): string {
  // Extract the meaningful part of the title (remove type and priority)
  const cleanTitle = title
    .replace(/^\[(Env|Feature|Bug|Enhancement|Security|Performance)\]/, '')
    .replace(/\(#P[0-3]\)$/, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const branchName = `issue-${issueNumber}-${cleanTitle}`;
  return branchName;
}

// Parse GitHub repository URL
export function parseGitHubUrl(url: string): { owner: string; repo: string } {
  // Remove auth token if present
  const cleanUrl = url.replace(/https:\/\/.*?@github\.com/, 'https://github.com');

  const httpsMatch = cleanUrl.match(/https:\/\/github\.com\/([^\/]+)\/([^\/\.]+)(?:\.git)?$/);
  if (httpsMatch) {
    return {
      owner: httpsMatch[1],
      repo: httpsMatch[2]
    };
  }

  const sshMatch = cleanUrl.match(/git@github\.com:([^\/]+)\/([^\/\.]+)(?:\.git)?$/);
  if (sshMatch) {
    return {
      owner: sshMatch[1],
      repo: sshMatch[2]
    };
  }

  throw new Error('Invalid GitHub URL format. Expected HTTPS or SSH URL format.');
}

// Error types for better error handling
export class GitHubError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly response?: any
  ) {
    super(message);
    this.name = 'GitHubError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}