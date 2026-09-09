import React from 'react';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Download,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { BuildProgressState } from '../services/githubBuildManager';

interface BuildStatusBarProps {
  buildState: BuildProgressState;
  onRefreshStatus: () => void;
  onDownloadApk: () => void;
  onCancelOrReset: () => void;
  repoOwner: string;
  repoName: string;
}

export const BuildStatusBar: React.FC<BuildStatusBarProps> = ({
  buildState,
  onRefreshStatus,
  onDownloadApk,
  onCancelOrReset,
  repoOwner,
  repoName,
}) => {
  if (buildState.status === 'idle') return null;

  const isBuilding =
    buildState.status === 'updating_repo' ||
    buildState.status === 'triggering' ||
    buildState.status === 'queued' ||
    buildState.status === 'in_progress';

  const isCompleted = buildState.status === 'completed';
  const isFailed = buildState.status === 'failed';

  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  return (
    <div className="w-full bg-slate-900 border-2 border-indigo-500/50 rounded-2xl p-4 sm:p-5 shadow-2xl animate-in fade-in slide-in-from-top-3 duration-200">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left info */}
        <div className="flex items-start sm:items-center gap-3.5">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${
              isBuilding
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                : isCompleted
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-600/20 text-rose-400 border border-rose-500/30'
            }`}
          >
            {isBuilding && <Loader2 className="w-6 h-6 animate-spin" />}
            {isCompleted && <CheckCircle2 className="w-6 h-6" />}
            {isFailed && <AlertCircle className="w-6 h-6" />}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded text-white bg-indigo-600">
                {isBuilding ? 'Building APK...' : isCompleted ? 'Build Completed!' : 'Build Failed'}
              </span>

              {isBuilding && (
                <span className="flex items-center gap-1 text-xs text-amber-400 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Elapsed: {formatElapsed(buildState.elapsedSeconds)}</span>
                </span>
              )}
            </div>

            <p className="text-xs text-slate-200 mt-1 font-medium leading-relaxed">
              {buildState.message}
            </p>

            {buildState.runUrl && (
              <a
                href={buildState.runUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 hover:underline mt-1 font-mono"
              >
                <span>View GitHub Actions Live Log</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Right actions */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {isBuilding && (
            <button
              onClick={onRefreshStatus}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700 transition-colors"
              title="Refresh status from GitHub"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Status</span>
            </button>
          )}

          {isCompleted && (
            <button
              id="btn-download-built-apk"
              onClick={onDownloadApk}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all transform hover:scale-105 active:scale-95 animate-pulse"
            >
              <Download className="w-4 h-4 text-slate-950" />
              <span>Download APK File (.apk)</span>
            </button>
          )}

          {isFailed && (
            <button
              onClick={onCancelOrReset}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium transition-colors"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>

      {/* Progress visual bar */}
      {isBuilding && (
        <div className="mt-3.5 w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
          <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 h-full rounded-full animate-pulse w-full" />
        </div>
      )}
    </div>
  );
};
