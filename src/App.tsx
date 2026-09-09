import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Download,
  Code2,
  Github,
  CheckCircle2,
  Layers,
  Sparkles,
  Sliders,
  Shield,
  HelpCircle,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { ApkBuildConfig } from './types';
import { defaultApkConfig } from './data/defaultConfig';
import { Header } from './components/Header';
import { PhoneSimulator } from './components/PhoneSimulator';
import { ConfigPanel } from './components/ConfigPanel';
import { CodeViewerModal } from './components/CodeViewerModal';
import { PushGuideModal } from './components/PushGuideModal';
import { DefaultCodeModal } from './components/DefaultCodeModal';
import { BuildStatusBar } from './components/BuildStatusBar';
import {
  BuildProgressState,
  updateRepoAppConfig,
  triggerBuildWorkflow,
  getLatestWorkflowRun,
  getRunArtifacts,
  downloadArtifactWithToken,
} from './services/githubBuildManager';
import { generateProjectZip, downloadBlob } from './utils/zipGenerator';

const STORAGE_KEY = 'apk_creator_studio_config_v2';

export default function App() {
  const [config, setConfig] = useState<ApkBuildConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return defaultApkConfig;
  });

  const [activeTab, setActiveTab] = useState<string>('identity');
  const [isCodeViewerOpen, setIsCodeViewerOpen] = useState(false);
  const [isPushGuideOpen, setIsPushGuideOpen] = useState(false);
  const [isDefaultCodeOpen, setIsDefaultCodeOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Build execution & polling state
  const [buildState, setBuildState] = useState<BuildProgressState>({
    status: 'idle',
    elapsedSeconds: 0,
    message: '',
  });

  // Auto-save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      // ignore
    }
  }, [config]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleDownloadZip = async () => {
    try {
      setIsDownloading(true);
      showToast('Generating complete Android Studio project ZIP...');
      const blob = await generateProjectZip(config);
      const fileName = `${config.identity.appName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-android-project.zip`;
      downloadBlob(blob, fileName);
      showToast('Project ZIP downloaded! Ready to push to GitHub.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error generating project ZIP';
      showToast(`Error: ${msg}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const activePermissionsCount = Object.values(config.permissions).filter(Boolean).length;
  const hasGithubConfig = Boolean(config.github.repoOwner && config.github.repoName && config.github.personalAccessToken);

  // Timer for elapsed time during build
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    const isRunning =
      buildState.status === 'updating_repo' ||
      buildState.status === 'triggering' ||
      buildState.status === 'queued' ||
      buildState.status === 'in_progress';

    if (isRunning) {
      interval = setInterval(() => {
        setBuildState((prev) => ({
          ...prev,
          elapsedSeconds: prev.elapsedSeconds + 1,
        }));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [buildState.status]);

  // Polling GitHub Actions status
  useEffect(() => {
    let pollTimer: NodeJS.Timeout | null = null;
    const { repoOwner, repoName, personalAccessToken } = config.github;

    const isPolling =
      buildState.status === 'queued' || buildState.status === 'in_progress';

    if (isPolling && repoOwner && repoName && personalAccessToken) {
      pollTimer = setInterval(async () => {
        try {
          const runRes = await getLatestWorkflowRun(repoOwner, repoName, personalAccessToken);
          if (runRes.success && runRes.run) {
            const run = runRes.run;
            const currentStatus = run.status; // queued, in_progress, completed
            const conclusion = run.conclusion; // success, failure, cancelled

            if (currentStatus === 'completed') {
              if (conclusion === 'success') {
                // Fetch artifact for APK download
                const artRes = await getRunArtifacts(repoOwner, repoName, run.id, personalAccessToken);
                const apkArtifact = artRes.artifacts?.find((a) => a.name.includes('.apk')) || artRes.artifacts?.[0];

                setBuildState((prev) => ({
                  ...prev,
                  status: 'completed',
                  runId: run.id,
                  runUrl: run.html_url,
                  message: 'Build finished successfully! Your APK is ready.',
                  artifactUrl: apkArtifact?.archive_download_url || run.html_url,
                  artifactName: apkArtifact?.name || `${config.identity.appName}-v${config.identity.versionName}.apk`,
                }));
                showToast('🎉 APK Build finished! Click "Download APK" to get your file.');
              } else {
                setBuildState((prev) => ({
                  ...prev,
                  status: 'failed',
                  runId: run.id,
                  runUrl: run.html_url,
                  message: `Build finished with ${conclusion || 'failure'}. Check GitHub Actions log for details.`,
                  error: `GitHub Actions conclusion: ${conclusion}`,
                }));
              }
            } else if (currentStatus === 'in_progress') {
              setBuildState((prev) => ({
                ...prev,
                status: 'in_progress',
                runId: run.id,
                runUrl: run.html_url,
                message: 'Compiling Android app & generating APK on GitHub runners...',
              }));
            }
          }
        } catch {
          // ignore transient poll error
        }
      }, 5000);
    }

    return () => {
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [buildState.status, config.github, config.identity]);

  const handleStartBuild = async () => {
    const { repoOwner, repoName, personalAccessToken, workflowFileName, branch } = config.github;
    if (!repoOwner || !repoName || !personalAccessToken) {
      setActiveTab('github');
      showToast('⚠️ GitHub Repo Owner, Name & PAT Token are required!');
      return;
    }

    try {
      // Step 1: Update repo app-config.json with latest user selections
      setBuildState({
        status: 'updating_repo',
        elapsedSeconds: 0,
        message: 'Syncing your configuration to GitHub repository (app-config.json)...',
      });

      const updateRes = await updateRepoAppConfig(
        repoOwner,
        repoName,
        config,
        personalAccessToken,
        branch || 'main'
      );

      if (!updateRes.success) {
        setBuildState({
          status: 'failed',
          elapsedSeconds: 0,
          message: 'Failed to update repository files. Please verify your repository exists and PAT has repo access.',
          error: updateRes.error,
        });
        return;
      }

      // Step 2: Trigger GitHub Action workflow
      setBuildState((prev) => ({
        ...prev,
        status: 'triggering',
        message: 'Triggering GitHub Actions workflow runner...',
      }));

      const triggerRes = await triggerBuildWorkflow(
        repoOwner,
        repoName,
        workflowFileName || 'build-apk.yml',
        branch || 'main',
        personalAccessToken
      );

      if (!triggerRes.success) {
        setBuildState({
          status: 'failed',
          elapsedSeconds: 0,
          message: 'Failed to trigger GitHub workflow. Check if build-apk.yml is pushed to your repository.',
          error: triggerRes.error,
        });
        return;
      }

      // Step 3: Queued & waiting
      setBuildState((prev) => ({
        ...prev,
        status: 'queued',
        message: 'Build queued on GitHub runners. Waiting for runner execution...',
      }));

      showToast('🚀 GitHub Actions build started! Monitoring progress...');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown build error';
      setBuildState({
        status: 'failed',
        elapsedSeconds: 0,
        message: 'An unexpected error occurred while initiating build.',
        error: msg,
      });
    }
  };

  const handleDownloadArtifactApk = async () => {
    const { personalAccessToken } = config.github;
    if (!buildState.artifactUrl) return;

    if (buildState.artifactUrl.includes('/artifacts/')) {
      showToast('Downloading compiled APK from GitHub...');
      const downloadName = buildState.artifactName || `${config.identity.appName}.apk`;
      const res = await downloadArtifactWithToken(buildState.artifactUrl, downloadName, personalAccessToken);
      if (!res.success) {
        // Fallback open in tab
        window.open(buildState.runUrl || buildState.artifactUrl, '_blank');
      }
    } else {
      window.open(buildState.artifactUrl, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        onOpenCodeViewer={() => setIsCodeViewerOpen(true)}
        onOpenPushGuide={() => setIsPushGuideOpen(true)}
        onOpenDefaultCodeModal={() => setIsDefaultCodeOpen(true)}
        onDownloadZip={handleDownloadZip}
        isDownloading={isDownloading}
        onSwitchToGitHubTab={() => setActiveTab('github')}
        hasGithubConfig={hasGithubConfig}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 flex flex-col gap-6">
        {/* Realtime Build Status Bar (Visible when a build is triggered/running/finished) */}
        {buildState.status !== 'idle' && (
          <BuildStatusBar
            buildState={buildState}
            onRefreshStatus={() => {
              if (config.github.repoOwner && config.github.repoName && config.github.personalAccessToken) {
                getLatestWorkflowRun(config.github.repoOwner, config.github.repoName, config.github.personalAccessToken)
                  .then((r) => {
                    if (r.success && r.run) {
                      setBuildState((prev) => ({
                        ...prev,
                        runId: r.run.id,
                        runUrl: r.run.html_url,
                        message: `Status: ${r.run.status} (${r.run.conclusion || 'running'})`,
                      }));
                    }
                  });
              }
            }}
            onDownloadApk={handleDownloadArtifactApk}
            onCancelOrReset={() =>
              setBuildState({ status: 'idle', elapsedSeconds: 0, message: '' })
            }
            repoOwner={config.github.repoOwner}
            repoName={config.github.repoName}
          />
        )}

        {/* Quick Info & State Highlights Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400">Current App:</span>
            <span className="font-bold text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
              {config.identity.appName || 'Untitled'}
            </span>
            <span className="text-slate-500 font-mono">({config.identity.packageName})</span>

            <div className="hidden sm:flex items-center gap-1.5 ml-2 text-slate-400">
              <span>•</span>
              <span>Orientation:</span>
              <span className="text-indigo-300 capitalize">{config.orientation.replace('_', ' ')}</span>
              <span>•</span>
              <span>Cache:</span>
              <span className="text-indigo-300 capitalize">{config.cacheMode.replace('_', ' ')}</span>
              <span>•</span>
              <span>Permissions:</span>
              <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                {activePermissionsCount}/10
              </span>
              {config.ads.enabled && (
                <>
                  <span>•</span>
                  <span>Interstitial Ad:</span>
                  <span className="text-amber-400">Every {config.ads.interstitialIntervalMinutes}m</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setIsDefaultCodeOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors font-medium flex items-center gap-1"
            >
              <span>বেস কোড ও গিটহাব গাইড</span>
            </button>
            <button
              onClick={() => setIsPushGuideOpen(true)}
              className="text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors font-medium"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>সাহায্য</span>
            </button>
          </div>
        </div>

        {/* 2-Column Responsive Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Configuration Builder (Tabs & Options) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            <ConfigPanel
              config={config}
              onChange={setConfig}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onOpenPushGuide={() => setIsPushGuideOpen(true)}
              onOpenCodeViewer={() => setIsCodeViewerOpen(true)}
              onOpenDefaultCodeModal={() => setIsDefaultCodeOpen(true)}
              onTriggerBuild={handleStartBuild}
            />
          </div>

          {/* Right Column: Live Android Smartphone Preview & Simulator */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col items-center sticky top-20">
            <div className="w-full mb-2 flex items-center justify-between px-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-indigo-400" />
                Live Android Simulator
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {config.orientation === 'landscape' ? 'Landscape (560x320)' : 'Portrait (320x640)'}
              </span>
            </div>

            <PhoneSimulator
              config={config}
              onOrientationChange={(newOrientation) =>
                setConfig({ ...config, orientation: newOrientation })
              }
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>APK Creator Studio • Modern Android WebView & GitHub Actions CI/CD Builder</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsDefaultCodeOpen(true)}
              className="hover:text-slate-300 transition-colors"
            >
              Base Code & Push Guide
            </button>
            <button
              onClick={() => setIsPushGuideOpen(true)}
              className="hover:text-slate-300 transition-colors"
            >
              GitHub Setup Guide
            </button>
            <button
              onClick={() => setIsCodeViewerOpen(true)}
              className="hover:text-slate-300 transition-colors"
            >
              Source Inspector
            </button>
          </div>
        </div>
      </footer>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-indigo-500/40 text-slate-100 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-medium animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals */}
      <CodeViewerModal
        isOpen={isCodeViewerOpen}
        onClose={() => setIsCodeViewerOpen(false)}
        config={config}
      />

      <PushGuideModal
        isOpen={isPushGuideOpen}
        onClose={() => setIsPushGuideOpen(false)}
        config={config}
        onDownloadZip={handleDownloadZip}
        isDownloading={isDownloading}
      />

      <DefaultCodeModal
        isOpen={isDefaultCodeOpen}
        onClose={() => setIsDefaultCodeOpen(false)}
        config={config}
        onDownloadZip={handleDownloadZip}
        isDownloading={isDownloading}
        onSelectGitHubTab={() => {
          setIsDefaultCodeOpen(false);
          setActiveTab('github');
        }}
      />
    </div>
  );
}
