import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { questionBank, validateQuestionBank } from "../tools/azmoon-arshad/data/index.mjs";
import { APP_UPDATE_REPO, getAzmoonAppVersion, writeAzmoonAppVersion } from "./azmoon-app-version.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const toolsDir = path.join(rootDir, "tools/azmoon-arshad");
const distDir = path.join(rootDir, "dist");
const outputPaths = [
  path.join(rootDir, "azmoon-arshad.html"),
  path.join(distDir, "azmoon-arshad.html"),
];

/** مارک‌آپ شیت بروزرسانی — خارج از #app تا با رندر مجدد اپ از بین نرود */
const updateSheetMarkup = `  <div id="updateSheetOverlay" class="update-sheet-overlay mandatory hidden" aria-hidden="true">
    <div id="updateSheetBackdrop" class="update-sheet-backdrop" aria-hidden="true"></div>
    <div id="updateSheet" class="update-sheet" role="dialog" aria-modal="true" aria-labelledby="updateSheetTitle">
      <div class="update-sheet-handle" aria-hidden="true"></div>
      <div class="update-sheet-content">
        <div class="update-sheet-icon-wrap" aria-hidden="true"><div class="update-sheet-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg></div></div>
        <h2 id="updateSheetTitle" class="update-sheet-title">نسخه جدید اپلیکیشن موجود است</h2>
        <p id="updateSheetMessage" class="update-sheet-message"></p>
        <div id="updateSheetProgress" class="update-sheet-progress hidden" aria-live="polite">
          <div class="update-sheet-progress-track">
            <span id="updateSheetProgressFill" class="update-sheet-progress-fill"></span>
          </div>
          <div class="update-sheet-progress-meta">
            <span id="updateSheetProgressLabel">در حال دریافت بروزرسانی...</span>
            <span id="updateSheetProgressPercent">۰٪</span>
          </div>
        </div>
        <div class="update-sheet-actions" id="updateSheetActions">
          <button type="button" id="updateSheetConfirmBtn" class="update-sheet-btn update-sheet-btn-primary">دریافت نسخه جدید</button>
        </div>
      </div>
    </div>
  </div>`;

function buildPageHtml() {
  const styles = fs.readFileSync(path.join(toolsDir, "css/styles.css"), "utf8");
  const appScript = fs.readFileSync(path.join(toolsDir, "js/app.js"), "utf8");
  const updateBridgeScript = fs.readFileSync(path.join(toolsDir, "js/update-bridge.js"), "utf8");
  const bankJson = JSON.stringify(questionBank);
  const updateConfig = JSON.stringify({
    ...APP_UPDATE_REPO,
    currentVersion: getAzmoonAppVersion(),
  });

  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="theme-color" content="#111621">
  <title>آزمون ارشد</title>
  <script>
    (function () {
      try {
        var theme = localStorage.getItem("azmoon-arshad-theme") === "light" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", theme);
        document.documentElement.style.colorScheme = theme;
      } catch (e) {
        document.documentElement.setAttribute("data-theme", "dark");
      }
    })();
  </script>
  <style>
${styles}
  </style>
</head>
<body>
  <div id="app"></div>
${updateSheetMarkup}
  <script>
const QUESTION_BANK = ${bankJson};
const APP_UPDATE_CONFIG = ${updateConfig};

${appScript}
  </script>
  <script>
${updateBridgeScript}
  </script>
</body>
</html>`;
}

export async function buildAzmoonPage() {
  const errors = validateQuestionBank(questionBank);
  if (errors.length > 0) {
    throw new Error(`بانک سؤالات معتبر نیست:\n  - ${errors.join("\n  - ")}`);
  }

  const totalExams = questionBank.groups.reduce((n, g) => n + g.exams.length, 0);
  const totalQuestions = questionBank.groups.reduce(
    (n, g) => n + g.exams.reduce((m, e) => m + e.questions.length, 0), 0);
  console.log(`  question bank: ${questionBank.groups.length} groups, ${totalExams} exams, ${totalQuestions} questions`);

  const html = buildPageHtml();
  for (const outputPath of outputPaths) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, html, "utf8");
    console.log(`  page: ${path.relative(rootDir, outputPath)}`);
  }

  // مانیفست نسخه برای بررسی بروزرسانی درون‌برنامه‌ای
  const versionPaths = [
    path.join(rootDir, "azmoon-arshad-app-version.json"),
    path.join(distDir, "azmoon-arshad-app-version.json"),
  ];
  writeAzmoonAppVersion(versionPaths);
  for (const versionPath of versionPaths) {
    console.log(`  version: ${path.relative(rootDir, versionPath)}`);
  }

  return html;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildAzmoonPage().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
