import React, { useState } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  FolderGit2,
  Terminal,
  Sparkles,
  Github,
} from 'lucide-react';
import { ApkBuildConfig } from '../types';

interface DefaultCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ApkBuildConfig;
  onDownloadZip: () => void;
  isDownloading: boolean;
  onSelectGitHubTab: () => void;
}

export const DefaultCodeModal: React.FC<DefaultCodeModalProps> = ({
  isOpen,
  onClose,
  config,
  onDownloadZip,
  isDownloading,
  onSelectGitHubTab,
}) => {
  const [copiedGit, setCopiedGit] = useState(false);

  if (!isOpen) return null;

  const repoPlaceholder =
    config.github.repoOwner && config.github.repoName
      ? `https://github.com/${config.github.repoOwner}/${config.github.repoName}.git`
      : 'https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git';

  const gitSnippet = `# 1. Download & extract the zip file
# 2. Open terminal in the extracted folder:
git init
git add .
git commit -m "Initial APK Creator Project Setup"
git branch -M main
git remote add origin ${repoPlaceholder}
git push -u origin main`;

  const handleCopyGit = () => {
    navigator.clipboard.writeText(gitSnippet);
    setCopiedGit(true);
    setTimeout(() => setCopiedGit(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Default Base Code for GitHub Repository
              </h3>
              <p className="text-[11px] text-slate-400">
                এই কোডটি প্রথমে আপনার GitHub Repo-তে পুশ করে দিন
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {/* Explanation Banner */}
          <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 space-y-2">
            <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              কীভাবে কাজ করবে?
            </span>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              ১. নিচে দেওয়া <strong>&quot;Download Base Repository (.zip)&quot;</strong> বাটনে ক্লিক করে বেস কোডটি ডাউনলোড করুন।<br />
              ২. আপনার GitHub-এ একটি নতুন Repository খুলে কোডটি পুশ করে দিন।<br />
              ৩. এরপর এই অ্যাপে এসে আপনার <strong>Repository Link</strong> এবং <strong>Personal Access Token (PAT)</strong> দিন।<br />
              ৪. আপনি যেকোনো সময় যেকোনো সেটিংস পরিবর্তন করে <strong>&quot;BUILD APK NOW&quot;</strong> ক্লিক করলেই ব্যাকগ্রাউন্ডে GitHub Actions রান করবে, প্রসেসিং শো হবে এবং শেষে সরাসরি <strong>Download APK</strong> বাটন চলে আসবে!
            </p>
          </div>

          {/* Action 1: Download Base Code */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="font-bold text-white block text-xs">
                ধাপ ১: বেস প্রজেক্ট জিপ ডাউনলোড করুন
              </span>
              <span className="text-[11px] text-slate-400">
                Kotlin, Gradle 8.5, AndroidX, Custom Tabs, AdMob এবং .github/workflows/build-apk.yml সহ রেডি টেমপ্লেট
              </span>
            </div>

            <button
              id="btn-modal-download-base-zip"
              onClick={onDownloadZip}
              disabled={isDownloading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all flex-shrink-0 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloading ? 'Generating ZIP...' : 'Download Base Repository (.zip)'}</span>
            </button>
          </div>

          {/* Action 2: Push Commands */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-emerald-400" />
                ধাপ ২: GitHub Repo-তে পুশ করার টার্মিনাল কমান্ড
              </span>

              <button
                onClick={handleCopyGit}
                className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300"
              >
                {copiedGit ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Commands</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-400 select-text leading-relaxed overflow-x-auto">
              <pre>{gitSnippet}</pre>
            </div>
          </div>

          {/* Action 3: Where to put Repo & PAT */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="font-bold text-white block text-xs">
                ধাপ ৩: পুশ শেষ হলে রেপো ও টোকেন সেট করুন
              </span>
              <span className="text-[11px] text-slate-400">
                GitHub CI/CD ট্যাবে আপনার Repo Name এবং Personal Access Token দিয়ে রাখুন।
              </span>
            </div>

            <button
              onClick={() => {
                onClose();
                onSelectGitHubTab();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 font-semibold text-xs transition-colors flex-shrink-0"
            >
              <Github className="w-4 h-4" />
              <span>Configure GitHub CI/CD Tab →</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
