import React, { useState, useEffect } from 'react';
import {
  RotateCw,
  Maximize2,
  RefreshCw,
  ExternalLink,
  X,
  Share2,
  ArrowLeft,
  Wifi,
  Battery,
  Layers,
  Sparkles,
  AlertCircle,
  Play,
  Clock,
  Compass,
  Check,
} from 'lucide-react';
import { ApkBuildConfig } from '../types';

interface PhoneSimulatorProps {
  config: ApkBuildConfig;
  onOrientationChange: (orientation: ApkBuildConfig['orientation']) => void;
}

export const PhoneSimulator: React.FC<PhoneSimulatorProps> = ({
  config,
  onOrientationChange,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showCustomTab, setShowCustomTab] = useState<string | null>(null);
  const [showAdModal, setShowAdModal] = useState(false);
  const [adCountdown, setAdCountdown] = useState(config.ads.interstitialIntervalMinutes * 60);
  const [isPulling, setIsPulling] = useState(false);

  // Synchronize ad countdown when minutes change
  useEffect(() => {
    setAdCountdown(config.ads.interstitialIntervalMinutes * 60);
  }, [config.ads.interstitialIntervalMinutes]);

  // Countdown timer for interstitial ad simulation
  useEffect(() => {
    if (!config.ads.enabled) return;
    const interval = setInterval(() => {
      setAdCountdown((prev) => {
        if (prev <= 1) {
          setShowAdModal(true);
          return config.ads.interstitialIntervalMinutes * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [config.ads.enabled, config.ads.interstitialIntervalMinutes]);

  const triggerPageLoad = () => {
    setIsLoading(true);
    setIsPulling(true);
    setTimeout(() => setIsPulling(false), 500);
    setTimeout(() => {
      setIsLoading(false);
    }, 1400);
  };

  const triggerSplash = () => {
    setShowSplash(true);
    setTimeout(() => {
      setShowSplash(false);
    }, (config.identity.splashDurationSeconds || 2) * 1000);
  };

  const isLandscape = config.orientation === 'landscape';

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Simulation Controls Toolbar */}
      <div className="w-full max-w-sm flex items-center justify-between px-2 py-1.5 bg-slate-800/80 rounded-xl border border-slate-700 text-xs text-slate-300">
        <div className="flex items-center gap-1.5">
          <button
            id="sim-trigger-splash"
            onClick={triggerSplash}
            className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-slate-700 text-indigo-300 hover:text-indigo-200 transition-colors"
            title="Preview Splash Screen"
          >
            <Play className="w-3 h-3" />
            <span>Splash</span>
          </button>
          <button
            id="sim-trigger-load"
            onClick={triggerPageLoad}
            className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-slate-700 text-indigo-300 hover:text-indigo-200 transition-colors"
            title="Simulate Page Loading & Progress Wheel"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Load</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          {config.ads.enabled && (
            <button
              id="sim-test-ad"
              onClick={() => setShowAdModal(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors"
              title="Test Interstitial Ad"
            >
              <Clock className="w-3 h-3" />
              <span>Ad ({formatTime(adCountdown)})</span>
            </button>
          )}

          <button
            id="sim-toggle-orientation"
            onClick={() =>
              onOrientationChange(isLandscape ? 'portrait' : 'landscape')
            }
            className="p-1 rounded-md hover:bg-slate-700 text-slate-300 transition-colors"
            title="Toggle Landscape/Portrait"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Android Device Mockup Frame */}
      <div
        className={`relative transition-all duration-300 shadow-2xl rounded-[40px] border-[10px] border-slate-950 bg-slate-950 overflow-hidden ${
          isLandscape
            ? 'w-[560px] h-[320px]'
            : 'w-[320px] h-[640px]'
        }`}
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255,255,255,0.1)',
        }}
      >
        {/* Device Camera Punch Hole */}
        <div
          className={`absolute z-30 bg-black rounded-full pointer-events-none ${
            isLandscape
              ? 'left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5'
              : 'top-2.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5'
          }`}
        />

        {/* Screen Content Wrapper */}
        <div className="w-full h-full bg-slate-900 flex flex-col relative overflow-hidden select-none">
          {/* Status Bar (hidden if fullScreen enabled) */}
          {!config.features.fullScreen ? (
            <div className="h-6 bg-slate-950/80 backdrop-blur text-slate-300 px-5 flex items-center justify-between text-[11px] font-medium z-20">
              <span>11:05</span>
              <div className="flex items-center gap-1.5">
                <Wifi className="w-3 h-3" />
                <span className="text-[9px] font-bold">5G</span>
                <Battery className="w-3.5 h-3.5" />
              </div>
            </div>
          ) : null}

          {/* App Bar (when not in full splash) */}
          <div
            className="h-11 px-3.5 flex items-center justify-between text-white shadow-md z-10"
            style={{ backgroundColor: config.identity.themeColor || '#4f46e5' }}
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <img
                src={config.identity.appLogoUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=64'}
                alt="App Logo"
                className="w-6 h-6 rounded-md object-cover border border-white/20"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=64';
                }}
              />
              <span className="text-xs font-semibold truncate">
                {config.identity.appName || 'My Web App'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {config.features.pullToRefresh && (
                <button
                  onClick={triggerPageLoad}
                  className="p-1 rounded hover:bg-white/10"
                  title="Pull to Refresh"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Pull to Refresh Indicator Bar */}
          {isPulling && config.features.pullToRefresh && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-25 bg-white text-indigo-600 rounded-full p-1.5 shadow-lg animate-bounce">
              <RefreshCw className="w-4 h-4 animate-spin" />
            </div>
          )}

          {/* Progress Wheel Indicator (User requirement: progress wheel jate page loading hole show hoye ar load hoye gele sore jaye) */}
          {isLoading && config.features.progressWheel && (
            <div className="absolute top-18 left-0 right-0 z-20 flex justify-center items-center pointer-events-none">
              <div className="bg-slate-900/90 text-indigo-400 p-2.5 rounded-full shadow-2xl border border-indigo-500/30 backdrop-blur animate-in fade-in zoom-in duration-150">
                <div
                  className="w-7 h-7 rounded-full border-3 border-indigo-500/30 border-t-indigo-500 animate-spin"
                  style={{ borderTopColor: config.identity.themeColor || '#4f46e5' }}
                />
              </div>
            </div>
          )}

          {/* Simulated Web View Container */}
          <div
            className={`flex-1 bg-slate-950 p-4 relative overflow-y-auto ${
              !config.features.textSelection ? 'select-none' : 'select-text'
            }`}
          >
            <div className="space-y-3.5">
              {/* Web View Address / Host Tag */}
              <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 text-xs">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span>Target WebView URL:</span>
                  <span className="font-mono text-emerald-400">
                    {config.cacheMode.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="text-xs font-mono text-indigo-300 truncate">
                  {config.identity.targetUrl || 'https://example.com'}
                </div>
              </div>

              {/* Sample Web Page Card inside WebView */}
              <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">
                    Welcome to {config.identity.appName}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    v{config.identity.versionName}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  This mobile viewport demonstrates how your website will render inside the generated Android WebView APK.
                </p>

                {/* Form Data Test (if Save Form Data is enabled) */}
                {config.features.saveFormData && (
                  <div className="pt-1">
                    <label className="text-[10px] text-slate-400 block mb-1">
                      Save Form Data / Autofill Demo:
                    </label>
                    <input
                      type="text"
                      placeholder="Username / Email"
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}

                {/* Custom Tabs Demo Link (User requirement: custom tabs jate external link custom tabs a open hoye) */}
                {config.features.customTabs && (
                  <div className="pt-2 border-t border-slate-800">
                    <button
                      id="sim-custom-tab-btn"
                      onClick={() =>
                        setShowCustomTab('https://support.google.com/android')
                      }
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-[11px] text-indigo-300 border border-indigo-500/20 transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <ExternalLink className="w-3 h-3 text-indigo-400" />
                        <span>External Link (Test Custom Tab)</span>
                      </span>
                      <span className="text-[10px] text-slate-400">Opens in Chrome Tab →</span>
                    </button>
                  </div>
                )}

                {/* GPS Prompt demo if enabled */}
                {config.features.enableGpsPrompt && (
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-400/90 bg-emerald-500/10 px-2.5 py-1.5 rounded-lg border border-emerald-500/20">
                    <Compass className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>GPS Auto-Prompt enabled for web geolocation</span>
                  </div>
                )}
              </div>

              {/* Active Permissions Summary List */}
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/60">
                <span className="text-[10px] font-semibold text-slate-400 block mb-1.5 uppercase tracking-wider">
                  Configured App Permissions
                </span>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(config.permissions)
                    .filter(([_, enabled]) => enabled)
                    .map(([perm]) => (
                      <span
                        key={perm}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono"
                      >
                        {perm.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </span>
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* Android Navigation Bar */}
          <div className="h-8 bg-slate-950 flex items-center justify-around text-slate-500 px-6 border-t border-slate-900">
            <button
              onClick={() => {
                if (config.features.confirmOnExit) {
                  setShowExitDialog(true);
                }
              }}
              className="p-1.5 hover:text-slate-200 transition-colors"
              title="Android Back Button (Test Exit Confirmation)"
            >
              <div className="w-2.5 h-2.5 border-l-2 border-b-2 border-current rotate-45 transform" />
            </button>
            <button
              onClick={() => triggerPageLoad()}
              className="p-1.5 hover:text-slate-200 transition-colors"
              title="Home"
            >
              <div className="w-2.5 h-2.5 rounded-full border-2 border-current" />
            </button>
            <button
              className="p-1.5 hover:text-slate-200 transition-colors"
              title="Recent Apps"
            >
              <div className="w-2.5 h-2.5 border-2 border-current rounded-xs" />
            </button>
          </div>

          {/* Simulated Splash Screen Overlay */}
          {showSplash && (
            <div
              className="absolute inset-0 z-40 flex flex-col items-center justify-center p-6 text-white text-center animate-in fade-in duration-200"
              style={{
                backgroundColor: config.identity.themeColor || '#4f46e5',
              }}
            >
              <img
                src={config.identity.splashImageUrl || config.identity.appLogoUrl}
                alt="Splash Graphic"
                className="w-24 h-24 rounded-2xl object-cover shadow-2xl mb-4 border-2 border-white/20"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300';
                }}
              />
              <h2 className="text-base font-bold tracking-tight">
                {config.identity.appName}
              </h2>
              <p className="text-xs text-white/80 mt-1">Starting Application...</p>

              <div className="mt-8">
                <div className="w-6 h-6 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              </div>
            </div>
          )}

          {/* Simulated Chrome Custom Tab Overlay */}
          {showCustomTab && (
            <div className="absolute inset-0 z-40 bg-slate-900 flex flex-col animate-in slide-in-from-bottom duration-300">
              <div
                className="h-12 px-3 flex items-center justify-between text-white"
                style={{ backgroundColor: config.identity.themeColor || '#4f46e5' }}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <button
                    onClick={() => setShowCustomTab(null)}
                    className="p-1 hover:bg-white/10 rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="truncate text-xs font-semibold">
                    <span>Chrome Custom Tab</span>
                    <span className="block text-[10px] font-normal text-white/80 truncate">
                      {showCustomTab}
                    </span>
                  </div>
                </div>
                <Share2 className="w-4 h-4 text-white/80" />
              </div>

              <div className="flex-1 bg-white p-4 text-slate-800 flex flex-col items-center justify-center text-center">
                <ExternalLink className="w-10 h-10 text-indigo-600 mb-2" />
                <h3 className="text-xs font-bold text-slate-900">Custom Tabs Opened</h3>
                <p className="text-[11px] text-slate-500 mt-1 px-4">
                  External links open within Chrome Custom Tabs to preserve user session and provide smooth Android in-app browsing.
                </p>
                <button
                  onClick={() => setShowCustomTab(null)}
                  className="mt-4 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium"
                >
                  Close Custom Tab
                </button>
              </div>
            </div>
          )}

          {/* Simulated Exit Confirmation Dialog */}
          {showExitDialog && (
            <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 w-full max-w-xs shadow-2xl text-slate-200">
                <h4 className="text-xs font-bold text-white mb-1">Exit App</h4>
                <p className="text-[11px] text-slate-300 mb-4">
                  Are you sure you want to close this application?
                </p>
                <div className="flex items-center justify-end gap-2 text-xs">
                  <button
                    onClick={() => setShowExitDialog(false)}
                    className="px-3 py-1 rounded-md text-slate-400 hover:text-white"
                  >
                    No
                  </button>
                  <button
                    onClick={() => {
                      setShowExitDialog(false);
                      triggerSplash();
                    }}
                    className="px-3 py-1 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-500"
                  >
                    Yes (Exit)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Simulated Interstitial Ad Popup (Every X minutes) */}
          {showAdModal && (
            <div className="absolute inset-0 z-50 bg-slate-950/95 flex flex-col animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-3 border-b border-slate-800">
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                  AdMob Interstitial Ad
                </span>
                <button
                  onClick={() => setShowAdModal(false)}
                  className="p-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300"
                  title="Close Ad"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg mb-3">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">
                  Full-Screen Interstitial Ad
                </h3>
                <p className="text-xs text-slate-400 max-w-xs mb-4">
                  Showing automatically every{' '}
                  <strong className="text-amber-400">
                    {config.ads.interstitialIntervalMinutes} minute(s)
                  </strong>{' '}
                  as configured.
                </p>
                <div className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                  Unit: {config.ads.interstitialAdUnitId}
                </div>

                <button
                  onClick={() => setShowAdModal(false)}
                  className="mt-6 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors shadow-md"
                >
                  Close Advertisement (Skip)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="text-[11px] text-slate-400 text-center max-w-xs">
        Interactive Android simulator reflects your chosen permissions, progress wheel, pull to refresh, and ad timers in real-time.
      </p>
    </div>
  );
};
