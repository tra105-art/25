import React, { useState } from 'react';
import { X, Copy, Check, Download, ExternalLink, Github, Terminal, Key, ShieldCheck, Zap } from 'lucide-react';
import { ApkBuildConfig } from '../types';

interface PushGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ApkBuildConfig;
  onDownloadZip: () => void;
  isDownloading: boolean;
}

export const PushGuideModal: React.FC<PushGuideModalProps> = ({
  isOpen,
  onClose,
  config,
  onDownloadZip,
  isDownloading,
}) => {
  const [copiedCommand, setCopiedCommand] = useState(false);

  if (!isOpen) return null;

  const repoPlaceholder = config.github.repoOwner && config.github.repoName
    ? `https://github.com/${config.github.repoOwner}/${config.github.repoName}.git`
    : `https://github.com/your-username/${config.identity.appName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.git`;

  const gitCommands = `# ১. প্রজেক্ট ZIP ডাউনলোড করে যেকোনো ফোল্ডারে আনজিপ (Extract) করুন
# ২. টার্মিনাল / Command Prompt খুলে সেই ফোল্ডারে যান:
git init
git add .
git commit -m "Initial Android WebView APK Project"
git branch -M main
git remote add origin ${repoPlaceholder}
git push -u origin main`;

  const handleCopyCommands = () => {
    navigator.clipboard.writeText(gitCommands);
    setCopiedCommand(true);
    setTimeout(() => setCopiedCommand(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Github className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                GitHub Push & APK Build সম্পূর্ণ গাইডলাইন
              </h3>
              <p className="text-[11px] text-slate-400">
                কীভাবে কোড পুশ করবেন এবং Personal Access Token দিয়ে APK তৈরি করবেন
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
        <div className="p-5 overflow-y-auto space-y-6 text-xs text-slate-300">
          {/* Quick Action: Download */}
          <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-indigo-300 block">
                ধাপ ১: সম্পূর্ণ সোর্স কোড ডাউনলোড করুন
              </span>
              <p className="text-[11px] text-slate-300 mt-0.5">
                আপনার কনফিগারেশন অনুযায়ী Android Studio ও GitHub Actions সহ সম্পূর্ণ রেডি প্রজেক্ট জিপ তৈরি হবে।
              </p>
            </div>
            <button
              onClick={onDownloadZip}
              disabled={isDownloading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all flex-shrink-0 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloading ? 'তৈরি হচ্ছে...' : 'Download Project (.zip)'}</span>
            </button>
          </div>

          {/* Step 2: Push to GitHub */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                ধাপ ২: GitHub-এ কোড পুশ করার নির্দেশিকা
              </span>
              <button
                onClick={handleCopyCommands}
                className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300"
              >
                {copiedCommand ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy All Commands</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-slate-400">
              GitHub-এ গিয়ে একটি নতুন Repository তৈরি করুন (Public অথবা Private)। তারপর টার্মিনাল খুলে নিচের কমান্ডগুলো রান করুন:
            </p>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-400 select-text leading-relaxed overflow-x-auto">
              <pre>{gitCommands}</pre>
            </div>
          </div>

          {/* Step 3: Generate PAT */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" />
                ধাপ ৩: Personal Access Token (PAT) সংগ্রহ
              </span>
              <a
                href="https://github.com/settings/tokens/new?scopes=repo,workflow&description=APK+Creator+Studio"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>সরাসরি Token পেজ ওপেন করুন</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300">
                <li>
                  GitHub একাউন্টে লগইন করে <strong>Settings &gt; Developer settings &gt; Personal access tokens &gt; Tokens (classic)</strong>-এ যান।
                </li>
                <li>
                  <strong>Generate new token (classic)</strong> ক্লিক করুন।
                </li>
                <li>
                  নিচের দুটি পারমিশনে টিকমার্ক দিন:
                  <ul className="list-disc list-inside pl-4 text-amber-300 font-mono text-[10px] mt-1 space-y-0.5">
                    <li>✓ <strong>repo</strong> (Full control of private repositories)</li>
                    <li>✓ <strong>workflow</strong> (Update GitHub Action workflows)</li>
                  </ul>
                </li>
                <li>
                  <strong>Generate token</strong> বাটনে ক্লিক করে টোকেনটি কপি করুন (<code className="text-emerald-400">ghp_...</code> দিয়ে শুরু হবে)।
                </li>
              </ol>
            </div>
          </div>

          {/* Step 4: Build APK */}
          <div className="space-y-2.5">
            <span className="font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-400" />
              ধাপ ৪: এই অ্যাপে টোকেন বসিয়ে সরাসরি APK বিল্ড করুন
            </span>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 space-y-1.5">
              <p>
                ১. আমাদের এই অ্যাপের <strong>"GitHub CI/CD"</strong> ট্যাবে যান।<br />
                ২. আপনার GitHub Username ও Repo Name ইনপুট দিন।<br />
                ৩. Personal Access Token (PAT) বক্সে কপি করা টোকেনটি পেস্ট করুন।<br />
                ৪. <strong>"Trigger APK Build"</strong> ক্লিক করুন। GitHub Actions ক্লাউড সার্ভারে অ্যান্ড্রয়েড এসডিকে ও গ্র্যাডল দিয়ে APK কম্পাইল করে আপনাকে সরাসরি ডাউনলোড লিংক দিয়ে দেবে!
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors"
          >
            বুঝেছি, বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
