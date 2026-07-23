import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { buildAzmoonPage } from "./build-azmoon-page.mjs";
import { getAndroidApkVersion, injectApkVersionIntoGradle } from "./android-apk-version.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const androidDir = path.join(rootDir, "android");
const assetsDir = path.join(androidDir, "app/src/main/assets");
const assetHtmlPath = path.join(assetsDir, "azmoon-arshad.html");
const assetFontsDir = path.join(assetsDir, "fonts");
const sourceFontPath = path.join(rootDir, "assets/fonts/Vazir-FD.ttf");
const gradlew = path.join(androidDir, process.platform === "win32" ? "gradlew.bat" : "gradlew");
const releaseApkPath = path.join(androidDir, "app/build/outputs/apk/release/app-release.apk");
const outputApkPath = path.join(androidDir, "azmoon-arshad.apk");
const gradleTemplatePath = path.join(rootDir, "scripts/android-app-build.gradle.kts");
const appGradlePath = path.join(androidDir, "app/build.gradle.kts");
const androidSrcDir = path.join(rootDir, "scripts/android-src");
const androidJavaDest = path.join(androidDir, "app/src/main/java/ir/superextension/azmoonarshad");
const androidManifestDest = path.join(androidDir, "app/src/main/AndroidManifest.xml");

// ابزارهای بیلد از پروژه market-prices به اشتراک گرفته می‌شوند (JDK 17 + Android SDK + کش Gradle)
const sharedToolsCandidates = [
  path.join(androidDir, ".tools"),
  "/home/m3hdi/work/my/ai-projects/market-prices/android/.tools",
];

function resolveSharedTools() {
  for (const candidate of sharedToolsCandidates) {
    if (fs.existsSync(path.join(candidate, "jdk-17"))) return candidate;
  }
  return null;
}

function syncAndroidGradleTemplate() {
  const template = injectApkVersionIntoGradle(fs.readFileSync(gradleTemplatePath, "utf8"));
  const current = fs.existsSync(appGradlePath) ? fs.readFileSync(appGradlePath, "utf8") : "";
  if (current !== template) {
    fs.mkdirSync(path.dirname(appGradlePath), { recursive: true });
    fs.writeFileSync(appGradlePath, template, "utf8");
    const apk = getAndroidApkVersion();
    console.log(`  synced android/app/build.gradle.kts (version ${apk.versionName}, code ${apk.versionCode})`);
  }
}

function syncAndroidSources() {
  const javaSrc = path.join(androidSrcDir, "java");
  const manifestSrc = path.join(androidSrcDir, "AndroidManifest.xml");

  fs.mkdirSync(androidJavaDest, { recursive: true });
  for (const name of fs.readdirSync(javaSrc)) {
    if (!name.endsWith(".kt")) continue;
    fs.copyFileSync(path.join(javaSrc, name), path.join(androidJavaDest, name));
  }
  fs.copyFileSync(manifestSrc, androidManifestDest);
  console.log("  synced Android Kotlin sources + manifest from scripts/android-src");
}

async function copyHtmlToAssets() {
  await buildAzmoonPage();
  fs.mkdirSync(assetsDir, { recursive: true });
  fs.copyFileSync(path.join(rootDir, "azmoon-arshad.html"), assetHtmlPath);
  // مانیفست نسخه داخل APK — مبنای مقایسه برای بروزرسانی درون‌برنامه‌ای
  fs.copyFileSync(
    path.join(rootDir, "azmoon-arshad-app-version.json"),
    path.join(assetsDir, "azmoon-arshad-app-version.json"),
  );

  if (!fs.existsSync(sourceFontPath)) {
    throw new Error(`Missing Vazir font: ${sourceFontPath}`);
  }
  fs.mkdirSync(assetFontsDir, { recursive: true });
  fs.copyFileSync(sourceFontPath, path.join(assetFontsDir, "Vazir-FD.ttf"));
}

function runGradle(task, { offline = false, javaHome, gradleUserHome } = {}) {
  const args = [task, "--no-daemon"];
  if (offline) args.push("--offline");

  const result = spawnSync(gradlew, args, {
    cwd: androidDir,
    env: {
      ...process.env,
      JAVA_HOME: javaHome,
      GRADLE_USER_HOME: gradleUserHome,
    },
    stdio: "inherit",
  });
  return result.status ?? 1;
}

function buildApkWithGradle() {
  const toolsDir = resolveSharedTools();
  if (!toolsDir) {
    throw new Error(
      "Bundled JDK not found. Expected android/.tools/jdk-17 here or in the market-prices project.\n" +
      "Run market-prices' scripts/bootstrap-android-deps.sh once, or install tools locally.",
    );
  }

  const javaHome = path.join(toolsDir, "jdk-17");
  const gradleUserHome = path.join(toolsDir, "gradle-home");
  console.log(`  using shared tools: ${toolsDir}`);

  const offlineStatus = runGradle("assembleRelease", { offline: true, javaHome, gradleUserHome });
  if (offlineStatus === 0) return;

  console.log("Offline build failed, retrying with network ...");
  const onlineStatus = runGradle("assembleRelease", { javaHome, gradleUserHome });
  if (onlineStatus !== 0) {
    throw new Error(
      "Gradle assembleRelease failed.\n" +
      "Gradle could not resolve Android build tools (often blocked in Iran) — try with VPN.",
    );
  }
}

export async function buildAzmoonApk() {
  syncAndroidGradleTemplate();
  syncAndroidSources();

  console.log("Building azmoon-arshad.html for Android assets ...");
  await copyHtmlToAssets();

  console.log("");
  console.log("Building Android APK ...");
  buildApkWithGradle();

  if (!fs.existsSync(releaseApkPath)) {
    throw new Error(`Release APK not found: ${releaseApkPath}`);
  }

  fs.copyFileSync(releaseApkPath, outputApkPath);
  const sizeMb = (fs.statSync(outputApkPath).size / 1024 / 1024).toFixed(1);
  console.log(`  apk: ${path.relative(rootDir, outputApkPath)} (${sizeMb} MB)`);
  return outputApkPath;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildAzmoonApk().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
