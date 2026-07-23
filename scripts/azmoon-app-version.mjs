import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getAndroidApkDownloadUrl, getAndroidApkVersion } from "./android-apk-version.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const packageJsonPath = path.join(rootDir, "package.json");

/** GitHub repo that hosts raw azmoon-arshad-app-version.json for in-app updates. */
export const APP_UPDATE_REPO = {
  repoOwner: "M3hdi-Rostami",
  repoName: "azmoon-arshad",
  branch: "main",
};

export function getAzmoonAppVersion() {
  const apk = getAndroidApkVersion();
  if (apk.versionName) return apk.versionName;

  if (fs.existsSync(packageJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
      if (pkg.version) return String(pkg.version);
    } catch {
      // fall through
    }
  }

  return "1.0.0";
}

export function buildAzmoonAppVersionPayload(extra = {}) {
  const apk = getAndroidApkVersion();
  const rootVersionPath = path.join(rootDir, "azmoon-arshad-app-version.json");
  let previousSha = null;
  if (fs.existsSync(rootVersionPath)) {
    try {
      previousSha = JSON.parse(fs.readFileSync(rootVersionPath, "utf8")).apkSha256 || null;
    } catch {
      previousSha = null;
    }
  }
  return {
    version: getAzmoonAppVersion(),
    builtAt: new Date().toISOString(),
    apkVersionCode: apk.versionCode,
    apkVersionName: apk.versionName,
    apkUrl: getAndroidApkDownloadUrl(apk),
    ...(previousSha ? { apkSha256: previousSha } : {}),
    ...extra,
  };
}

export function writeAppVersionPayload(outputPaths, payload) {
  const json = `${JSON.stringify(payload, null, 2)}\n`;
  for (const outputPath of outputPaths) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, json, "utf8");
  }
  return json;
}

export function writeAzmoonAppVersion(outputPaths, extra = {}) {
  return writeAppVersionPayload(outputPaths, buildAzmoonAppVersionPayload(extra));
}

/** Read a previously sealed version manifest (e.g. embedded in the APK assets). */
export function readAzmoonAppVersion(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}
