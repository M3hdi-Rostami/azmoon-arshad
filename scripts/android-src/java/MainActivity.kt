package ir.superextension.azmoonarshad

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.view.View
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import org.json.JSONObject
import java.io.File
import java.lang.ref.WeakReference

class MainActivity : Activity() {
    private lateinit var webView: WebView
    @Volatile
    private var updateSheetOpen = false
    private var pendingInstallPermission = false

    companion object {
        private var activityRef: WeakReference<MainActivity>? = null

        fun onApkInstallPendingUserAction() {
            activityRef?.get()?.notifyApkInstallProgress(
                JSONObject().apply {
                    put("percent", 100)
                    put("done", 1)
                    put("total", 1)
                    put("label", "در انتظار تأیید نصب...")
                },
            )
        }

        fun onApkInstallFinished(success: Boolean, message: String) {
            activityRef?.get()?.notifyApkInstallComplete(success, message)
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        activityRef = WeakReference(this)

        applySystemBars("dark")

        webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.allowFileAccess = true
            setBackgroundColor(Color.parseColor("#111621"))
            addJavascriptInterface(ThemeBridge(), "AndroidTheme")
            addJavascriptInterface(AppBridge(), "AndroidApp")
        }

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return false
                if (url.startsWith("https://t.me/") || url.startsWith("http://t.me/")) {
                    startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                    return true
                }
                return false
            }
        }

        loadAzmoonPage()
        setContentView(webView)
    }

    private fun loadAzmoonPage() {
        AzmoonUpdater.clearUpdatedContentIfApkUpgraded(this)
        val updatedHtml = File(AzmoonUpdater.updateDir(this), "azmoon-arshad.html")

        if (updatedHtml.exists()) {
            webView.loadUrl("file://${updatedHtml.absolutePath}")
            return
        }

        val html = assets.open("azmoon-arshad.html").bufferedReader().use { it.readText() }
        webView.loadDataWithBaseURL("file:///android_asset/", html, "text/html", "UTF-8", null)
    }

    override fun onResume() {
        super.onResume()
        activityRef = WeakReference(this)
        if (pendingInstallPermission && canInstallPackages()) {
            pendingInstallPermission = false
            notifyApkInstallComplete(
                success = false,
                message = "مجوز نصب فعال شد. دوباره «دریافت نسخه جدید» را بزنید.",
                retryable = true,
            )
        }
    }

    override fun onDestroy() {
        if (activityRef?.get() === this) {
            activityRef = null
        }
        super.onDestroy()
    }

    private fun applySystemBars(theme: String) {
        val isLight = theme == "light"
        val bg = if (isLight) "#f1f5f9" else "#111621"
        val color = Color.parseColor(bg)

        window.apply {
            clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS)
            addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS)
            statusBarColor = color
            navigationBarColor = color
        }

        var flags = window.decorView.systemUiVisibility
        flags = if (isLight) {
            flags or View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR
        } else {
            flags and View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR.inv()
        }
        window.decorView.systemUiVisibility = flags

        if (::webView.isInitialized) {
            webView.setBackgroundColor(color)
        }
    }

    private fun canInstallPackages(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            packageManager.canRequestPackageInstalls()
        } else {
            true
        }
    }

    private fun requestInstallPermission() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        pendingInstallPermission = true
        val intent = Intent(
            Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
            Uri.parse("package:$packageName"),
        )
        startActivity(intent)
    }

    private fun notifyApkInstallProgress(payload: JSONObject) {
        if (!::webView.isInitialized) return
        runOnUiThread {
            webView.evaluateJavascript(
                "window.__onAppUpdateProgress && window.__onAppUpdateProgress(${payload});",
                null,
            )
        }
    }

    private fun notifyApkInstallComplete(
        success: Boolean,
        message: String,
        retryable: Boolean = !success,
    ) {
        if (!::webView.isInitialized) return
        val payload = JSONObject().apply {
            put("success", success)
            put("message", message)
            put("updateKind", "apk")
            put("reloaded", false)
            put("awaitingInstall", false)
            put("currentVersion", ApkUpdater.localVersionName(this@MainActivity))
            put("latestVersion", ApkUpdater.localVersionName(this@MainActivity))
            put("retryable", retryable)
        }
        runOnUiThread {
            webView.evaluateJavascript(
                "window.__onAppUpdateComplete && window.__onAppUpdateComplete($payload);",
                null,
            )
        }
    }

    private inner class ThemeBridge {
        @JavascriptInterface
        fun onThemeChanged(theme: String) {
            runOnUiThread { applySystemBars(theme) }
        }
    }

    private inner class AppBridge {
        @JavascriptInterface
        fun getContentVersion(): String {
            return ApkUpdater.localVersionName(this@MainActivity)
        }

        @JavascriptInterface
        fun getAppVersionCode(): Int {
            return ApkUpdater.localVersionCode(this@MainActivity)
        }

        @JavascriptInterface
        fun hasUpdatedContent(): Boolean {
            return AzmoonUpdater.hasUpdatedContent(this@MainActivity)
        }

        @JavascriptInterface
        fun setUpdateSheetOpen(open: Boolean) {
            updateSheetOpen = open
        }

        @JavascriptInterface
        fun checkForAppUpdate(repoOwner: String, repoName: String, branch: String) {
            Thread {
                val payload = try {
                    val result = AzmoonUpdater.checkForUpdate(
                        this@MainActivity,
                        repoOwner,
                        repoName,
                        branch,
                    )
                    JSONObject().apply {
                        put("success", true)
                        put("hasUpdate", result.hasUpdate)
                        put("updateKind", result.updateKind)
                        put("currentVersion", result.currentVersion)
                        put("latestVersion", result.latestVersion)
                    }
                } catch (error: Exception) {
                    JSONObject().apply {
                        put("success", false)
                        put("hasUpdate", false)
                        put("updateKind", "none")
                        put("message", error.message ?: "خطا در بررسی بروزرسانی")
                    }
                }

                runOnUiThread {
                    val jsPayload = payload.toString()
                    webView.evaluateJavascript(
                        "window.__onAppUpdateCheckComplete && window.__onAppUpdateCheckComplete($jsPayload);",
                        null,
                    )
                }
            }.start()
        }

        @JavascriptInterface
        fun startAppUpdate(repoOwner: String, repoName: String, branch: String) {
            Thread {
                try {
                    val check = AzmoonUpdater.checkForUpdate(
                        this@MainActivity,
                        repoOwner,
                        repoName,
                        branch,
                    )

                    if (check.updateKind == "apk" && !canInstallPackages()) {
                        runOnUiThread { requestInstallPermission() }
                        val payload = JSONObject().apply {
                            put("success", false)
                            put("message", "لطفاً اجازه نصب از این منبع را فعال کنید و دوباره تلاش کنید.")
                            put("updateKind", "apk")
                            put("currentVersion", check.currentVersion)
                            put("latestVersion", check.latestVersion)
                            put("reloaded", false)
                            put("awaitingInstall", false)
                            put("needsInstallPermission", true)
                        }
                        runOnUiThread {
                            webView.evaluateJavascript(
                                "window.__onAppUpdateComplete && window.__onAppUpdateComplete($payload);",
                                null,
                            )
                        }
                        return@Thread
                    }

                    val result = AzmoonUpdater.fetchAndApply(
                        this@MainActivity,
                        repoOwner,
                        repoName,
                        branch,
                    ) { percent, done, total, label ->
                        notifyApkInstallProgress(
                            JSONObject().apply {
                                put("percent", percent)
                                put("done", done)
                                put("total", total)
                                put("label", label)
                            },
                        )
                    }

                    val payload = JSONObject().apply {
                        put("success", result.success)
                        put("message", result.message)
                        put("currentVersion", result.currentVersion)
                        put("latestVersion", result.latestVersion)
                        put("updateKind", result.updateKind)
                        put("reloaded", result.reloaded)
                        put("awaitingInstall", result.awaitingInstall)
                    }

                    runOnUiThread {
                        val jsPayload = payload.toString()
                        webView.evaluateJavascript(
                            "window.__onAppUpdateComplete && window.__onAppUpdateComplete($jsPayload);",
                            null,
                        )
                        if (result.reloaded) {
                            webView.postDelayed({ loadAzmoonPage() }, 650L)
                        }
                    }
                } catch (error: Exception) {
                    val payload = JSONObject().apply {
                        put("success", false)
                        put("message", error.message ?: "خطا در بروزرسانی")
                        put("currentVersion", ApkUpdater.localVersionName(this@MainActivity))
                        put("latestVersion", ApkUpdater.localVersionName(this@MainActivity))
                        put("updateKind", "apk")
                        put("reloaded", false)
                        put("awaitingInstall", false)
                    }
                    runOnUiThread {
                        webView.evaluateJavascript(
                            "window.__onAppUpdateComplete && window.__onAppUpdateComplete($payload);",
                            null,
                        )
                    }
                }
            }.start()
        }

        @JavascriptInterface
        fun reloadApp() {
            runOnUiThread { loadAzmoonPage() }
        }
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (updateSheetOpen) {
            return
        }
        // ابتدا به صفحه وب فرصت می‌دهیم بازگشت را خودش مدیریت کند
        // (مثلاً بستن آزمون در جریان با تأیید کاربر)
        webView.evaluateJavascript(
            "window.__handleAndroidBack ? window.__handleAndroidBack() : false",
        ) { handled ->
            if (handled != "true") {
                runOnUiThread {
                    @Suppress("DEPRECATION")
                    super.onBackPressed()
                }
            }
        }
    }
}
