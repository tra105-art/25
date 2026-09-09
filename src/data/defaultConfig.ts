import { ApkBuildConfig } from '../types';

export const defaultApkConfig: ApkBuildConfig = {
  identity: {
    appName: 'My Web App',
    packageName: 'com.mycompany.webapp',
    targetUrl: 'https://example.com',
    versionName: '1.0.0',
    versionCode: 1,
    appLogoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=256&auto=format&fit=crop&q=80',
    splashImageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
    splashDurationSeconds: 2,
    themeColor: '#4f46e5',
  },
  features: {
    textSelection: true,
    saveFormData: true,
    fullScreen: false,
    confirmOnExit: true,
    enableGpsPrompt: true,
    pullToRefresh: true,
    deepLinking: true,
    progressWheel: true,
    customTabs: true,
  },
  cacheMode: 'default_cache',
  orientation: 'auto_rotate',
  permissions: {
    internet: true,
    accessNetworkState: true,
    accessCoarseLocation: true,
    accessFineLocation: true,
    camera: false,
    readExternalStorage: false,
    writeExternalStorage: false,
    recordAudio: false,
    modifyAudioSetting: false,
    vibrate: true,
  },
  ads: {
    enabled: true,
    interstitialIntervalMinutes: 5,
    admobAppId: 'ca-app-pub-3940256099942544~3347511713', // Google official sample AdMob App ID
    interstitialAdUnitId: 'ca-app-pub-3940256099942544/1033173712', // Google sample Interstitial
    bannerAdEnabled: false,
    bannerAdUnitId: 'ca-app-pub-3940256099942544/6300978111',
    useTestAds: true,
  },
  github: {
    repoOwner: '',
    repoName: '',
    branch: 'main',
    personalAccessToken: '',
    workflowFileName: 'build-apk.yml',
  },
};
