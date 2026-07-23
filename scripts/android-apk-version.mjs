import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const versionFilePath = path.join(__dirname, "android-apk-version.json");

const DEFAULT_REPO = {
  repoOwner: "M3hdi-Rostami",
  repoName: "azmoon-arshad",
};

export function getAndroidApkVersion() {
  if (!fs.existsSync(versionFilePath)) {
    return {
      versionCode: 1,
      versionName: "1.0.0",
      releaseTag: "android-apk",
    };
  }
  const raw = JSON.parse(fs.readFileSync(versionFilePath, "utf8"));
  return {
    versionCode: Number(raw.versionCode) || 1,
    versionName: String(raw.versionName || "1.0.0"),
    releaseTag: String(raw.releaseTag || "android-apk"),
  };
}

export function writeAndroidApkVersion(next) {
  const payload = {
    versionCode: Number(next.versionCode),
    versionName: String(next.versionName),
    releaseTag: String(next.releaseTag || "android-apk"),
  };
  fs.writeFileSync(versionFilePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return payload;
}

export function bumpAndroidApkVersion() {
  const current = getAndroidApkVersion();
  const nextCode = current.versionCode + 1;
  const parts = current.versionName.split(".").map((part) => {
    const value = Number.parseInt(part, 10);
    return Number.isFinite(value) ? value : 0;
  });
  while (parts.length < 3) parts.push(0);
  parts[parts.length - 1] += 1;
  const next = writeAndroidApkVersion({
    versionCode: nextCode,
    versionName: parts.join("."),
    releaseTag: current.releaseTag,
  });
  return { previous: current, next };
}

export function getAndroidApkDownloadUrl(version = getAndroidApkVersion(), repo = DEFAULT_REPO) {
  return `https://github.com/${repo.repoOwner}/${repo.repoName}/releases/download/${version.releaseTag}/azmoon-arshad.apk`;
}

export function sha256File(filePath) {
  const hash = createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
}

export function injectApkVersionIntoGradle(template) {
  const apk = getAndroidApkVersion();
  return template
    .replace(/versionCode\s*=\s*\d+/, `versionCode = ${apk.versionCode}`)
    .replace(/versionName\s*=\s*"[^"]*"/, `versionName = "${apk.versionName}"`);
}

export { versionFilePath, rootDir, DEFAULT_REPO };
