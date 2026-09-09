import { ApkBuildConfig } from '../types';

export function generateAndroidManifest(config: ApkBuildConfig): string {
  const { identity, permissions, orientation, features } = config;

  // Permission tags
  const permissionList: string[] = [];
  if (permissions.internet) permissionList.push('    <uses-permission android:name="android.permission.INTERNET" />');
  if (permissions.accessNetworkState) permissionList.push('    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />');
  if (permissions.accessCoarseLocation) permissionList.push('    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />');
  if (permissions.accessFineLocation) permissionList.push('    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />');
  if (permissions.camera) permissionList.push('    <uses-permission android:name="android.permission.CAMERA" />');
  if (permissions.readExternalStorage) permissionList.push('    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />');
  if (permissions.writeExternalStorage) permissionList.push('    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="28" />');
  if (permissions.recordAudio) permissionList.push('    <uses-permission android:name="android.permission.RECORD_AUDIO" />');
  if (permissions.modifyAudioSetting) permissionList.push('    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />');
  if (permissions.vibrate) permissionList.push('    <uses-permission android:name="android.permission.VIBRATE" />');

  // Orientation attribute
  let orientationAttr = 'android:screenOrientation="unspecified"';
  if (orientation === 'portrait') {
    orientationAttr = 'android:screenOrientation="portrait"';
  } else if (orientation === 'landscape') {
    orientationAttr = 'android:screenOrientation="landscape"';
  } else if (orientation === 'auto_rotate') {
    orientationAttr = 'android:screenOrientation="sensor"';
  }

  // Deep linking intent filter
  let domain = 'example.com';
  try {
    const urlObj = new URL(identity.targetUrl);
    domain = urlObj.hostname;
  } catch {
    // fallback
  }

  const deepLinkFilter = features.deepLinking
    ? `
            <!-- Deep Linking Support -->
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="https" android:host="${domain}" />
                <data android:scheme="http" android:host="${domain}" />
                <data android:scheme="app" android:host="${identity.appName.toLowerCase().replace(/[^a-z0-9]/g, '')}" />
            </intent-filter>`
    : '';

  const admobMeta = config.ads.enabled
    ? `
        <!-- AdMob App ID -->
        <meta-data
            android:name="com.google.android.gms.ads.APPLICATION_ID"
            android:value="${config.ads.admobAppId || 'ca-app-pub-3940256099942544~3347511713'}" />`
    : '';

  return `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${identity.packageName}">

${permissionList.join('\n')}

    <!-- Query packages for Custom Tabs -->
    <queries>
        <intent>
            <action android:name="android.support.customtabs.action.CustomTabsService" />
        </intent>
    </queries>

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="${identity.appName}"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:usesCleartextTraffic="true"
        android:theme="@style/Theme.${identity.appName.replace(/[^a-zA-Z0-9]/g, '')}">
${admobMeta}

        <!-- Splash Screen Activity -->
        <activity
            android:name=".SplashActivity"
            android:exported="true"
            ${orientationAttr}
            android:theme="@style/Theme.${identity.appName.replace(/[^a-zA-Z0-9]/g, '')}.NoActionBar">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Main WebView Activity -->
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden"
            ${orientationAttr}
            android:windowSoftInputMode="adjustResize">
${deepLinkFilter}
        </activity>

    </application>

</manifest>`;
}

export function generateMainActivity(config: ApkBuildConfig): string {
  const { identity, features, cacheMode, ads } = config;

  let cacheSetting = 'WebSettings.LOAD_DEFAULT';
  if (cacheMode === 'no_cache') {
    cacheSetting = 'WebSettings.LOAD_NO_CACHE';
  } else if (cacheMode === 'highly_cached') {
    cacheSetting = 'WebSettings.LOAD_CACHE_ELSE_NETWORK';
  }

  const intervalMillis = Math.max(1, ads.interstitialIntervalMinutes) * 60 * 1000;

  return `package ${identity.packageName}

import android.annotation.SuppressLint
import android.content.DialogInterface
import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.webkit.GeolocationPermissions
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.ProgressBar
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.browser.customtabs.CustomTabsIntent
import androidx.core.content.ContextCompat
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
${ads.enabled ? `import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.MobileAds
import com.google.android.gms.ads.interstitial.InterstitialAd
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback` : ''}

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private var swipeRefreshLayout: SwipeRefreshLayout? = null
    private var progressBar: ProgressBar? = null
    private val TARGET_URL = "${identity.targetUrl}"

    ${ads.enabled ? `
    // Interstitial Ads Settings
    private var mInterstitialAd: InterstitialAd? = null
    private val adIntervalMillis: Long = ${intervalMillis}L // Every ${ads.interstitialIntervalMinutes} minute(s)
    private val adHandler = Handler(Looper.getMainLooper())
    private val adRunnable = object : Runnable {
        override fun run() {
            showInterstitialAd()
            adHandler.postDelayed(this, adIntervalMillis)
        }
    }
    ` : ''}

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        ${features.fullScreen ? `
        // Fullscreen Mode
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.insetsController?.let {
                it.hide(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars())
                it.systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            }
        } else {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = (View.SYSTEM_UI_FLAG_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY)
        }
        ` : ''}

        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        progressBar = findViewById(R.id.progressBar)
        swipeRefreshLayout = findViewById(R.id.swipeRefresh)

        setupWebView()
        setupBackNavigation()

        ${ads.enabled ? `
        // Initialize AdMob
        MobileAds.initialize(this) {}
        loadInterstitialAd()
        adHandler.postDelayed(adRunnable, adIntervalMillis)
        ` : ''}

        // Handle Deep Linking or Initial URL
        val appLinkData: Uri? = intent?.data
        if (appLinkData != null) {
            webView.loadUrl(appLinkData.toString())
        } else {
            webView.loadUrl(TARGET_URL)
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        val settings: WebSettings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true

        // Cache Mode Setting
        settings.cacheMode = ${cacheSetting}

        // Save Form Data Setting
        settings.saveFormData = ${features.saveFormData}

        // Text Selection Setting
        ${!features.textSelection ? `
        webView.isHapticFeedbackEnabled = false
        webView.isLongClickable = false
        webView.setOnLongClickListener { true }
        ` : ''}

        // Pull-to-refresh setup
        ${features.pullToRefresh ? `
        swipeRefreshLayout?.setOnRefreshListener {
            webView.reload()
        }
        ` : `
        swipeRefreshLayout?.isEnabled = false
        `}

        // WebChromeClient for Progress Wheel and GPS Prompt
        webView.webChromeClient = object : WebChromeClient() {
            ${features.progressWheel ? `
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                if (newProgress < 100) {
                    progressBar?.visibility = View.VISIBLE
                    progressBar?.progress = newProgress
                } else {
                    progressBar?.visibility = View.GONE
                    swipeRefreshLayout?.isRefreshing = false
                }
            }
            ` : ''}

            ${features.enableGpsPrompt ? `
            override fun onGeolocationPermissionsShowPrompt(
                origin: String?,
                callback: GeolocationPermissions.Callback?
            ) {
                // Auto-grant or prompt for web GPS
                callback?.invoke(origin, true, false)
            }
            ` : ''}
        }

        // WebViewClient for navigation and Custom Tabs
        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                ${features.progressWheel ? `progressBar?.visibility = View.VISIBLE` : ''}
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                ${features.progressWheel ? `progressBar?.visibility = View.GONE` : ''}
                swipeRefreshLayout?.isRefreshing = false

                ${!features.textSelection ? `
                // Inject CSS to disable text selection if unchecked
                webView.evaluateJavascript(
                    "document.documentElement.style.webkitUserSelect='none';document.documentElement.style.userSelect='none';",
                    null
                )
                ` : ''}
            }

            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return false
                val mainHost = Uri.parse(TARGET_URL).host

                // If URL belongs to another domain and Custom Tabs is enabled, open in Custom Tab!
                ${features.customTabs ? `
                if (url.startsWith("http://") || url.startsWith("https://")) {
                    val targetHost = Uri.parse(url).host
                    if (mainHost != null && targetHost != null && !targetHost.contains(mainHost) && !mainHost.contains(targetHost)) {
                        openInCustomTab(url)
                        return true
                    }
                }
                ` : ''}

                if (url.startsWith("tel:") || url.startsWith("mailto:") || url.startsWith("whatsapp:")) {
                    try {
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                        startActivity(intent)
                        return true
                    } catch (e: Exception) {
                        Toast.makeText(this@MainActivity, "Application not found", Toast.LENGTH_SHORT).show()
                    }
                }

                return false
            }
        }
    }

    ${features.customTabs ? `
    private fun openInCustomTab(url: String) {
        try {
            val builder = CustomTabsIntent.Builder()
            builder.setShowTitle(true)
            builder.setDefaultColorSchemeParams(
                androidx.browser.customtabs.CustomTabColorSchemeParams.Builder()
                    .setToolbarColor(ContextCompat.getColor(this, R.color.colorPrimary))
                    .build()
            )
            val customTabsIntent = builder.build()
            customTabsIntent.launchUrl(this, Uri.parse(url))
        } catch (e: Exception) {
            // Fallback inside WebView
            webView.loadUrl(url)
        }
    }
    ` : ''}

    private fun setupBackNavigation() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    ${features.confirmOnExit ? `
                    // Exit Confirmation Dialog
                    AlertDialog.Builder(this@MainActivity)
                        .setTitle("Exit App")
                        .setMessage("Are you sure you want to close this application?")
                        .setPositiveButton("Yes") { _, _ -> finish() }
                        .setNegativeButton("No", null)
                        .show()
                    ` : `
                    finish()
                    `}
                }
            }
        })
    }

    ${ads.enabled ? `
    private fun loadInterstitialAd() {
        val adUnitId = "${ads.interstitialAdUnitId || 'ca-app-pub-3940256099942544/1033173712'}"
        val adRequest = AdRequest.Builder().build()
        InterstitialAd.load(this, adUnitId, adRequest, object : InterstitialAdLoadCallback() {
            override fun onAdLoaded(interstitialAd: InterstitialAd) {
                mInterstitialAd = interstitialAd
            }
            override fun onAdFailedToLoad(loadAdError: LoadAdError) {
                mInterstitialAd = null
            }
        })
    }

    private fun showInterstitialAd() {
        mInterstitialAd?.let {
            it.show(this)
            mInterstitialAd = null
            loadInterstitialAd() // Pre-load next ad
        } ?: run {
            loadInterstitialAd()
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        adHandler.removeCallbacks(adRunnable)
    }
    ` : ''}
}
`;
}

export function generateSplashActivity(config: ApkBuildConfig): string {
  const { identity } = config;
  const durationMillis = Math.max(1, identity.splashDurationSeconds) * 1000;

  return `package ${identity.packageName}

import android.annotation.SuppressLint
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.appcompat.app.AppCompatActivity

@SuppressLint("CustomSplashScreen")
class SplashActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_splash)

        Handler(Looper.getMainLooper()).postDelayed({
            val intent = Intent(this, MainActivity::class.java)
            // Forward deep link intent if present
            if (getIntent().data != null) {
                intent.data = getIntent().data
            }
            startActivity(intent)
            finish()
        }, ${durationMillis}L)
    }
}
`;
}

export function generateActivityMainXml(config: ApkBuildConfig): string {
  const { features } = config;

  return `<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout
    xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:layout_width="match_parent"
    android:layout_height="match_parent">

    <androidx.swiperefreshlayout.widget.SwipeRefreshLayout
        android:id="@+id/swipeRefresh"
        android:layout_width="0dp"
        android:layout_height="0dp"
        app:layout_constraintTop_toTopOf="parent"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintEnd_toEndOf="parent">

        <WebView
            android:id="@+id/webView"
            android:layout_width="match_parent"
            android:layout_height="match_parent" />

    </androidx.swiperefreshlayout.widget.SwipeRefreshLayout>

    ${features.progressWheel ? `
    <!-- Loading Progress Wheel -->
    <ProgressBar
        android:id="@+id/progressBar"
        style="?android:attr/progressBarStyleLarge"
        android:layout_width="60dp"
        android:layout_height="60dp"
        android:indeterminate="true"
        android:indeterminateTint="@color/colorPrimary"
        android:visibility="gone"
        app:layout_constraintTop_toTopOf="parent"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintEnd_toEndOf="parent" />
    ` : ''}

</androidx.constraintlayout.widget.ConstraintLayout>`;
}

export function generateActivitySplashXml(config: ApkBuildConfig): string {
  const { identity } = config;

  return `<?xml version="1.0" encoding="utf-8"?>
<RelativeLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@color/colorPrimary"
    android:gravity="center">

    <ImageView
        android:id="@+id/splashLogo"
        android:layout_width="160dp"
        android:layout_height="160dp"
        android:src="@drawable/splash_graphic"
        android:contentDescription="Splash Graphic"
        android:scaleType="fitCenter" />

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_below="@id/splashLogo"
        android:layout_marginTop="24dp"
        android:text="${identity.appName}"
        android:textColor="#FFFFFF"
        android:textSize="24sp"
        android:textStyle="bold" />

    <ProgressBar
        android:layout_width="32dp"
        android:layout_height="32dp"
        android:layout_alignParentBottom="true"
        android:layout_marginBottom="48dp"
        android:indeterminateTint="#FFFFFF" />

</RelativeLayout>`;
}

export function generateColorsXml(config: ApkBuildConfig): string {
  const colorPrimary = config.identity.themeColor || '#4f46e5';

  return `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="colorPrimary">${colorPrimary}</color>
    <color name="colorPrimaryDark">#312e81</color>
    <color name="colorAccent">#ec4899</color>
</resources>`;
}

export function generateStylesXml(config: ApkBuildConfig): string {
  const sanitizedName = config.identity.appName.replace(/[^a-zA-Z0-9]/g, '');

  return `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.${sanitizedName}" parent="Theme.MaterialComponents.DayNight.NoActionBar">
        <item name="colorPrimary">@color/colorPrimary</item>
        <item name="colorPrimaryVariant">@color/colorPrimaryDark</item>
        <item name="colorOnPrimary">#FFFFFF</item>
        <item name="android:statusBarColor">@color/colorPrimaryDark</item>
    </style>

    <style name="Theme.${sanitizedName}.NoActionBar">
        <item name="windowActionBar">false</item>
        <item name="windowNoTitle">true</item>
        <item name="android:windowFullscreen">true</item>
    </style>
</resources>`;
}

export function generateAppBuildGradle(config: ApkBuildConfig): string {
  const { identity, ads } = config;

  return `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "${identity.packageName}"
    compileSdk = 34

    defaultConfig {
        applicationId = "${identity.packageName}"
        minSdk = 23
        targetSdk = 34
        versionCode = ${identity.versionCode}
        versionName = "${identity.versionName}"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("debug") // Built ready-to-test
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.11.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")
    implementation("androidx.swiperefreshlayout:swiperefreshlayout:1.1.0")
    implementation("androidx.browser:browser:1.8.0")
    ${ads.enabled ? 'implementation("com.google.android.gms:play-services-ads:23.0.0")' : ''}
}
`;
}

export function generateRootBuildGradle(): string {
  return `buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath("com.android.tools.build:gradle:8.2.2")
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:1.9.22")
    }
}

plugins {
    id("com.android.application") version "8.2.2" apply false
    id("org.jetbrains.kotlin.android") version "1.9.22" apply false
}
`;
}

export function generateSettingsGradle(config: ApkBuildConfig): string {
  return `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "${config.identity.appName.replace(/[^a-zA-Z0-9_-]/g, '_')}"
include(":app")
`;
}

export function generateGitHubWorkflow(config: ApkBuildConfig): string {
  return `name: Build Android APK

on:
  push:
    branches: [ "main", "master" ]
  pull_request:
    branches: [ "main", "master" ]
  workflow_dispatch:

jobs:
  build:
    name: Compile & Package APK
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Source Code
        uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: gradle

      - name: Setup Android SDK
        uses: android-actions/setup-android@v3

      - name: Grant execute permission for gradlew
        run: chmod +x gradlew

      - name: Build Debug & Release APK
        run: ./gradlew assembleDebug --stacktrace

      - name: Upload APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: ${config.identity.appName.replace(/[^a-zA-Z0-9_-]/g, '_')}-v${config.identity.versionName}.apk
          path: app/build/outputs/apk/debug/app-debug.apk
          if-no-files-found: error
`;
}

export function generateAppConfigJson(config: ApkBuildConfig): string {
  return JSON.stringify(config, null, 2);
}

export function generateReadme(config: ApkBuildConfig): string {
  const { identity } = config;
  return `# ${identity.appName} - Android WebView APK Project

This Android project was generated by **APK Creator Studio**.

## Project Details
- **App Name**: ${identity.appName}
- **Package Name**: ${identity.packageName}
- **Target URL**: ${identity.targetUrl}
- **Version**: ${identity.versionName} (code: ${identity.versionCode})
- **Orientation**: ${config.orientation}
- **Cache Mode**: ${config.cacheMode}

## How to Build the APK
### Option 1: Automate via GitHub Actions (Recommended)
1. Create a new GitHub repository (e.g. \`https://github.com/your-username/${identity.appName.toLowerCase().replace(/[^a-z0-9]/g, '-')}\`).
2. Push this folder to your repository:
   \`\`\`bash
   git init
   git add .
   git commit -m "Initial APK Project Setup"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   \`\`\`
3. Go to the **Actions** tab in your GitHub repository.
4. The workflow will automatically run and compile the APK!
5. Download the finished **\`${identity.appName.replace(/[^a-zA-Z0-9_-]/g, '_')}-v${identity.versionName}.apk\`** from Artifacts.

### Option 2: Build locally in Android Studio
1. Open Android Studio.
2. Select **Open** and select this directory.
3. Wait for Gradle sync to finish.
4. Click **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
`;
}
