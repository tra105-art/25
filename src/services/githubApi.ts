import { GitHubWorkflowRun } from '../types';

export interface GitHubRepoInfo {
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  default_branch: string;
}

export async function verifyGitHubConnection(
  owner: string,
  repo: string,
  token?: string
): Promise<{ success: boolean; repoInfo?: GitHubRepoInfo; error?: string }> {
  try {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
    };
    if (token) {
      headers.Authorization = `token ${token}`;
    }

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers,
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { success: false, error: 'Repository not found. Please check owner and repo name or PAT permissions.' };
      }
      if (response.status === 401) {
        return { success: false, error: 'Bad credentials. Personal Access Token (PAT) is invalid or expired.' };
      }
      const data = await response.json().catch(() => ({}));
      return { success: false, error: data.message || `HTTP Error ${response.status}` };
    }

    const repoInfo = await response.json();
    return { success: true, repoInfo };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error connecting to GitHub API';
    return { success: false, error: message };
  }
}

export async function triggerWorkflowDispatch(
  owner: string,
  repo: string,
  workflowFileName: string,
  branch: string,
  token: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    if (!token) {
      return { success: false, error: 'Personal Access Token (PAT) is required to trigger builds.' };
    }

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFileName}/dispatches`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github.v3+json',
          Authorization: `token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ref: branch || 'main',
        }),
      }
    );

    if (response.status === 204) {
      return { success: true, message: 'Workflow build successfully triggered! GitHub Actions is now compiling your APK.' };
    }

    const data = await response.json().catch(() => ({}));
    return { success: false, error: data.message || `Failed to trigger workflow (Status ${response.status})` };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to connect to GitHub';
    return { success: false, error: message };
  }
}

export async function getWorkflowRuns(
  owner: string,
  repo: string,
  token?: string
): Promise<{ success: boolean; runs?: GitHubWorkflowRun[]; error?: string }> {
  try {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
    };
    if (token) {
      headers.Authorization = `token ${token}`;
    }

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=10`,
      { headers }
    );

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return { success: false, error: data.message || `HTTP ${response.status}` };
    }

    const data = await response.json();
    return { success: true, runs: data.workflow_runs || [] };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch workflow runs';
    return { success: false, error: message };
  }
}
