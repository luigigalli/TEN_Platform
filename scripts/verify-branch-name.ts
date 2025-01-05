import { execSync } from 'child_process';

const ISSUE_TYPE_PREFIXES = {
  '[Env]': 'env/',
  '[Feature]': 'feat/',
  '[Bug]': 'fix/',
  '[Enhancement]': 'enhance/',
  '[Security]': 'security/',
  '[Performance]': 'perf/'
} as const;

function getCurrentBranch(): string {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD')
      .toString()
      .trim();
  } catch (error) {
    console.error('Error getting current branch:', error);
    process.exit(1);
  }
}

function validateBranchName(branchName: string): boolean {
  // Skip validation for protected branches
  if (['main', 'develop'].includes(branchName)) {
    return true;
  }

  // Check if branch starts with valid prefix
  const validPrefix = Object.values(ISSUE_TYPE_PREFIXES).some(prefix =>
    branchName.startsWith(prefix)
  );

  if (!validPrefix) {
    console.error(`Error: Branch name "${branchName}" must start with one of: ${Object.values(ISSUE_TYPE_PREFIXES).join(', ')}`);
    return false;
  }

  // Check if branch name follows convention
  const branchPattern = /^(env|feat|fix|enhance|security|perf)\/((issue-\d+-)?.+)$/;
  if (!branchPattern.test(branchName)) {
    console.error(`Error: Branch name "${branchName}" does not follow the naming convention.`);
    console.error('Examples of valid names:');
    console.error('- env/issue-123-workflow-automation');
    console.error('- feat/user-authentication');
    console.error('- fix/issue-456-login-error');
    return false;
  }

  return true;
}

// Run validation
const currentBranch = getCurrentBranch();
if (!validateBranchName(currentBranch)) {
  process.exit(1);
}
