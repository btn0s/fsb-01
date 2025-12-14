import { Octokit } from "@octokit/rest";

/**
 * Octokit client for GitHub API operations
 */
export const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

export const getRepoConfig = () => ({
  owner: process.env.DEMO_REPO_OWNER!,
  repo: process.env.DEMO_REPO_NAME!,
});

