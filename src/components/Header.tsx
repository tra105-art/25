import React from 'react';
import { Smartphone, Download, Code2, Github, Sparkles, BookOpen, FolderGit2 } from 'lucide-react';

interface HeaderProps {
  onOpenCodeViewer: () => void;
  onOpenPushGuide: () => void;
  onOpenDefaultCodeModal: () => void;
  onDownloadZip: () => void;
  isDownloading: boolean;
  onSwitchToGitHubTab: () => void;
  hasGithubConfig: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCodeViewer,
  onOpenPushGuide,
  onOpenDefaultCodeModal,
  onDownloadZip,
  isDownloading,
  onSwitchToGitHubTab,
  hasGithubConfig,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">APK Creator Studio</h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                v2.0 Ready
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Web to Android APK Builder • GitHub Actions CI/CD
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="btn-default-code"
            onClick={onOpenDefaultCodeModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all shadow-sm"
            title="গিটহাবে পুশ করার জন্য বেস কোড ও টার্মিনাল কমান্ড"
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            <span>GitHub Base Code (পুশ কোড)</span>
          </button>

          <button
            id="btn-guide"
            onClick={onOpenPushGuide}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            title="GitHub Push & Build Guide in Bengali"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>গাইড</span>
          </button>

          <button
            id="btn-inspect-code"
            onClick={onOpenCodeViewer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <Code2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Source Code</span>
          </button>

          <button
            id="btn-download-zip"
            onClick={onDownloadZip}
            disabled={isDownloading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-indigo-300 border border-indigo-500/40 hover:border-indigo-400 transition-all shadow-sm disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isDownloading ? 'Generating ZIP...' : 'Download Project (.zip)'}</span>
          </button>

          <button
            id="btn-github-workflow"
            onClick={onSwitchToGitHubTab}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-md ${
              hasGithubConfig
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:brightness-110 shadow-emerald-500/20'
                : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:brightness-110 shadow-indigo-500/25'
            }`}
          >
            <Github className="w-3.5 h-3.5" />
            <span>{hasGithubConfig ? 'Build APK (GitHub)' : 'Connect GitHub'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
