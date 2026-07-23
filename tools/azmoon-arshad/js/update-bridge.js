(function () {
  // پل بروزرسانی اندروید — پورت‌شده از اپلیکیشن قیمت دلار و طلا (market-prices)
  // Kotlin از طریق window.__onAppUpdate* با این اسکریپت صحبت می‌کند.

  const UPDATE_CHECK_INTERVAL_MS = 5 * 60 * 1000;
  let audioCtx = null;
  const UPDATE_SUCCESS_SOUND_KEY = "azmoon-arshad-play-update-success";

  function updateArgs() {
    return [
      APP_UPDATE_CONFIG.repoOwner,
      APP_UPDATE_CONFIG.repoName,
      APP_UPDATE_CONFIG.branch,
    ];
  }

  function getAudioContext() {
    try {
      if (!audioCtx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        audioCtx = new Ctx();
      }
      if (audioCtx.state === "suspended") audioCtx.resume().catch(function () {});
      return audioCtx;
    } catch {
      return null;
    }
  }

  function playNotificationTone(sequence) {
    const ctx = getAudioContext();
    if (!ctx) return;
    const master = ctx.createGain();
    master.gain.value = 0.18;
    master.connect(ctx.destination);
    let t = ctx.currentTime + 0.02;
    sequence.forEach(function (note) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = note.type || "sine";
      osc.frequency.value = note.freq;
      osc.connect(gain);
      gain.connect(master);
      const dur = note.dur || 0.14;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.85, t + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.start(t);
      osc.stop(t + dur + 0.03);
      t += note.gap != null ? note.gap : dur * 0.62;
    });
  }

  function playUpdateAvailableSound() {
    playNotificationTone([
      { freq: 880, dur: 0.1, gap: 0.08, type: "sine" },
      { freq: 1174.66, dur: 0.14, gap: 0.06, type: "sine" },
      { freq: 1567.98, dur: 0.18, type: "triangle" },
    ]);
  }

  function playUpdateCompleteSound() {
    playNotificationTone([
      { freq: 523.25, dur: 0.08, gap: 0.06, type: "sine" },
      { freq: 659.25, dur: 0.08, gap: 0.06, type: "sine" },
      { freq: 783.99, dur: 0.1, gap: 0.06, type: "triangle" },
      { freq: 1046.5, dur: 0.2, type: "sine" },
    ]);
  }

  function markUpdateSuccessSound() {
    try { sessionStorage.setItem(UPDATE_SUCCESS_SOUND_KEY, "1"); } catch {}
  }

  function playUpdateSuccessSoundIfPending() {
    try {
      if (sessionStorage.getItem(UPDATE_SUCCESS_SOUND_KEY) !== "1") return;
      sessionStorage.removeItem(UPDATE_SUCCESS_SOUND_KEY);
    } catch {
      return;
    }
    window.setTimeout(playUpdateCompleteSound, 350);
  }

  function initUpdatePrompt() {
    if (typeof AndroidApp === "undefined" || typeof APP_UPDATE_CONFIG === "undefined") return;

    const overlay = document.getElementById("updateSheetOverlay");
    const sheet = document.getElementById("updateSheet");
    const titleEl = document.getElementById("updateSheetTitle");
    const messageEl = document.getElementById("updateSheetMessage");
    const confirmBtn = document.getElementById("updateSheetConfirmBtn");
    const progressWrap = document.getElementById("updateSheetProgress");
    const progressFill = document.getElementById("updateSheetProgressFill");
    const progressLabel = document.getElementById("updateSheetProgressLabel");
    const progressPercent = document.getElementById("updateSheetProgressPercent");
    if (!overlay || !sheet || !messageEl || !confirmBtn) return;

    let isDownloading = false;
    let fakeProgressTimer = null;
    const persianDigitsMap = "۰۱۲۳۴۵۶۷۸۹";
    const toFa = function (n) {
      return String(n).replace(/\d/g, function (d) { return persianDigitsMap[+d]; });
    };

    function syncVersionDisplay(version) {
      const versionEl = document.getElementById("appContentVersion");
      if (versionEl && version) versionEl.textContent = version;
    }

    function notifySheetOpen(open) {
      try { AndroidApp.setUpdateSheetOpen(open); } catch {}
    }

    function stopFakeProgress() {
      if (fakeProgressTimer) {
        window.clearInterval(fakeProgressTimer);
        fakeProgressTimer = null;
      }
    }

    function startFakeProgress() {
      stopFakeProgress();
      let value = 4;
      fakeProgressTimer = window.setInterval(function () {
        if (!isDownloading) {
          stopFakeProgress();
          return;
        }
        value = Math.min(90, value + Math.max(1, Math.round((90 - value) * 0.08)));
        setProgress(value, "در حال دریافت بروزرسانی...");
      }, 450);
    }

    function setProgress(percent, label) {
      const value = Math.max(0, Math.min(100, Math.round(percent || 0)));
      if (progressFill) progressFill.style.width = value + "%";
      if (progressPercent) progressPercent.textContent = toFa(value) + "٪";
      if (progressLabel && label) progressLabel.textContent = label;
    }

    function enterDownloadingState() {
      isDownloading = true;
      sheet.classList.add("downloading");
      if (progressWrap) progressWrap.classList.remove("hidden");
      if (titleEl) titleEl.textContent = "در حال بروزرسانی";
      messageEl.textContent = "لطفاً صبر کنید تا دریافت نسخه جدید کامل شود.";
      setProgress(0, "شروع دریافت فایل‌ها...");
      startFakeProgress();
      confirmBtn.disabled = true;
    }

    function exitDownloadingState() {
      isDownloading = false;
      stopFakeProgress();
      sheet.classList.remove("downloading");
      confirmBtn.disabled = false;
    }

    function ensureUpdateSheetVisible() {
      overlay.classList.remove("hidden");
      requestAnimationFrame(function () {
        overlay.classList.add("open");
        notifySheetOpen(true);
        overlay.setAttribute("aria-hidden", "false");
      });
    }

    function showUpdateSheet(latestVersion, currentVersion, updateKind) {
      if (isDownloading) return;
      if (overlay.classList.contains("open") && sheet.classList.contains("downloading")) return;

      overlay.dataset.latestVersion = latestVersion;
      overlay.dataset.updateKind = updateKind || "content";
      if (titleEl) {
        titleEl.textContent = updateKind === "apk"
          ? "نسخه جدید اپلیکیشن موجود است"
          : "بروزرسانی محتوا موجود است";
      }
      messageEl.textContent = updateKind === "apk"
        ? ("نسخه " + latestVersion + " منتشر شده است. نسخه فعلی شما " + currentVersion + " است. با تأیید، کل اپلیکیشن (همراه با بانک سؤالات) بروزرسانی می‌شود.")
        : ("نسخه " + latestVersion + " منتشر شده است. نسخه فعلی شما " + currentVersion + " است. فقط محتوای داخل اپ (بانک سؤالات) بروزرسانی می‌شود.");
      if (progressWrap) progressWrap.classList.add("hidden");
      sheet.classList.remove("downloading");
      confirmBtn.textContent = updateKind === "apk" ? "بروزرسانی اپلیکیشن" : "بروزرسانی محتوا";
      confirmBtn.disabled = false;
      ensureUpdateSheetVisible();
      playUpdateAvailableSound();
    }

    function startUpdateDownload() {
      if (isDownloading) return;
      ensureUpdateSheetVisible();
      enterDownloadingState();
      try {
        AndroidApp.startAppUpdate.apply(AndroidApp, updateArgs());
      } catch (err) {
        exitDownloadingState();
        if (progressWrap) progressWrap.classList.remove("hidden");
        if (titleEl) titleEl.textContent = "خطا در بروزرسانی";
        messageEl.textContent = "شروع دریافت ممکن نشد. دوباره تلاش کنید.";
        confirmBtn.textContent = "تلاش مجدد";
        confirmBtn.disabled = false;
      }
    }

    window.__startAppUpdateFromSheet = startUpdateDownload;

    window.__onAppUpdateProgress = function (progress) {
      if (!progress) return;
      stopFakeProgress();
      const percent = Number(progress.percent) || 0;
      const done = Number(progress.done) || 0;
      const total = Number(progress.total) || 0;
      const label = progress.label
        || (total > 0
          ? ("دریافت فایل " + toFa(Math.min(Math.max(done, 1), total)) + " از " + toFa(total))
          : "در حال دریافت بروزرسانی...");
      if (!sheet.classList.contains("downloading")) enterDownloadingState();
      setProgress(percent, label);
    };

    window.__onAppUpdateComplete = function (result) {
      stopFakeProgress();

      if (result && result.needsInstallPermission) {
        isDownloading = true;
        sheet.classList.add("downloading");
        if (progressWrap) progressWrap.classList.remove("hidden");
        if (titleEl) titleEl.textContent = "مجوز نصب اندروید";
        messageEl.textContent = (result && result.message)
          || "یک‌بار اجازه نصب را در تنظیمات فعال کنید. پس از بازگشت، بروزرسانی خودکار ادامه می‌یابد.";
        setProgress(0, "در انتظار فعال‌سازی مجوز...");
        confirmBtn.textContent = "باز کردن تنظیمات";
        confirmBtn.disabled = false;
        return;
      }

      if (!result || !result.success) {
        exitDownloadingState();
        if (progressWrap) progressWrap.classList.remove("hidden");
        if (titleEl) titleEl.textContent = "خطا در بروزرسانی";
        messageEl.textContent = (result && result.message) || "دریافت نسخه جدید ناموفق بود.";
        setProgress(0, "لطفاً دوباره تلاش کنید");
        confirmBtn.textContent = "تلاش مجدد";
        confirmBtn.disabled = false;
        return;
      }

      if (result.awaitingInstall) {
        isDownloading = true;
        sheet.classList.add("downloading");
        if (progressWrap) progressWrap.classList.remove("hidden");
        if (titleEl) titleEl.textContent = "تأیید نصب";
        messageEl.textContent = result.message || "در حال نصب نسخه جدید. در صورت نیاز، نصب را در صفحه سیستم تأیید کنید.";
        setProgress(100, "در انتظار نصب...");
        return;
      }

      setProgress(100, "بروزرسانی کامل شد");
      if (titleEl) titleEl.textContent = "بروزرسانی موفق";
      messageEl.textContent = result.message || "نسخه جدید با موفقیت دریافت شد.";
      if (result.latestVersion) syncVersionDisplay(result.latestVersion);
      if (result.success && result.reloaded) {
        messageEl.textContent = "نسخه جدید نصب شد. در حال بارگذاری مجدد...";
        markUpdateSuccessSound();
        playUpdateCompleteSound();
      }
      if (result.updateKind === "apk" && result.success && !result.awaitingInstall) {
        exitDownloadingState();
        confirmBtn.textContent = "تلاش مجدد";
      }
    };

    window.__onAppUpdateCheckComplete = function (result) {
      if (isDownloading) return;
      if (!result || !result.success || !result.hasUpdate) return;
      showUpdateSheet(result.latestVersion, result.currentVersion, result.updateKind);
    };

    confirmBtn.addEventListener("click", function () {
      startUpdateDownload();
    });

    function runUpdateCheck() {
      if (isDownloading) return;
      try {
        AndroidApp.checkForAppUpdate.apply(AndroidApp, updateArgs());
      } catch {}
    }

    window.setTimeout(runUpdateCheck, 12000);
    window.setInterval(runUpdateCheck, UPDATE_CHECK_INTERVAL_MS);
  }

  try { localStorage.removeItem("azmoon-arshad-update-dismissed"); } catch {}

  playUpdateSuccessSoundIfPending();
  initUpdatePrompt();
})();
