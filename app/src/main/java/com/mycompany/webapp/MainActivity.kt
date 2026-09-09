package com.mycompany.webapp

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
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.MobileAds
import com.google.android.gms.ads.interstitial.InterstitialAd
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private var swipeRefreshLayout: SwipeRefreshLayout? = null
    private var progressBar: ProgressBar? = null
    private val TARGET_URL = "https://example.com"

    
    // Interstitial Ads Settings
    private var mInterstitialAd: InterstitialAd? = null
    private val adIntervalMillis: Long = 300000L // Every 5 minute(s)
    private val adHandler = Handler(Looper.getMainLooper())
    private val adRunnable = object : Runnable {
        override fun run() {
            showInterstitialAd()
            adHandler.postDelayed(this, adIntervalMillis)
        }
    }
    

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        

        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        progressBar = findViewById(R.id.progressBar)
        swipeRefreshLayout = findViewById(R.id.swipeRefresh)

        setupWebView()
        setupBackNavigation()

        
        // Initialize AdMob
        MobileAds.initialize(this) {}
        loadInterstitialAd()
        adHandler.postDelayed(adRunnable, adIntervalMillis)
        

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
        settings.cacheMode = WebSettings.LOAD_DEFAULT

        // Save Form Data Setting
        settings.saveFormData = true

        // Text Selection Setting
        

        // Pull-to-refresh setup
        
        swipeRefreshLayout?.setOnRefreshListener {
            webView.reload()
        }
        

        // WebChromeClient for Progress Wheel and GPS Prompt
        webView.webChromeClient = object : WebChromeClient() {
            
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                if (newProgress < 100) {
                    progressBar?.visibility = View.VISIBLE
                    progressBar?.progress = newProgress
                } else {
                    progressBar?.visibility = View.GONE
                    swipeRefreshLayout?.isRefreshing = false
                }
            }
            

            
            override fun onGeolocationPermissionsShowPrompt(
                origin: String?,
                callback: GeolocationPermissions.Callback?
            ) {
                // Auto-grant or prompt for web GPS
                callback?.invoke(origin, true, false)
            }
            
        }

        // WebViewClient for navigation and Custom Tabs
        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                progressBar?.visibility = View.VISIBLE
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                progressBar?.visibility = View.GONE
                swipeRefreshLayout?.isRefreshing = false

                
            }

            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return false
                val mainHost = Uri.parse(TARGET_URL).host

                // If URL belongs to another domain and Custom Tabs is enabled, open in Custom Tab!
                
                if (url.startsWith("http://") || url.startsWith("https://")) {
                    val targetHost = Uri.parse(url).host
                    if (mainHost != null && targetHost != null && !targetHost.contains(mainHost) && !mainHost.contains(targetHost)) {
                        openInCustomTab(url)
                        return true
                    }
                }
                

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
    

    private fun setupBackNavigation() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    
                    // Exit Confirmation Dialog
                    AlertDialog.Builder(this@MainActivity)
                        .setTitle("Exit App")
                        .setMessage("Are you sure you want to close this application?")
                        .setPositiveButton("Yes") { _, _ -> finish() }
                        .setNegativeButton("No", null)
                        .show()
                    
                }
            }
        })
    }

    
    private fun loadInterstitialAd() {
        val adUnitId = "ca-app-pub-3940256099942544/1033173712"
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
    
}
