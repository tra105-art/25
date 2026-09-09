export type CacheMode = 'no_cache' | 'default_cache' | 'highly_cached';

export type AppOrientation = 'auto_rotate' | 'portrait' | 'landscape';

export interface AppIdentity {
  appName: string;
  packageName: string;
  targetUrl: string;
  versionName: string;
  versionCode: number;
  appLogoUrl: string;
  splashImageUrl: string;
  splashDurationSeconds: number;
  themeColor: string;
}

export interface AppFeatures {
  textSelection: boolean;
  saveFormData: boolean;
  fullScreen: boolean;
  confirmOnExit: boolean;
  enableGpsPrompt: boolean;
  pullToRefresh: boolean;
  deepLinking: boolean;
  progressWheel: boolean;
  customTabs: boolean;
}

export interface AppPermissions {
  internet: boolean;
  accessNetworkState: boolean;
  accessCoarseLocation: boolean;
  accessFineLocation: boolean;
  camera: boolean;
  readExternalStorage: boolean;
  writeExternalStorage: boolean;
  recordAudio: boolean;
  modifyAudioSetting: boolean;
  vibrate: boolean;
}

export interface AdsConfig {
  enabled: boolean;
  interstitialIntervalMinutes: number; // Koto minute por por show hobe
  admobAppId: string;
  interstitialAdUnitId: string;
  bannerAdEnabled: boolean;
  bannerAdUnitId: string;
  useTestAds: boolean;
}

export interface GitHubConfig {
  repoOwner: string;
  repoName: string;
  branch: string;
  personalAccessToken: string;
  workflowFileName: string;
}

export interface ApkBuildConfig {
  identity: AppIdentity;
  features: AppFeatures;
  cacheMode: CacheMode;
  orientation: AppOrientation;
  permissions: AppPermissions;
  ads: AdsConfig;
  github: GitHubConfig;
}

export interface GitHubWorkflowRun {
  id: number;
  name: string;
  status: 'queued' | 'in_progress' | 'completed' | 'waiting' | string;
  conclusion: 'success' | 'failure' | 'cancelled' | null | string;
  html_url: string;
  created_at: string;
  head_branch: string;
  artifacts_url: string;
}
