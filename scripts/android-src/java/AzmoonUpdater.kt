package ir.superextension.azmoonarshad

import android.content.Context
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

data class UpdateResult(
    val success: Boolean,
    val message: String,
    val currentVersion: String,
    val latestVersion: String,
    val updateKind: String = "content",
    val reloaded: Boolean = false,
    val awaitingInstall: Boolean = false,
)

data class UpdateCheckResult(
    val hasUpdate: Boolean,
    val updateKind: String,
    val currentVersion: String,
    val latestVersion: String,
)

object AzmoonUpdater {
    private const val PREFS_NAME = "azmoon_arshad"
    private const val KEY_CONTENT_VERSION = "content_version"
    private const val KEY_CONTENT_BUILT_AT = "content_built_at"
    private const val KEY_LAST_APK_VERSION_CODE = "last_apk_version_code"
    private const val KEY_PENDING_CONTENT_VERSION = "pending_content_version"
    private const val KEY_PENDING_CONTENT_BUILT_AT = "pending_content_built_at"

    fun updateDir(context: Context): File = File(context.filesDir, "azmoon-arshad")

    fun bundledVersion(context: Context): String = readLocalMeta(context).version

    fun installedVersion(context: Context): String {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getString(KEY_CONTENT_VERSION, null) ?: bundledVersion(context)
    }

    fun installedBuiltAt(context: Context): String? {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getString(KEY_CONTENT_BUILT_AT, null) ?: readLocalMeta(context).builtAt
    }

    fun hasUpdatedContent(context: Context): Boolean {
        return File(updateDir(context), "azmoon-arshad.html").exists()
    }

    /**
     * Remember the remote content stamp that belonged to the APK we are about to install.
     * After install, [clearUpdatedContentIfApkUpgraded] adopts this stamp so the user is not
     * prompted again for a content-only update that was already shipped inside that APK.
     */
    fun markPendingContentAfterApkInstall(context: Context, version: String, builtAt: String?) {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_PENDING_CONTENT_VERSION, version)
            .putString(KEY_PENDING_CONTENT_BUILT_AT, builtAt)
            .apply()
    }

    /**
     * When the native APK is upgraded, discard previously downloaded web content
     * so the fresh assets bundled in the new APK are loaded (not an old cache).
     * Also mark bundled content as current so an older remote HTML is not re-applied.
     */
    fun clearUpdatedContentIfApkUpgraded(context: Context) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val currentCode = ApkUpdater.localVersionCode(context)
        val lastCode = prefs.getInt(KEY_LAST_APK_VERSION_CODE, -1)
        if (lastCode == currentCode) return

        val dir = updateDir(context)
        if (dir.exists()) {
            dir.deleteRecursively()
        }

        val bundled = readBundledMeta(context)
        val pendingVersion = prefs.getString(KEY_PENDING_CONTENT_VERSION, null)?.ifBlank { null }
        val pendingBuiltAt = prefs.getString(KEY_PENDING_CONTENT_BUILT_AT, null)?.ifBlank { null }

        prefs.edit()
            .putInt(KEY_LAST_APK_VERSION_CODE, currentCode)
            .putString(KEY_CONTENT_VERSION, pendingVersion ?: bundled.version)
            .putString(KEY_CONTENT_BUILT_AT, pendingBuiltAt ?: bundled.builtAt)
            .remove(KEY_PENDING_CONTENT_VERSION)
            .remove(KEY_PENDING_CONTENT_BUILT_AT)
            .apply()
    }

    fun fetchRemoteMeta(repoOwner: String, repoName: String, branch: String): JSONObject {
        val baseUrl = "https://raw.githubusercontent.com/$repoOwner/$repoName/$branch"
        return JSONObject(fetchText("$baseUrl/azmoon-arshad-app-version.json"))
    }

    private fun isRemoteContentCompatible(context: Context, remoteMeta: JSONObject): Boolean {
        val remoteApkCode = remoteMeta.optInt("apkVersionCode", 0)
        val localApkCode = ApkUpdater.localVersionCode(context)
        // Remote content built for an older APK must not overwrite this APK's UI.
        if (remoteApkCode > 0 && remoteApkCode < localApkCode) {
            return false
        }

        val bundled = readBundledMeta(context)
        val remoteVersion = remoteMeta.optString("version", "0.0.0")
        val remoteBuiltAt = remoteMeta.optString("builtAt", "")
        // Must be newer than the HTML shipped inside this APK.
        return needsUpdate(bundled.version, bundled.builtAt, remoteVersion, remoteBuiltAt)
    }

    fun checkForUpdate(context: Context, repoOwner: String, repoName: String, branch: String): UpdateCheckResult {
        val remoteMeta = fetchRemoteMeta(repoOwner, repoName, branch)

        val remoteApkCode = remoteMeta.optInt("apkVersionCode", 0)
        val remoteApkName = remoteMeta.optString("apkVersionName", "")
        val remoteApkUrl = remoteMeta.optString("apkUrl", "")
        val localApkCode = ApkUpdater.localVersionCode(context)
        val localApkName = ApkUpdater.localVersionName(context)

        if (remoteApkCode > localApkCode && remoteApkUrl.isNotBlank()) {
            return UpdateCheckResult(
                hasUpdate = true,
                updateKind = "apk",
                currentVersion = localApkName,
                latestVersion = remoteApkName.ifBlank { remoteApkCode.toString() },
            )
        }

        val currentVersion = installedVersion(context)
        val currentBuiltAt = installedBuiltAt(context)
        val latestVersion = remoteMeta.getString("version")
        val latestBuiltAt = remoteMeta.optString("builtAt", "")
        val hasContentUpdate =
            isRemoteContentCompatible(context, remoteMeta) &&
                needsUpdate(currentVersion, currentBuiltAt, latestVersion, latestBuiltAt)

        return UpdateCheckResult(
            hasUpdate = hasContentUpdate,
            updateKind = if (hasContentUpdate) "content" else "none",
            currentVersion = currentVersion,
            latestVersion = latestVersion,
        )
    }

    fun fetchAndApply(
        context: Context,
        repoOwner: String,
        repoName: String,
        branch: String,
        onProgress: ((percent: Int, done: Int, total: Int, label: String) -> Unit)? = null,
    ): UpdateResult {
        val remoteMeta = fetchRemoteMeta(repoOwner, repoName, branch)

        val remoteApkCode = remoteMeta.optInt("apkVersionCode", 0)
        val remoteApkName = remoteMeta.optString("apkVersionName", "")
        val remoteApkUrl = remoteMeta.optString("apkUrl", "")
        val remoteApkSha = remoteMeta.optString("apkSha256", "").ifBlank { null }
        val localApkCode = ApkUpdater.localVersionCode(context)
        val localApkName = ApkUpdater.localVersionName(context)

        if (remoteApkCode > localApkCode && remoteApkUrl.isNotBlank()) {
            onProgress?.invoke(0, 0, 1, "شروع دریافت APK...")
            val apkFile = ApkUpdater.download(
                context = context,
                url = remoteApkUrl,
                expectedSha256 = remoteApkSha,
            ) { percent, downloaded, total ->
                onProgress?.invoke(
                    percent,
                    1,
                    1,
                    if (total > 0) {
                        "دریافت APK · ${formatBytes(downloaded)} از ${formatBytes(total)}"
                    } else {
                        "دریافت APK · ${formatBytes(downloaded)}"
                    },
                )
            }

            onProgress?.invoke(100, 1, 1, "آماده‌سازی نصب...")
            markPendingContentAfterApkInstall(
                context,
                remoteMeta.optString("version", remoteApkName).ifBlank { remoteApkName },
                remoteMeta.optString("builtAt", "").ifBlank { null },
            )
            ApkUpdater.startInstall(context, apkFile)

            return UpdateResult(
                success = true,
                message = "فایل نسخه جدید آماده شد. نصب را تأیید کنید.",
                currentVersion = localApkName,
                latestVersion = remoteApkName.ifBlank { remoteApkCode.toString() },
                updateKind = "apk",
                awaitingInstall = true,
            )
        }

        val currentVersion = installedVersion(context)
        val currentBuiltAt = installedBuiltAt(context)
        val latestVersion = remoteMeta.getString("version")
        val latestBuiltAt = remoteMeta.optString("builtAt", "")
        val baseUrl = "https://raw.githubusercontent.com/$repoOwner/$repoName/$branch"

        if (!isRemoteContentCompatible(context, remoteMeta) ||
            !needsUpdate(currentVersion, currentBuiltAt, latestVersion, latestBuiltAt)
        ) {
            return UpdateResult(
                success = true,
                message = "اپلیکیشن به‌روز است (نسخه $currentVersion)",
                currentVersion = currentVersion,
                latestVersion = latestVersion,
                updateKind = "content",
            )
        }

        onProgress?.invoke(10, 1, 2, "دریافت فایل ۱ از ۲")
        val html = fetchText("$baseUrl/azmoon-arshad.html")
        onProgress?.invoke(55, 2, 2, "دریافت فایل ۲ از ۲")
        val fontBytes = fetchBytes("$baseUrl/fonts/Vazir-FD.ttf")
        onProgress?.invoke(85, 2, 2, "اعمال بروزرسانی...")

        val targetDir = updateDir(context)
        val fontsDir = File(targetDir, "fonts")

        if (!targetDir.exists() && !targetDir.mkdirs()) {
            throw IllegalStateException("ایجاد پوشه بروزرسانی ممکن نشد")
        }
        if (!fontsDir.exists() && !fontsDir.mkdirs()) {
            throw IllegalStateException("ایجاد پوشه فونت ممکن نشد")
        }

        File(targetDir, "azmoon-arshad.html").writeText(html)
        File(fontsDir, "Vazir-FD.ttf").writeBytes(fontBytes)
        File(targetDir, "azmoon-arshad-app-version.json").writeText(remoteMeta.toString())

        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_CONTENT_VERSION, latestVersion)
            .putString(KEY_CONTENT_BUILT_AT, latestBuiltAt.ifBlank { null })
            .apply()

        onProgress?.invoke(100, 2, 2, "بروزرسانی کامل شد")

        return UpdateResult(
            success = true,
            message = "بروزرسانی از $currentVersion به $latestVersion انجام شد",
            currentVersion = currentVersion,
            latestVersion = latestVersion,
            updateKind = "content",
            reloaded = true,
        )
    }

    private data class LocalMeta(val version: String, val builtAt: String?)

    private fun readBundledMeta(context: Context): LocalMeta {
        return try {
            context.assets.open("azmoon-arshad-app-version.json").bufferedReader().use { reader ->
                parseMeta(reader.readText())
            }
        } catch (_: Exception) {
            LocalMeta("0.0.0", null)
        }
    }

    private fun readLocalMeta(context: Context): LocalMeta {
        val updatedMeta = File(updateDir(context), "azmoon-arshad-app-version.json")
        if (updatedMeta.exists()) {
            return parseMeta(updatedMeta.readText())
        }

        return readBundledMeta(context)
    }

    private fun parseMeta(raw: String): LocalMeta {
        val json = JSONObject(raw)
        val builtAt = json.optString("builtAt", "").ifBlank { null }
        return LocalMeta(json.optString("version", "0.0.0"), builtAt)
    }

    private fun needsUpdate(
        currentVersion: String,
        currentBuiltAt: String?,
        latestVersion: String,
        latestBuiltAt: String,
    ): Boolean {
        when (compareVersions(currentVersion, latestVersion)) {
            -1 -> return true
            1 -> return false
        }

        if (latestBuiltAt.isBlank()) return false
        if (currentBuiltAt.isNullOrBlank()) return true
        return latestBuiltAt > currentBuiltAt
    }

    private fun formatBytes(bytes: Long): String {
        if (bytes < 1024) return "$bytes B"
        val kb = bytes / 1024.0
        if (kb < 1024) return String.format("%.0f KB", kb)
        val mb = kb / 1024.0
        return String.format("%.1f MB", mb)
    }

    private fun fetchText(url: String): String {
        val connection = openConnection(url)
        return connection.inputStream.bufferedReader().use { it.readText() }.also {
            connection.disconnect()
        }
    }

    private fun fetchBytes(url: String): ByteArray {
        val connection = openConnection(url)
        return connection.inputStream.use { it.readBytes() }.also {
            connection.disconnect()
        }
    }

    private fun cacheBustUrl(url: String): String {
        val separator = if (url.contains("?")) "&" else "?"
        return "$url${separator}_=${System.currentTimeMillis()}"
    }

    private fun openConnection(url: String): HttpURLConnection {
        val connection = URL(cacheBustUrl(url)).openConnection() as HttpURLConnection
        connection.useCaches = false
        connection.defaultUseCaches = false
        connection.connectTimeout = 20000
        connection.readTimeout = 30000
        connection.requestMethod = "GET"
        connection.setRequestProperty("Accept", "*/*")
        connection.setRequestProperty("Cache-Control", "no-cache, no-store, must-revalidate")
        connection.setRequestProperty("Pragma", "no-cache")
        connection.setRequestProperty("Expires", "0")

        val code = connection.responseCode
        if (code !in 200..299) {
            connection.disconnect()
            throw IllegalStateException("خطا در دریافت فایل ($code)")
        }

        return connection
    }

    private fun compareVersions(current: String, latest: String): Int {
        val currentParts = current.split(".").map { it.toIntOrNull() ?: 0 }
        val latestParts = latest.split(".").map { it.toIntOrNull() ?: 0 }
        val length = maxOf(currentParts.size, latestParts.size)

        for (index in 0 until length) {
            val left = currentParts.getOrElse(index) { 0 }
            val right = latestParts.getOrElse(index) { 0 }
            if (left < right) return -1
            if (left > right) return 1
        }

        return 0
    }
}
