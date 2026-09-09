import React, { useState } from 'react';
import {
  Smartphone,
  Shield,
  Layers,
  Sparkles,
  Github,
  Globe,
  Image as ImageIcon,
  CheckSquare,
  Sliders,
  Radio,
  Clock,
  Key,
  ExternalLink,
  Copy,
  Check,
  Play,
  RotateCcw,
  Info,
  AlertTriangle,
  FileCode,
  Zap,
  FolderGit2,
} from 'lucide-react';
import { ApkBuildConfig, CacheMode, AppOrientation } from '../types';
import { triggerWorkflowDispatch, verifyGitHubConnection, getWorkflowRuns } from '../services/githubApi';

interface ConfigPanelProps {
  config: ApkBuildConfig;
  onChange: (newConfig: ApkBuildConfig) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenPushGuide: () => void;
  onOpenCodeViewer: () => void;
  onOpenDefaultCodeModal: () => void;
  onTriggerBuild?: () => void;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
  config,
  onChange,
  activeTab,
  setActiveTab,
  onOpenPushGuide,
  onOpenCodeViewer,
  onOpenDefaultCodeModal,
  onTriggerBuild,
}) => {
  const [ghStatus, setGhStatus] = useState<string | null>(null);
  const [ghError, setGhError] = useState<string | null>(null);
  const [isVerifyingGh, setIsVerifyingGh] = useState(false);
  const [isTriggeringBuild, setIsTriggeringBuild] = useState(false);
  const [workflowRuns, setWorkflowRuns] = useState<any[]>([]);
  const [copiedToken, setCopiedToken] = useState(false);

  // Helper updates
  const updateIdentity = (key: keyof ApkBuildConfig['identity'], value: any) => {
    onChange({
      ...config,
      identity: {
        ...config.identity,
        [key]: value,
      },
    });
  };

  const updateFeature = (key: keyof ApkBuildConfig['features'], value: boolean) => {
    onChange({
      ...config,
      features: {
        ...config.features,
        [key]: value,
      },
    });
  };

  const updatePermission = (key: keyof ApkBuildConfig['permissions'], value: boolean) => {
    onChange({
      ...config,
      permissions: {
        ...config.permissions,
        [key]: value,
      },
    });
  };

  const updateAds = (key: keyof ApkBuildConfig['ads'], value: any) => {
    onChange({
      ...config,
      ads: {
        ...config.ads,
        [key]: value,
      },
    });
  };

  const updateGithub = (key: keyof ApkBuildConfig['github'], value: any) => {
    onChange({
      ...config,
      github: {
        ...config.github,
        [key]: value,
      },
    });
  };

  // Handle GitHub verification
  const handleVerifyGithub = async () => {
    const { repoOwner, repoName, personalAccessToken } = config.github;
    if (!repoOwner || !repoName) {
      setGhError('Please enter both GitHub Repository Owner and Repository Name.');
      return;
    }

    setIsVerifyingGh(true);
    setGhError(null);
    setGhStatus('Checking GitHub repository and permissions...');

    const result = await verifyGitHubConnection(repoOwner, repoName, personalAccessToken);
    setIsVerifyingGh(false);

    if (result.success) {
      setGhStatus(`Connected successfully to ${result.repoInfo?.full_name}!`);
      // Also fetch recent runs
      fetchRuns();
    } else {
      setGhError(result.error || 'Failed to verify GitHub repository.');
      setGhStatus(null);
    }
  };

  const fetchRuns = async () => {
    const { repoOwner, repoName, personalAccessToken } = config.github;
    if (repoOwner && repoName) {
      const runsResult = await getWorkflowRuns(repoOwner, repoName, personalAccessToken);
      if (runsResult.success && runsResult.runs) {
        setWorkflowRuns(runsResult.runs);
      }
    }
  };

  const handleTriggerBuild = async () => {
    if (onTriggerBuild) {
      onTriggerBuild();
      return;
    }

    const { repoOwner, repoName, workflowFileName, branch, personalAccessToken } = config.github;
    if (!repoOwner || !repoName) {
      setGhError('Please enter GitHub Repo Owner and Name before triggering build.');
      return;
    }
    if (!personalAccessToken) {
      setGhError('Personal Access Token (PAT) is required to trigger GitHub Actions.');
      return;
    }

    setIsTriggeringBuild(true);
    setGhError(null);
    setGhStatus('Triggering GitHub Actions workflow dispatch...');

    const result = await triggerWorkflowDispatch(
      repoOwner,
      repoName,
      workflowFileName || 'build-apk.yml',
      branch || 'main',
      personalAccessToken
    );

    setIsTriggeringBuild(false);

    if (result.success) {
      setGhStatus('Build triggered! Your APK is compiling on GitHub Actions runners.');
      setTimeout(fetchRuns, 2500);
    } else {
      setGhError(result.error || 'Failed to trigger build. Make sure the code is pushed to GitHub first.');
    }
  };

  const tabs = [
    { id: 'identity', label: 'App Identity', icon: Smartphone, badge: null },
    { id: 'features', label: 'Core Features', icon: CheckSquare, badge: '9' },
    { id: 'cache_orientation', label: 'Cache & Screen', icon: Sliders, badge: null },
    { id: 'ads', label: 'Ads Interval', icon: Sparkles, badge: 'Timer' },
    { id: 'permissions', label: 'Permissions', icon: Shield, badge: '10' },
    { id: 'github', label: 'GitHub CI/CD', icon: Github, badge: 'APK' },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
      {/* Navigation Tabs Header */}
      <div className="flex border-b border-slate-800 bg-slate-950/60 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3.5 text-xs font-semibold whitespace-nowrap transition-all border-b-2 ${
                isActive
                  ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive
                      ? 'bg-indigo-500/20 text-indigo-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="p-5 sm:p-6 flex-1 overflow-y-auto max-h-[720px]">
        {/* ================= IDENTITY TAB ================= */}
        {activeTab === 'identity' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-indigo-400" />
                App Identity & Information
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Configure your Android App Name, Package identifier, target website, and branding graphics.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* App Name */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  App Name (অ্যাপের নাম) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={config.identity.appName}
                  onChange={(e) => updateIdentity('appName', e.target.value)}
                  placeholder="e.g. My Web App"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Package Name */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Package Name (প্যাকেজ নাম) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={config.identity.packageName}
                  onChange={(e) => updateIdentity('packageName', e.target.value.toLowerCase().replace(/[^a-z0-9.]/g, ''))}
                  placeholder="e.g. com.mycompany.webapp"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Target Web URL */}
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Target Website URL (ওয়েবসাইট লিংক যা এপিকেতে লোড হবে) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="url"
                    value={config.identity.targetUrl}
                    onChange={(e) => updateIdentity('targetUrl', e.target.value)}
                    placeholder="https://yourwebsite.com"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Version Name & Version Code (Explicit user requirement) */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Version Name (ভার্সন নেম)
                </label>
                <input
                  type="text"
                  value={config.identity.versionName}
                  onChange={(e) => updateIdentity('versionName', e.target.value)}
                  placeholder="1.0.0"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Version Code (ভার্সন কোড - পূর্ণসংখ্যা)
                </label>
                <input
                  type="number"
                  min="1"
                  value={config.identity.versionCode}
                  onChange={(e) => updateIdentity('versionCode', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Theme Color */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Theme Color (অ্যাপের কালার থিম)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.identity.themeColor}
                    onChange={(e) => updateIdentity('themeColor', e.target.value)}
                    className="w-9 h-9 rounded-lg border border-slate-700 bg-slate-950 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={config.identity.themeColor}
                    onChange={(e) => updateIdentity('themeColor', e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Splash Duration */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Splash Screen Duration (সেকেন্ড)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="6"
                    step="1"
                    value={config.identity.splashDurationSeconds}
                    onChange={(e) => updateIdentity('splashDurationSeconds', parseInt(e.target.value))}
                    className="flex-1 accent-indigo-500"
                  />
                  <span className="text-xs font-mono px-2 py-1 bg-slate-950 rounded border border-slate-800 text-indigo-300">
                    {config.identity.splashDurationSeconds}s
                  </span>
                </div>
              </div>
            </div>

            {/* App Logo & Splash Image Upload / URL Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-800">
              {/* Logo */}
              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                    App Logo Image (লোগো ইনপুট)
                  </label>
                  <img
                    src={config.identity.appLogoUrl}
                    alt="Logo Preview"
                    className="w-7 h-7 rounded-md object-cover border border-slate-700"
                  />
                </div>
                <input
                  type="text"
                  value={config.identity.appLogoUrl}
                  onChange={(e) => updateIdentity('appLogoUrl', e.target.value)}
                  placeholder="https://... image URL"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>PNG or JPEG recommended (512x512)</span>
                  <label className="cursor-pointer text-indigo-400 hover:text-indigo-300 font-medium">
                    Upload Local File
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (evt) => {
                            updateIdentity('appLogoUrl', evt.target?.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Splash Image */}
              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                    Splash Screen Image (স্প্ল্যাশ ইমেজ)
                  </label>
                  <img
                    src={config.identity.splashImageUrl}
                    alt="Splash Preview"
                    className="w-7 h-7 rounded-md object-cover border border-slate-700"
                  />
                </div>
                <input
                  type="text"
                  value={config.identity.splashImageUrl}
                  onChange={(e) => updateIdentity('splashImageUrl', e.target.value)}
                  placeholder="https://... image URL"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Displayed on startup for {config.identity.splashDurationSeconds}s</span>
                  <label className="cursor-pointer text-indigo-400 hover:text-indigo-300 font-medium">
                    Upload Local File
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (evt) => {
                            updateIdentity('splashImageUrl', evt.target?.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= FEATURES TAB (Tickmark options requested) ================= */}
        {activeTab === 'features' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-indigo-400" />
                WebView Features (টিকমার্ক অপশনসমূহ)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Select the exact capabilities and behaviors you want to bundle into your Android APK.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Progress Wheel (Explicitly highlighted by user) */}
              <div className="p-3.5 rounded-xl border border-indigo-500/40 bg-indigo-500/5 hover:bg-indigo-500/10 transition-colors flex items-start gap-3">
                <input
                  type="checkbox"
                  id="feat-progressWheel"
                  checked={config.features.progressWheel}
                  onChange={(e) => updateFeature('progressWheel', e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-indigo-600 accent-indigo-500 cursor-pointer"
                />
                <div>
                  <label htmlFor="feat-progressWheel" className="text-xs font-bold text-white cursor-pointer flex items-center gap-1.5">
                    <span>Progress Wheel (লোডিং হুইল)</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">Essential</span>
                  </label>
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                    পেজ লোডিংয়ের সময় সুন্দর স্পিনার শো করবে এবং পেজ পুরোপুরি লোড হয়ে গেলে স্বয়ংক্রিয়ভাবে সরে যাবে।
                  </p>
                </div>
              </div>

              {/* Custom Tabs (Explicitly highlighted by user) */}
              <div className="p-3.5 rounded-xl border border-indigo-500/40 bg-indigo-500/5 hover:bg-indigo-500/10 transition-colors flex items-start gap-3">
                <input
                  type="checkbox"
                  id="feat-customTabs"
                  checked={config.features.customTabs}
                  onChange={(e) => updateFeature('customTabs', e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-indigo-600 accent-indigo-500 cursor-pointer"
                />
                <div>
                  <label htmlFor="feat-customTabs" className="text-xs font-bold text-white cursor-pointer flex items-center gap-1.5">
                    <span>Custom Tabs (কাস্টম ট্যাব সাপোর্ট)</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">Essential</span>
                  </label>
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                    অ্যাপে কোনো এক্সটার্নাল লিংকে ক্লিক করলে তা মসৃণভাবে Chrome Custom Tabs-এ ওপেন হবে।
                  </p>
                </div>
              </div>

              {/* Text Selection */}
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-950 transition-colors flex items-start gap-3">
                <input
                  type="checkbox"
                  id="feat-textSelection"
                  checked={config.features.textSelection}
                  onChange={(e) => updateFeature('textSelection', e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-indigo-600 accent-indigo-500 cursor-pointer"
                />
                <div>
                  <label htmlFor="feat-textSelection" className="text-xs font-semibold text-slate-200 cursor-pointer">
                    Text Selection (টেক্সট সিলেক্ট অপশন)
                  </label>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    ইউজার ওয়েবপেজের লেখা সিলেক্ট ও কপি করতে পারবে কি না নির্ধারণ করুন।
                  </p>
                </div>
              </div>

              {/* Save Form Data */}
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-950 transition-colors flex items-start gap-3">
                <input
                  type="checkbox"
                  id="feat-saveFormData"
                  checked={config.features.saveFormData}
                  onChange={(e) => updateFeature('saveFormData', e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-indigo-600 accent-indigo-500 cursor-pointer"
                />
                <div>
                  <label htmlFor="feat-saveFormData" className="text-xs font-semibold text-slate-200 cursor-pointer">
                    Save Form Data (ফর্ম ডাটা অটোফিল সেভ)
                  </label>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    ব্যবহারকারীর ইনপুট ফিল্ড ও ফর্ম ডাটা ক্যাশে স্বয়ংক্রিয়ভাবে সংরক্ষণ।
                  </p>
                </div>
              </div>

              {/* Full Screen */}
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-950 transition-colors flex items-start gap-3">
                <input
                  type="checkbox"
                  id="feat-fullScreen"
                  checked={config.features.fullScreen}
                  onChange={(e) => updateFeature('fullScreen', e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-indigo-600 accent-indigo-500 cursor-pointer"
                />
                <div>
                  <label htmlFor="feat-fullScreen" className="text-xs font-semibold text-slate-200 cursor-pointer">
                    Full Screen (ফুল স্ক্রিন মোড)
                  </label>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    অ্যান্ড্রয়েডের স্ট্যাটাস বার ও নেভিগেশন বার লুকিয়ে ইমার্সিভ ফুলস্ক্রিন ডিসপ্লে।
                  </p>
                </div>
              </div>

              {/* Confirm on Exit */}
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-950 transition-colors flex items-start gap-3">
                <input
                  type="checkbox"
                  id="feat-confirmOnExit"
                  checked={config.features.confirmOnExit}
                  onChange={(e) => updateFeature('confirmOnExit', e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-indigo-600 accent-indigo-500 cursor-pointer"
                />
                <div>
                  <label htmlFor="feat-confirmOnExit" className="text-xs font-semibold text-slate-200 cursor-pointer">
                    Confirm on Exit (অ্যাপ বন্ধ করার সময় সতর্কতা)
                  </label>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    ব্যাক বাটন চাপলে সরাসরি বন্ধ না হয়ে "Do you want to exit?" পপআপ দেখাবে।
                  </p>
                </div>
              </div>

              {/* Enable GPS Prompt */}
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-950 transition-colors flex items-start gap-3">
                <input
                  type="checkbox"
                  id="feat-enableGpsPrompt"
                  checked={config.features.enableGpsPrompt}
                  onChange={(e) => updateFeature('enableGpsPrompt', e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-indigo-600 accent-indigo-500 cursor-pointer"
                />
                <div>
                  <label htmlFor="feat-enableGpsPrompt" className="text-xs font-semibold text-slate-200 cursor-pointer">
                    Enable GPS Prompt (জিপিএস পারমিশন প্রম্পট)
                  </label>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    ওয়েবসাইট জিওলোকেশন চাইতে গেলে ডিভাইসে লোকেশন প্রম্পট ডায়লগ দেখাবে।
                  </p>
                </div>
              </div>

              {/* Pull to Refresh */}
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-950 transition-colors flex items-start gap-3">
                <input
                  type="checkbox"
                  id="feat-pullToRefresh"
                  checked={config.features.pullToRefresh}
                  onChange={(e) => updateFeature('pullToRefresh', e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-indigo-600 accent-indigo-500 cursor-pointer"
                />
                <div>
                  <label htmlFor="feat-pullToRefresh" className="text-xs font-semibold text-slate-200 cursor-pointer">
                    Pull to Refresh (টেনে রিলোড)
                  </label>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    SwipeRefreshLayout যুক্ত করবে, যার মাধ্যমে উপর থেকে টানলে পেজ রিলোড হবে।
                  </p>
                </div>
              </div>

              {/* Deep Linking */}
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-950 transition-colors flex items-start gap-3 md:col-span-2">
                <input
                  type="checkbox"
                  id="feat-deepLinking"
                  checked={config.features.deepLinking}
                  onChange={(e) => updateFeature('deepLinking', e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-indigo-600 accent-indigo-500 cursor-pointer"
                />
                <div>
                  <label htmlFor="feat-deepLinking" className="text-xs font-semibold text-slate-200 cursor-pointer">
                    Deep Linking (ডিপ লিঙ্কিং ও ইনটেন্ট হ্যান্ডলার)
                  </label>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    ব্রাউজার বা এসএমএস থেকে সংশ্লিষ্ট ডোমেইন লিঙ্কে ক্লিক করলে সরাসরি আপনার অ্যাপে ওপেন হবে।
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= CACHE & ORIENTATION TAB ================= */}
        {activeTab === 'cache_orientation' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                Cache Mode & Screen Orientation
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Configure offline caching strategy and screen rotation locks for your APK.
              </p>
            </div>

            {/* Cache Mode (Explicit requirement: no cache, default cache, highly cached) */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-200 block">
                Cache Mode Options (ক্যাশে মোড নির্ধারণ করুন):
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'no_cache' as CacheMode,
                    title: 'No Cache',
                    bangla: 'নো ক্যাশে',
                    desc: 'সবসময় তাজা ডাটা সার্ভার থেকে ডাউনলোড করবে (LOAD_NO_CACHE)',
                  },
                  {
                    id: 'default_cache' as CacheMode,
                    title: 'Default Cache',
                    bangla: 'ডিফল্ট ক্যাশে',
                    desc: 'প্রয়োজনে ক্যাশে ব্যবহার করবে ও স্বয়ংক্রিয় সিঙ্ক করবে (LOAD_DEFAULT)',
                  },
                  {
                    id: 'highly_cached' as CacheMode,
                    title: 'Highly Cached',
                    bangla: 'হাইলি ক্যাশড',
                    desc: 'অফলাইন ও দ্রুত লোডিংয়ের জন্য ক্যাশকে অগ্রাধিকার দেয় (LOAD_CACHE_ELSE_NETWORK)',
                  },
                ].map((item) => {
                  const isSelected = config.cacheMode === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => onChange({ ...config, cacheMode: item.id })}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-md'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold">{item.title}</span>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-slate-600'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                      <span className="text-[10px] text-indigo-400 block mb-1">{item.bangla}</span>
                      <p className="text-[11px] text-slate-400 leading-normal">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* App Orientation (Explicit requirement: auto rotate, portrait, landscape) */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <label className="text-xs font-bold text-slate-200 block">
                App Orientation (স্ক্রিন রোটেশন ওরিয়েন্টেশন):
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'auto_rotate' as AppOrientation,
                    title: 'Auto Rotate',
                    bangla: 'অটো রোটেট',
                    desc: 'ডিভাইস সেন্সর অনুযায়ী স্বয়ংক্রিয়ভাবে স্ক্রিন ঘুরে যাবে',
                  },
                  {
                    id: 'portrait' as AppOrientation,
                    title: 'Portrait',
                    bangla: 'পোর্ট্রেট (সোজা)',
                    desc: 'সবসময় উল্লম্ব বা সাধারণ খাড়া মোডে লক থাকবে',
                  },
                  {
                    id: 'landscape' as AppOrientation,
                    title: 'Landscape',
                    bangla: 'ল্যান্ডস্কেপ (শোয়ানো)',
                    desc: 'সবসময় প্রশস্ত বা আনুভূমিক ট্যাবলেট/গেম মোডে লক থাকবে',
                  },
                ].map((item) => {
                  const isSelected = config.orientation === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => onChange({ ...config, orientation: item.id })}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-md'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold">{item.title}</span>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-slate-600'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                      <span className="text-[10px] text-indigo-400 block mb-1">{item.bangla}</span>
                      <p className="text-[11px] text-slate-400 leading-normal">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= ADS SECTION TAB ================= */}
        {activeTab === 'ads' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Ads Configuration (বিজ্ঞাপন ও ইন্টারস্টিশিয়াল সেটিংস)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Configure Google AdMob Interstitial Ad frequency timer and identifiers.
              </p>
            </div>

            {/* Toggle Ads */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">
                  Enable Google AdMob Monetization (বিজ্ঞাপন চালু করুন)
                </span>
                <span className="text-[11px] text-slate-400">
                  Injects Google Play Services Ads SDK into your build gradle.
                </span>
              </div>
              <input
                type="checkbox"
                checked={config.ads.enabled}
                onChange={(e) => updateAds('enabled', e.target.checked)}
                className="w-5 h-5 rounded text-indigo-600 accent-indigo-500 cursor-pointer"
              />
            </div>

            {config.ads.enabled && (
              <div className="space-y-5 p-4 rounded-xl border border-slate-800 bg-slate-950/40">
                {/* Interstitial Ad Interval (Explicit user requirement: interstitial ta koto minute por por show hobe) */}
                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-400" />
                      Interstitial Ad Frequency (ইন্টারস্টিশিয়াল এড কতো মিনিট পর পর শো হবে):
                    </label>
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-mono font-bold text-xs">
                      Every {config.ads.interstitialIntervalMinutes} Minutes
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300">
                    ইউজার যখন অ্যাপ ব্যবহার করবে, ব্যাকগ্রাউন্ড টাইমার প্রতি <strong>{config.ads.interstitialIntervalMinutes} মিনিটে</strong> ফুল-স্ক্রিন ইন্টারস্টিশিয়াল বিজ্ঞাপন লোড ও প্রদর্শন করবে।
                  </p>

                  <div className="flex items-center gap-4 pt-1">
                    <input
                      type="range"
                      min="1"
                      max="30"
                      step="1"
                      value={config.ads.interstitialIntervalMinutes}
                      onChange={(e) =>
                        updateAds('interstitialIntervalMinutes', Math.max(1, parseInt(e.target.value) || 1))
                      }
                      className="flex-1 accent-amber-500 cursor-pointer"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={config.ads.interstitialIntervalMinutes}
                        onChange={(e) =>
                          updateAds('interstitialIntervalMinutes', Math.max(1, parseInt(e.target.value) || 1))
                        }
                        className="w-16 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-center text-amber-300 focus:outline-none focus:border-amber-500"
                      />
                      <span className="text-xs text-slate-400">Min</span>
                    </div>
                  </div>

                  {/* Quick preset buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] text-slate-400">Quick Presets:</span>
                    {[2, 5, 10, 15, 20].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => updateAds('interstitialIntervalMinutes', mins)}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                          config.ads.interstitialIntervalMinutes === mins
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>

                {/* AdMob App ID & Unit ID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      AdMob App ID (এডমব অ্যাপ আইডি)
                    </label>
                    <input
                      type="text"
                      value={config.ads.admobAppId}
                      onChange={(e) => updateAds('admobAppId', e.target.value)}
                      placeholder="ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Interstitial Ad Unit ID (ইন্টারস্টিশিয়াল ইউনিট আইডি)
                    </label>
                    <input
                      type="text"
                      value={config.ads.interstitialAdUnitId}
                      onChange={(e) => updateAds('interstitialAdUnitId', e.target.value)}
                      placeholder="ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Test Mode Note */}
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Info className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <span>Default values use Google's official AdMob test keys so your account won't get banned while testing.</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= PERMISSIONS TAB (10 requested permissions) ================= */}
        {activeTab === 'permissions' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-400" />
                Customize Permissions (অ্যান্ড্রয়েড পারমিশন কাস্টমাইজেশন)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Toggle the exact Android Manifest permissions your app requires.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                {
                  key: 'internet' as keyof ApkBuildConfig['permissions'],
                  label: 'INTERNET',
                  bangla: 'ইন্টারনেট এক্সেস',
                  desc: 'ওয়েবসাইট ও অনলাইন রিসোর্স লোড করার জন্য আবশ্যক।',
                  required: true,
                },
                {
                  key: 'accessNetworkState' as keyof ApkBuildConfig['permissions'],
                  label: 'ACCESS_NETWORK_STATE',
                  bangla: 'নেটওয়ার্ক স্টেট এক্সেস',
                  desc: 'ইন্টারনেট কানেকশন ওয়াইফাই নাকি মোবাইল ডাটা যাচাই।',
                },
                {
                  key: 'accessCoarseLocation' as keyof ApkBuildConfig['permissions'],
                  label: 'ACCESS_COARSE_LOCATION',
                  bangla: 'কোর্স লোকেশন (আনুমানিক)',
                  desc: 'সেল টাওয়ার ও ওয়াইফাই নির্ভর সাধারণ অবস্থান শনাক্ত।',
                },
                {
                  key: 'accessFineLocation' as keyof ApkBuildConfig['permissions'],
                  label: 'ACCESS_FINE_LOCATION',
                  bangla: 'ফাইন লোকেশন (সঠিক জিপিএস)',
                  desc: 'সঠিক জিপিএস পিন-পয়েন্ট লোকেশন রিড করার পারমিশন।',
                },
                {
                  key: 'camera' as keyof ApkBuildConfig['permissions'],
                  label: 'CAMERA',
                  bangla: 'ক্যামেরা এক্সেস',
                  desc: 'কিউআর কোড স্ক্যান, ছবি তোলা বা ওয়েবক্যাম ভিডিওর জন্য।',
                },
                {
                  key: 'readExternalStorage' as keyof ApkBuildConfig['permissions'],
                  label: 'READ_EXTERNAL_STORAGE',
                  bangla: 'রিড এক্সটার্নাল স্টোরেজ',
                  desc: 'ডিভাইস থেকে ফাইল, ছবি বা ডকুমেন্ট আপলোড করার জন্য।',
                },
                {
                  key: 'writeExternalStorage' as keyof ApkBuildConfig['permissions'],
                  label: 'WRITE_EXTERNAL_STORAGE',
                  bangla: 'রাইট এক্সটার্নাল স্টোরেজ',
                  desc: 'ফাইল বা পিডিএফ সরাসরি ডিভাইসে ডাউনলোড করে সেভ করার জন্য।',
                },
                {
                  key: 'recordAudio' as keyof ApkBuildConfig['permissions'],
                  label: 'RECORD_AUDIO',
                  bangla: 'রেকর্ড অডিও (মাইক্রোফোন)',
                  desc: 'ভয়েস সার্চ বা অডিও রেকর্ডিংয়ের পারমিশন।',
                },
                {
                  key: 'modifyAudioSetting' as keyof ApkBuildConfig['permissions'],
                  label: 'MODIFY_AUDIO_SETTINGS',
                  bangla: 'মডিফাই অডিও সেটিংস',
                  desc: 'ভলিউম ও স্পিকার কন্ট্রোল করার পারমিশন।',
                },
                {
                  key: 'vibrate' as keyof ApkBuildConfig['permissions'],
                  label: 'VIBRATE',
                  bangla: 'ভাইব্রেশন পারমিশন',
                  desc: 'নোটিফিকেশন বা বাটনে টাচ ফিডব্যাকের জন্য ভাইব্রেট।',
                },
              ].map((item) => {
                const isChecked = config.permissions[item.key];
                return (
                  <div
                    key={item.key}
                    onClick={() => updatePermission(item.key, !isChecked)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      isChecked
                        ? 'border-indigo-500/60 bg-indigo-500/10'
                        : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}} // handled by parent div
                      className="mt-0.5 w-4 h-4 rounded text-indigo-600 accent-indigo-500 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-slate-200">
                          {item.label}
                        </span>
                        {item.required && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-sans">
                            Recommended
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-indigo-400 block mt-0.5">{item.bangla}</span>
                      <p className="text-[11px] text-slate-400 mt-1 leading-snug">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= GITHUB TAB (Build Automation as requested by user) ================= */}
        {activeTab === 'github' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Github className="w-4 h-4 text-emerald-400" />
                GitHub Actions CI/CD Build Automation (এপিকে বিল্ড অটোমেশন)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Connect your GitHub repository and Personal Access Token (PAT) to trigger cloud compilation of your APK!
              </p>
            </div>

            {/* Instruction Banner in Bengali as user specifically requested */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/80 to-slate-900 border border-indigo-500/30 text-xs text-slate-200 space-y-2">
              <div className="flex items-center justify-between font-bold text-indigo-300">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  সহজ ধাপসমূহ (User Instructions):
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onOpenDefaultCodeModal}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                  >
                    <FolderGit2 className="w-3.5 h-3.5" />
                    বেস কোড ও পুশ গাইড
                  </button>
                  <button
                    type="button"
                    onClick={onOpenPushGuide}
                    className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    গাইড →
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                ১. উপরে <strong>"Download Project (.zip)"</strong> বাটনে ক্লিক করে কোড ডাউনলোড করুন এবং আপনার GitHub Repo-তে পুশ করুন।<br />
                ২. আপনার GitHub Repo Owner (যেমন <code className="text-amber-300">debasispatra105</code>) এবং Repo Name দিন।<br />
                ৩. GitHub Settings থেকে একটি <strong>Personal Access Token (Classic)</strong> তৈরি করে নিচে পেস্ট করুন (যাতে <code>workflow</code> ও <code>repo</code> পারমিশন থাকে)।<br />
                ৪. তারপর <strong>"Trigger APK Build"</strong> বাটন চাপলেই GitHub Actions স্বয়ংক্রিয়ভাবে APK তৈরি করে দেবে!
              </p>
            </div>

            {/* GitHub Credentials Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  GitHub Username / Owner (ইউজারনেম)
                </label>
                <input
                  type="text"
                  value={config.github.repoOwner}
                  onChange={(e) => updateGithub('repoOwner', e.target.value.trim())}
                  placeholder="e.g. debasispatra105"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Repository Name (রেপোজিটরির নাম)
                </label>
                <input
                  type="text"
                  value={config.github.repoName}
                  onChange={(e) => updateGithub('repoName', e.target.value.trim())}
                  placeholder="e.g. my-apk-project"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    Personal Access Token (PAT)
                  </label>
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo,workflow&description=APK+Creator+Studio"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <span>Generate Token on GitHub</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <input
                  type="password"
                  value={config.github.personalAccessToken}
                  onChange={(e) => updateGithub('personalAccessToken', e.target.value.trim())}
                  placeholder="ghp_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Your token is stored only in local browser memory and never uploaded to any third-party server.
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Target Branch
                </label>
                <input
                  type="text"
                  value={config.github.branch || 'main'}
                  onChange={(e) => updateGithub('branch', e.target.value.trim())}
                  placeholder="main"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Workflow File Name
                </label>
                <input
                  type="text"
                  value={config.github.workflowFileName || 'build-apk.yml'}
                  onChange={(e) => updateGithub('workflowFileName', e.target.value.trim())}
                  placeholder="build-apk.yml"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Verification Status & Error Alerts */}
            {ghStatus && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{ghStatus}</span>
              </div>
            )}

            {ghError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{ghError}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                id="btn-verify-github"
                onClick={handleVerifyGithub}
                disabled={isVerifyingGh}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors disabled:opacity-50"
              >
                <Github className="w-4 h-4 text-slate-400" />
                <span>{isVerifyingGh ? 'Verifying...' : 'Verify Connection'}</span>
              </button>

              <button
                type="button"
                id="btn-trigger-build"
                onClick={handleTriggerBuild}
                disabled={isTriggeringBuild}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{isTriggeringBuild ? 'Triggering Actions...' : 'Trigger APK Build (GitHub Actions)'}</span>
              </button>

              <button
                type="button"
                onClick={fetchRuns}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                title="Refresh Workflow Runs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Refresh Runs</span>
              </button>
            </div>

            {/* Recent Workflow Runs List */}
            {workflowRuns.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Recent GitHub Actions Runs:</span>
                  <a
                    href={`https://github.com/${config.github.repoOwner}/${config.github.repoName}/actions`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <span>View all on GitHub</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="space-y-2">
                  {workflowRuns.slice(0, 5).map((run) => {
                    const isSuccess = run.conclusion === 'success';
                    const isRunning = run.status === 'in_progress' || run.status === 'queued';
                    const isFailed = run.conclusion === 'failure';

                    return (
                      <div
                        key={run.id}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <div
                            className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                              isSuccess
                                ? 'bg-emerald-500'
                                : isRunning
                                ? 'bg-amber-400 animate-ping'
                                : isFailed
                                ? 'bg-rose-500'
                                : 'bg-slate-500'
                            }`}
                          />
                          <div className="truncate">
                            <span className="font-semibold text-slate-200 block truncate">
                              {run.name} (#{run.id})
                            </span>
                            <span className="text-[10px] text-slate-500">
                              Branch: {run.head_branch} • {new Date(run.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              isSuccess
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : isRunning
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {run.status === 'completed' ? run.conclusion : run.status}
                          </span>
                          <a
                            href={run.html_url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                            title="View Run on GitHub"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
