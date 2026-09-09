import { ApkBuildConfig } from '../types';

export interface ArtifactInfo {
  id: number;
  name: string;
  size_in_bytes: number;
  archive_download_url: string;
  created_at: string;
}

export interface BuildProgressState {
  status: 'idle' | 'updating_repo' | 'triggering' | 'queued' | 'in_progress' | 'completed' | 'failed';
  runId?: number;
  runUrl?: string;
  elapsedSeconds: number;
  message: string;
  artifactUrl?: string;
  artifactName?: string;
  error?: string;
}

/**
 * Updates or creates app-config.json in the user's GitHub repo using their PAT,
 * so the GitHub Actions runner builds the exact customized APK.
 */
export async function updateRepoAppConfig(
  owner: string,
  repo: string,
  config: ApkBuildConfig,
  token: string,
  branch = 'main'
): Promise<{ success: boolean; sha?: string; error?: string }> {
  try {
    const path = 'app-config.json';
    const contentStr = JSON.stringify(config, null, 2);
    // Base64 encode for UTF-8 content
    const contentBase64 = btoa(unescape(encodeURIComponent(contentStr)));

    // 1. Check if the file already exists to get its SHA
    let existingSha: string | undefined;
    const checkRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (checkRes.ok) {
      const data = await checkRes.json();
      existingSha = data.sha;
    }

    // 2. Put / update the file
    const body: Record<string, any> = {
      message: `Update APK Config: ${config.identity.appName} (v${config.identity.versionName})`,
      content: contentBase64,
      branch,
    };
    if (existingSha) {
      body.sha = existingSha;
    }

    const putRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!putRes.ok) {
      const errData = await putRes.json().catch(() => ({}));
      return { success: false, error: errData.message || `Failed to update config on GitHub (Status ${putRes.status})` };
    }

    const putData = await putRes.json();
    return { success: true, sha: putData.content?.sha };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Network error updating GitHub repo';
    return { success: false, error: msg };
  }
}

/**
 * Triggers workflow_dispatch with custom config inputs if provided
 */
export async function triggerBuildWorkflow(
  owner: string,
  repo: string,
  workflowFileName: string,
  branch: string,
  token: string,
  config?: ApkBuildConfig
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const bodyPayload: Record<string, any> = {
      ref: branch || 'main',
    };

    if (config) {
      bodyPayload.inputs = {
        app_name: config.identity.appName,
        package_name: config.identity.packageName,
        target_url: config.identity.targetUrl,
        version_name: config.identity.versionName,
        version_code: config.identity.versionCode.toString(),
      };
    }

    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFileName}/dispatches`,
      {
        method: 'POST',
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyPayload),
      }
    );

    if (res.status === 204) {
      return { success: true, message: 'Build triggered successfully on GitHub Actions!' };
    }

    const err = await res.json().catch(() => ({}));
    return { success: false, error: err.message || `Trigger failed with status ${res.status}` };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Network error';
    return { success: false, error: msg };
  }
}

/**
 * Polls recent runs to find the newly triggered run
 */
export async function getLatestWorkflowRun(
  owner: string,
  repo: string,
  token: string
): Promise<{ success: boolean; run?: any; error?: string }> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=3`,
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.message || `HTTP ${res.status}` };
    }

    const data = await res.json();
    const runs = data.workflow_runs || [];
    return { success: true, run: runs[0] };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to query workflow runs';
    return { success: false, error: msg };
  }
}

/**
 * Checks for generated APK artifacts in the run
 */
export async function getRunArtifacts(
  owner: string,
  repo: string,
  runId: number,
  token: string
): Promise<{ success: boolean; artifacts?: ArtifactInfo[]; error?: string }> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}/artifacts`,
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (!res.ok) {
      return { success: false, error: `Failed to fetch artifacts (HTTP ${res.status})` };
    }

    const data = await res.json();
    return { success: true, artifacts: data.artifacts || [] };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch artifacts';
    return { success: false, error: msg };
  }
}

/**
 * Downloads artifact using PAT authentication and triggers browser download
 */
export async function downloadArtifactWithToken(
  downloadUrl: string,
  fileName: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(downloadUrl, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!res.ok) {
      return { success: false, error: `Download failed with HTTP ${res.status}` };
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName.endsWith('.zip') ? fileName : `${fileName}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Download failed';
    return { success: false, error: msg };
  }
}
