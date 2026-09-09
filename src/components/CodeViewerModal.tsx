import React, { useState } from 'react';
import { X, Copy, Check, Download, FileCode, Code2 } from 'lucide-react';
import { ApkBuildConfig } from '../types';
import {
  generateAndroidManifest,
  generateMainActivity,
  generateSplashActivity,
  generateActivityMainXml,
  generateAppBuildGradle,
  generateGitHubWorkflow,
  generateAppConfigJson,
} from '../utils/codeGenerator';

interface CodeViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ApkBuildConfig;
}

export const CodeViewerModal: React.FC<CodeViewerModalProps> = ({
  isOpen,
  onClose,
  config,
}) => {
  const [selectedFile, setSelectedFile] = useState<string>('manifest');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const files: Record<string, { name: string; lang: string; content: string }> = {
    manifest: {
      name: 'AndroidManifest.xml',
      lang: 'xml',
      content: generateAndroidManifest(config),
    },
    mainActivity: {
      name: 'MainActivity.kt',
      lang: 'kotlin',
      content: generateMainActivity(config),
    },
    splashActivity: {
      name: 'SplashActivity.kt',
      lang: 'kotlin',
      content: generateSplashActivity(config),
    },
    layoutMain: {
      name: 'activity_main.xml',
      lang: 'xml',
      content: generateActivityMainXml(config),
    },
    buildGradle: {
      name: 'build.gradle.kts',
      lang: 'kotlin',
      content: generateAppBuildGradle(config),
    },
    workflow: {
      name: '.github/workflows/build-apk.yml',
      lang: 'yaml',
      content: generateGitHubWorkflow(config),
    },
    appConfig: {
      name: 'app-config.json',
      lang: 'json',
      content: generateAppConfigJson(config),
    },
  };

  const activeFile = files[selectedFile] || files.manifest;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCurrent = () => {
    const blob = new Blob([activeFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile.name.split('/').pop() || 'file.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Generated Android Source Code</h3>
              <p className="text-[11px] text-slate-400">
                Ready-to-compile modern Kotlin & AndroidX WebView application code
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Code</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadCurrent}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition-colors"
              title="Download this file"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Download</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* File Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/80 px-2 overflow-x-auto scrollbar-none">
          {Object.entries(files).map(([key, file]) => {
            const isSelected = selectedFile === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedFile(key)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-mono whitespace-nowrap border-b-2 transition-all ${
                  isSelected
                    ? 'border-indigo-500 text-indigo-300 bg-indigo-500/10 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>{file.name}</span>
              </button>
            );
          })}
        </div>

        {/* Code Content View */}
        <div className="flex-1 p-4 bg-slate-950 overflow-auto font-mono text-xs text-slate-300 leading-relaxed select-text">
          <pre className="whitespace-pre">
            <code>{activeFile.content}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
