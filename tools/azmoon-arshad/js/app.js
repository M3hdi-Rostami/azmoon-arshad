/* اپلیکیشن آزمون چهارگزینه‌ای کارشناسی ارشد
 * QUESTION_BANK به‌صورت سراسری توسط اسکریپت بیلد تزریق می‌شود.
 * نمره‌دهی مطابق کنکور سراسری: هر پاسخ غلط یک‌سوم نمره منفی دارد.
 */

const RESULTS_KEY = "azmoon-arshad-results";
const THEME_KEY = "azmoon-arshad-theme";
const APP_TITLE = "آزمون ارشد";

const appEl = document.getElementById("app");

const state = {
  screen: "home", // home | group | exam | result | review | history | stats | more
  groupId: null,
  examId: null,
  answers: [],
  flags: [],
  currentIdx: 0,
  remainingSec: 0,
  timerHandle: null,
  result: null, // نتیجه آزمونی که همین حالا تمام شد یا از تاریخچه باز شده
  confirmSheet: null,
  customExam: null, // آزمون سریع (ترکیبی) ساخته‌شده در لحظه
};

/* ---------- ابزارهای کمکی ---------- */

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
function faNum(value) {
  return String(value).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
}

function formatClock(totalSec) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatPercent(p) {
  const rounded = Math.round(p * 10) / 10;
  return `${faNum(rounded)}٪`;
}

function formatDate(ts) {
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
    }).format(new Date(ts));
  } catch (e) {
    return new Date(ts).toLocaleString();
  }
}

function isMostlyLatin(text) {
  const latin = (text.match(/[A-Za-z]/g) || []).length;
  return latin > text.length * 0.3;
}

function el(tag, attrs, children) {
  const node = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") node.className = v;
      else if (k === "text") node.textContent = v;
      else if (k === "html") node.innerHTML = v;
      else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v);
    }
  }
  for (const child of children || []) {
    if (child == null) continue;
    node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
  }
  return node;
}

function findGroup(groupId) {
  return QUESTION_BANK.groups.find((g) => g.id === groupId) || null;
}

function findExam(examId) {
  if (state.customExam && state.customExam.id === examId) {
    return { group: { id: "quick", title: "آزمون سریع" }, exam: state.customExam };
  }
  for (const group of QUESTION_BANK.groups) {
    const exam = (group.exams || []).find((e) => e.id === examId);
    if (exam) return { group, exam };
  }
  return null;
}

/** ساخت آزمون سریع: سؤالات تصادفی از کل بانک سؤالات */
function buildQuickExam(count) {
  const pool = [];
  for (const group of QUESTION_BANK.groups) {
    for (const exam of group.exams) {
      for (const q of exam.questions) {
        if (q.reading) continue; // سؤالات وابسته به متن، بدون متن معنا ندارند
        pool.push(q);
      }
    }
  }
  // برداشتن تصادفی (Fisher–Yates روی نمونه)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return {
    id: `quick-${Date.now()}`,
    title: "آزمون سریع (ترکیبی از همه دروس)",
    durationMinutes: 25,
    subjectsLabel: "منتخب تصادفی از کل بانک سؤالات",
    questions: pool.slice(0, count),
  };
}

function startQuickExam() {
  state.customExam = buildQuickExam(20);
  startExam(state.customExam.id);
}

/* ---------- ذخیره و بازیابی نتایج ---------- */

function loadResults() {
  try {
    const raw = localStorage.getItem(RESULTS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

function saveResult(result) {
  const list = loadResults();
  list.unshift(result);
  try {
    localStorage.setItem(RESULTS_KEY, JSON.stringify(list.slice(0, 200)));
  } catch (e) { /* حافظه پر */ }
}

function bestScoreFor(examId) {
  const scores = loadResults().filter((r) => r.examId === examId).map((r) => r.percent);
  return scores.length ? Math.max(...scores) : null;
}

/* ---------- نمره‌دهی کنکوری ---------- */

function scoreExam(exam, answers) {
  let correct = 0;
  let wrong = 0;
  let blank = 0;
  const subjects = {};

  exam.questions.forEach((q, i) => {
    const subj = subjects[q.subject] || (subjects[q.subject] = { correct: 0, wrong: 0, blank: 0, total: 0 });
    subj.total += 1;
    const a = answers[i];
    if (a == null) {
      blank += 1;
      subj.blank += 1;
    } else if (a === q.answer) {
      correct += 1;
      subj.correct += 1;
    } else {
      wrong += 1;
      subj.wrong += 1;
    }
  });

  const total = exam.questions.length;
  // فرمول درصد کنکور: (صحیح×۳ − غلط) ÷ (کل×۳) ×۱۰۰ — حداقل صفر نمایش داده نمی‌شود تا واقعی بماند
  const rawPercent = ((correct * 3 - wrong) / (total * 3)) * 100;
  const percent = Math.round(rawPercent * 10) / 10;

  const subjectRows = Object.entries(subjects).map(([name, s]) => ({
    name,
    ...s,
    percent: Math.round(((s.correct * 3 - s.wrong) / (s.total * 3)) * 1000) / 10,
  }));

  return { correct, wrong, blank, total, percent, subjects: subjectRows };
}

function verdictFor(percent) {
  if (percent >= 60) return { cls: "good", label: "عالی! در تراز رتبه‌های برتر کنکور ارشد", icon: "🏆" };
  if (percent >= 40) return { cls: "good", label: "خیلی خوب — در محدوده قبولی رشته‌های خوب", icon: "✅" };
  if (percent >= 20) return { cls: "mid", label: "قابل قبول — با تمرین بیشتر به تراز قبولی می‌رسید", icon: "📈" };
  return { cls: "bad", label: "نیاز به مطالعه بیشتر — مرور پاسخ‌های تشریحی را از دست ندهید", icon: "📚" };
}

function pctClass(p) {
  if (p >= 40) return "good";
  if (p >= 20) return "mid";
  return "bad";
}

/* ---------- تم ---------- */

function currentTheme() {
  try {
    return localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
  } catch (e) {
    return "dark";
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
  try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* - */ }
  if (window.AndroidTheme && window.AndroidTheme.onThemeChanged) {
    try { window.AndroidTheme.onThemeChanged(theme); } catch (e) { /* - */ }
  }
}

function toggleTheme() {
  applyTheme(currentTheme() === "light" ? "dark" : "light");
  render();
}

/* ---------- تایمر آزمون ---------- */

function stopTimer() {
  if (state.timerHandle) {
    clearInterval(state.timerHandle);
    state.timerHandle = null;
  }
}

function startTimer() {
  stopTimer();
  state.timerHandle = setInterval(() => {
    state.remainingSec -= 1;
    const timerEl = document.getElementById("examTimer");
    if (timerEl) {
      timerEl.textContent = formatClock(Math.max(0, state.remainingSec));
      timerEl.classList.toggle("low", state.remainingSec <= 60);
    }
    if (state.remainingSec <= 0) {
      finishExam(true);
    }
  }, 1000);
}

/* ---------- جریان آزمون ---------- */

function startExam(examId) {
  const found = findExam(examId);
  if (!found) return;
  state.screen = "exam";
  state.groupId = found.group.id;
  state.examId = examId;
  state.answers = new Array(found.exam.questions.length).fill(null);
  state.flags = new Array(found.exam.questions.length).fill(false);
  state.currentIdx = 0;
  state.remainingSec = (found.exam.durationMinutes || 20) * 60;
  state.result = null;
  startTimer();
  render();
}

function finishExam(timedOut) {
  const found = findExam(state.examId);
  if (!found) return;
  stopTimer();
  const score = scoreExam(found.exam, state.answers);
  const isQuick = found.exam.id.indexOf("quick-") === 0;
  const result = {
    id: `r-${Date.now()}`,
    examId: found.exam.id,
    examTitle: found.exam.title,
    groupTitle: found.group.title,
    date: Date.now(),
    timedOut: !!timedOut,
    answers: state.answers.slice(),
    // برای آزمون سریع، سؤالات را داخل نتیجه ذخیره می‌کنیم تا مرور بعدی ممکن باشد
    ...(isQuick ? { questionsSnapshot: found.exam.questions } : {}),
    ...score,
  };
  saveResult(result);
  state.result = result;
  state.screen = "result";
  state.confirmSheet = null;
  render();
}

function askFinishExam() {
  const unanswered = state.answers.filter((a) => a == null).length;
  state.confirmSheet = {
    title: "پایان آزمون",
    message: unanswered > 0
      ? `هنوز ${faNum(unanswered)} سؤال بی‌پاسخ دارید (بی‌پاسخ نمره منفی ندارد). آزمون تمام شود؟`
      : "همه سؤالات را پاسخ داده‌اید. آزمون تمام شود و کارنامه صادر شود؟",
    confirmLabel: "بله، پایان آزمون",
    onConfirm: () => finishExam(false),
  };
  render();
}

function askExitExam() {
  state.confirmSheet = {
    title: "خروج از آزمون",
    message: "اگر خارج شوید پاسخ‌های این آزمون ذخیره نمی‌شود. مطمئن هستید؟",
    confirmLabel: "بله، خروج",
    danger: true,
    onConfirm: () => {
      stopTimer();
      state.confirmSheet = null;
      goToGroup(state.groupId);
    },
  };
  render();
}

/* ---------- ناوبری ---------- */

function goHome() {
  stopTimer();
  state.screen = "home";
  state.groupId = null;
  state.examId = null;
  state.result = null;
  state.confirmSheet = null;
  render();
}

function goToGroup(groupId) {
  stopTimer();
  state.screen = "group";
  state.groupId = groupId;
  state.confirmSheet = null;
  render();
}

function goToHistory() {
  stopTimer();
  state.screen = "history";
  state.confirmSheet = null;
  render();
}

function goToStats() {
  stopTimer();
  state.screen = "stats";
  state.confirmSheet = null;
  render();
}

function goToMore() {
  stopTimer();
  state.screen = "more";
  state.confirmSheet = null;
  render();
}

function openResult(result) {
  state.result = result;
  state.examId = result.examId;
  state.screen = "result";
  render();
}

function openReview() {
  state.screen = "review";
  render();
}

// دکمه بازگشت اندروید: true یعنی خودمان مدیریت کردیم
window.__handleAndroidBack = function handleAndroidBack() {
  if (state.confirmSheet) {
    state.confirmSheet = null;
    render();
    return true;
  }
  if (state.screen === "exam") {
    askExitExam();
    return true;
  }
  if (state.screen === "review") {
    state.screen = "result";
    render();
    return true;
  }
  if (state.screen === "result") {
    const found = findExam(state.examId);
    if (found) goToGroup(found.group.id); else goToHistory();
    return true;
  }
  if (state.screen === "group" || state.screen === "history" || state.screen === "stats" || state.screen === "more") {
    goHome();
    return true;
  }
  return false;
};

/* ---------- رندر صفحات ---------- */

function renderTopbar(title, subtitle, onBack) {
  return el("div", { class: "topbar" }, [
    el("div", {}, [
      el("h1", {}, [onBack ? el("button", { class: "icon-btn", onclick: onBack, "aria-label": "بازگشت", text: "→" }) : null, title]),
      subtitle ? el("div", { class: "sub", text: subtitle }) : null,
    ]),
  ]);
}

/* ---------- ناوبری پایین (مانند اپلیکیشن قیمت دلار و طلا) ---------- */

const NAV_SVG = {
  home: '<path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3m10-11v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>',
  history: '<path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>',
  stats: '<path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>',
  more: '<path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"/>',
  bolt: '<path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>',
};

function navBtn(tab, label, isActive, onClick) {
  const btn = el("button", {
    class: `market-nav-btn${isActive ? " is-active" : ""}`,
    type: "button",
    onclick: onClick,
  });
  btn.innerHTML =
    `<svg class="market-nav-svg" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">${NAV_SVG[tab]}</svg>` +
    `<span class="market-nav-label">${label}</span>`;
  return btn;
}

function renderBottomNav() {
  const activeTab =
    state.screen === "history" ? "history"
      : state.screen === "stats" ? "stats"
        : state.screen === "more" ? "more"
          : "home";

  const fabWrap = el("div", { class: "market-nav-fab-wrap" });
  const fab = el("button", {
    class: "market-nav-fab",
    type: "button",
    "aria-label": "آزمون سریع",
    title: "آزمون سریع",
    onclick: () => {
      state.confirmSheet = {
        title: "آزمون سریع",
        message: "یک آزمون ۲۰ سؤالی ترکیبی و تصادفی از همه رشته‌ها و دروس شروع شود؟ (۲۵ دقیقه، با نمره منفی)",
        confirmLabel: "شروع آزمون سریع",
        onConfirm: startQuickExam,
      };
      render();
    },
  });
  fab.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">${NAV_SVG.bolt}</svg>`;
  fabWrap.appendChild(fab);

  return el("nav", { class: "market-bottom-nav", "aria-label": "منوی اصلی" }, [
    navBtn("home", "خانه", activeTab === "home", goHome),
    navBtn("history", "کارنامه‌ها", activeTab === "history", goToHistory),
    fabWrap,
    navBtn("stats", "آمار", activeTab === "stats", goToStats),
    navBtn("more", "بیشتر", activeTab === "more", goToMore),
  ]);
}

function renderHome() {
  const results = loadResults();
  const totalExams = QUESTION_BANK.groups.reduce((n, g) => n + g.exams.length, 0);
  const totalQuestions = QUESTION_BANK.groups.reduce(
    (n, g) => n + g.exams.reduce((m, e) => m + e.questions.length, 0), 0);
  const avg = results.length
    ? results.reduce((s, r) => s + r.percent, 0) / results.length
    : null;

  const frag = [
    renderTopbar(`🎓 ${APP_TITLE}`, "آزمون‌های جامع چهارگزینه‌ای کارشناسی ارشد"),
    el("div", { class: "stats-row" }, [
      el("div", { class: "stat-box" }, [
        el("div", { class: "num", text: faNum(totalExams) }),
        el("div", { class: "lbl", text: "آزمون" }),
      ]),
      el("div", { class: "stat-box" }, [
        el("div", { class: "num", text: faNum(totalQuestions) }),
        el("div", { class: "lbl", text: "سؤال تشریحی‌دار" }),
      ]),
      el("div", { class: "stat-box" }, [
        el("div", { class: "num", text: avg == null ? "—" : formatPercent(avg) }),
        el("div", { class: "lbl", text: "میانگین شما" }),
      ]),
    ]),
    el("div", { class: "section-title" }, [
      "رشته‌ها و دروس",
      el("button", { class: "link", onclick: goToHistory, text: `کارنامه‌های من (${faNum(results.length)})` }),
    ]),
  ];

  for (const group of QUESTION_BANK.groups) {
    const examCount = group.exams.length;
    const qCount = group.exams.reduce((n, e) => n + e.questions.length, 0);
    frag.push(
      el("div", { class: "card tappable group-card", onclick: () => goToGroup(group.id) }, [
        el("div", { class: "emoji", text: group.icon || "📖" }),
        el("div", { class: "info" }, [
          el("div", { class: "title" }, [
            group.title,
            group.code ? el("span", { class: "badge", text: group.code }) : null,
          ]),
          el("div", { class: "desc", text: group.description || "" }),
          el("div", { class: "meta", text: `${faNum(examCount)} آزمون · ${faNum(qCount)} سؤال` }),
        ]),
        el("div", { class: "chev", text: "‹" }),
      ]),
    );
  }

  frag.push(el("div", { class: "footer-note", text: "نمره‌دهی مطابق کنکور سراسری: هر ۳ پاسخ غلط، یک پاسخ صحیح را خنثی می‌کند. سؤالات بر اساس منابع و سرفصل‌های رسمی آزمون کارشناسی ارشد طراحی شده‌اند." }));
  return frag;
}

function renderGroup() {
  const group = findGroup(state.groupId);
  if (!group) { goHome(); return []; }

  const frag = [renderTopbar(group.title, group.description, goHome)];

  for (const exam of group.exams) {
    const best = bestScoreFor(exam.id);
    const bestNode = best == null
      ? el("span", { class: "best none", text: "هنوز آزمون نداده‌اید" })
      : el("span", { class: `best ${pctClass(best)}`, text: `بهترین: ${formatPercent(best)}` });

    frag.push(
      el("div", { class: "card tappable exam-card", onclick: () => startExam(exam.id) }, [
        el("div", { class: "row1" }, [
          el("div", { class: "title", text: exam.title }),
          bestNode,
        ]),
        el("div", { class: "meta" }, [
          el("span", { text: `📝 ${faNum(exam.questions.length)} سؤال` }),
          el("span", { text: `⏱ ${faNum(exam.durationMinutes)} دقیقه` }),
          exam.subjectsLabel ? el("span", { text: `📚 ${exam.subjectsLabel}` }) : null,
        ]),
      ]),
    );
  }

  frag.push(el("div", { class: "footer-note", text: "با لمس هر آزمون، آزمون زمان‌دار آغاز می‌شود." }));
  return frag;
}

function renderExam() {
  const found = findExam(state.examId);
  if (!found) { goHome(); return []; }
  const { exam } = found;
  const q = exam.questions[state.currentIdx];
  const answered = state.answers.filter((a) => a != null).length;

  const nav = el("div", { class: "qnav" }, exam.questions.map((_, i) => {
    const classes = ["qbtn"];
    if (state.answers[i] != null) classes.push("answered");
    if (i === state.currentIdx) classes.push("current");
    if (state.flags[i]) classes.push("flagged");
    return el("button", {
      class: classes.join(" "),
      text: faNum(i + 1),
      onclick: () => { state.currentIdx = i; render(); },
    });
  }));

  const reading = q.reading ? (exam.readings || []).find((r) => r.id === q.reading) : null;
  const latinQ = isMostlyLatin(q.q);

  const options = q.options.map((opt, i) => {
    const selected = state.answers[state.currentIdx] === i;
    return el("button", {
      class: `option${selected ? " selected" : ""}${isMostlyLatin(opt) ? " ltr" : ""}`,
      onclick: () => {
        state.answers[state.currentIdx] = selected ? null : i;
        render();
      },
    }, [
      el("span", { class: "key", text: faNum(i + 1) }),
      el("span", { text: opt }),
    ]);
  });

  const isLast = state.currentIdx === exam.questions.length - 1;

  return [
    el("div", { class: "exam-head" }, [
      el("button", { class: "icon-btn", onclick: askExitExam, text: "✕ خروج" }),
      el("div", { style: "font-size:13px;font-weight:700;flex:1;text-align:center;", text: exam.title }),
      el("div", { class: `timer${state.remainingSec <= 60 ? " low" : ""}`, id: "examTimer", text: formatClock(state.remainingSec) }),
    ]),
    el("div", { class: "progress-track" }, [
      el("div", { class: "progress-fill", style: `width:${(answered / exam.questions.length) * 100}%` }),
    ]),
    nav,
    el("div", { class: "card" }, [
      el("span", { class: "subject-tag", text: `${q.subject} · سؤال ${faNum(state.currentIdx + 1)} از ${faNum(exam.questions.length)}` }),
      reading ? el("div", { class: "reading-box", text: reading.text }) : null,
      el("div", { class: `question-text${latinQ ? " ltr" : ""}`, text: q.q }),
      ...options,
    ]),
    el("div", { class: "exam-actions" }, [
      el("button", {
        class: "btn btn-outline",
        disabled: state.currentIdx === 0 ? "disabled" : null,
        onclick: () => { if (state.currentIdx > 0) { state.currentIdx -= 1; render(); } },
        text: "قبلی",
      }),
      el("button", {
        class: `btn btn-outline flag-btn${state.flags[state.currentIdx] ? " on" : ""}`,
        onclick: () => { state.flags[state.currentIdx] = !state.flags[state.currentIdx]; render(); },
        text: state.flags[state.currentIdx] ? "⚑ علامت‌دار" : "⚑ علامت‌گذاری",
      }),
      isLast
        ? el("button", { class: "btn btn-primary", onclick: askFinishExam, text: "پایان آزمون" })
        : el("button", {
            class: "btn btn-primary",
            onclick: () => { state.currentIdx += 1; render(); },
            text: "بعدی",
          }),
    ]),
    el("button", { class: "btn btn-danger", style: "margin-top:12px;", onclick: askFinishExam, text: "اتمام آزمون و مشاهده کارنامه" }),
  ];
}

function renderScoreRing(percent) {
  const clamped = Math.max(0, Math.min(100, percent));
  const r = 62;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - clamped / 100);
  const color = clamped >= 40 ? "var(--accent)" : clamped >= 20 ? "var(--warn)" : "var(--danger)";
  const ring = el("div", { class: "score-ring" });
  ring.innerHTML =
    `<svg width="148" height="148" viewBox="0 0 148 148">` +
    `<circle cx="74" cy="74" r="${r}" fill="none" stroke="var(--surface-2)" stroke-width="11"/>` +
    `<circle cx="74" cy="74" r="${r}" fill="none" stroke="${color}" stroke-width="11" stroke-linecap="round" ` +
    `stroke-dasharray="${c}" stroke-dashoffset="${offset}"/>` +
    `</svg>`;
  ring.appendChild(el("div", { class: "val" }, [
    document.createTextNode(formatPercent(percent)),
    el("small", { text: "با نمره منفی" }),
  ]));
  return ring;
}

function renderResult() {
  const r = state.result;
  if (!r) { goHome(); return []; }
  const verdict = verdictFor(r.percent);
  const found = findExam(r.examId);

  const subjectRows = r.subjects.map((s) => {
    const width = Math.max(0, Math.min(100, s.percent));
    const color = s.percent >= 40 ? "var(--accent)" : s.percent >= 20 ? "var(--warn)" : "var(--danger)";
    return el("div", { class: "subject-row" }, [
      el("div", { class: "head" }, [
        el("span", { text: s.name }),
        el("span", { class: "pct", text: formatPercent(s.percent) }),
      ]),
      el("div", { class: "bar" }, [el("div", { style: `width:${width}%;background:${color}` })]),
      el("div", { class: "detail", text: `صحیح ${faNum(s.correct)} · غلط ${faNum(s.wrong)} · بی‌پاسخ ${faNum(s.blank)} از ${faNum(s.total)} سؤال` }),
    ]);
  });

  return [
    renderTopbar("کارنامه آزمون", r.examTitle, () => {
      if (found) goToGroup(found.group.id); else goToHistory();
    }),
    el("div", { class: "card score-hero" }, [
      renderScoreRing(r.percent),
      el("div", { class: `score-verdict ${verdict.cls}`, text: `${verdict.icon} ${verdict.label}` }),
      el("div", { class: "score-sub", text: `${r.groupTitle} · ${formatDate(r.date)}${r.timedOut ? " · وقت آزمون تمام شد" : ""}` }),
    ]),
    el("div", { class: "result-grid" }, [
      el("div", { class: "stat-box" }, [
        el("div", { class: "num ok", text: faNum(r.correct) }),
        el("div", { class: "lbl", text: "صحیح" }),
      ]),
      el("div", { class: "stat-box" }, [
        el("div", { class: "num bad", text: faNum(r.wrong) }),
        el("div", { class: "lbl", text: "غلط" }),
      ]),
      el("div", { class: "stat-box" }, [
        el("div", { class: "num blank", text: faNum(r.blank) }),
        el("div", { class: "lbl", text: "بی‌پاسخ" }),
      ]),
      el("div", { class: "stat-box" }, [
        el("div", { class: "num info", text: faNum(r.total) }),
        el("div", { class: "lbl", text: "کل سؤالات" }),
      ]),
    ]),
    el("div", { class: "section-title" }, ["کارنامه به تفکیک درس"]),
    el("div", { class: "card" }, subjectRows),
    (found || r.questionsSnapshot)
      ? el("button", { class: "btn btn-primary", onclick: openReview, text: "مرور سؤالات و پاسخ‌های تشریحی" })
      : null,
    found ? el("button", { class: "btn btn-outline", onclick: () => startExam(r.examId), text: "آزمون مجدد" }) : null,
    el("button", { class: "btn btn-outline", onclick: goHome, text: "بازگشت به خانه" }),
  ];
}

function renderReview() {
  const r = state.result;
  if (!r) { goHome(); return []; }
  const found = findExam(r.examId);
  // برای آزمون سریع (یا آزمونی که دیگر در بانک نیست) از نسخه ذخیره‌شده در نتیجه استفاده می‌کنیم
  const exam = found ? found.exam : (r.questionsSnapshot ? { title: r.examTitle, questions: r.questionsSnapshot, readings: [] } : null);
  if (!exam) { goHome(); return []; }

  const cards = exam.questions.map((q, i) => {
    const user = r.answers[i];
    const isBlank = user == null;
    const isCorrect = user === q.answer;
    const status = isBlank
      ? el("span", { class: "review-status blank", text: "بی‌پاسخ" })
      : isCorrect
        ? el("span", { class: "review-status ok", text: "صحیح" })
        : el("span", { class: "review-status bad", text: "غلط" });

    const reading = q.reading ? (exam.readings || []).find((x) => x.id === q.reading) : null;

    const options = q.options.map((opt, oi) => {
      const classes = ["option"];
      if (isMostlyLatin(opt)) classes.push("ltr");
      if (oi === q.answer) classes.push("correct");
      else if (oi === user) classes.push("wrong");
      return el("div", { class: classes.join(" ") }, [
        el("span", { class: "key", text: faNum(oi + 1) }),
        el("span", { text: opt }),
      ]);
    });

    return el("div", { class: "card review-q" }, [
      el("div", { class: "qhead" }, [
        el("span", { class: "qnum", text: `سؤال ${faNum(i + 1)} · ${q.subject}` }),
        status,
      ]),
      reading ? el("div", { class: "reading-box", text: reading.text }) : null,
      el("div", { class: `question-text${isMostlyLatin(q.q) ? " ltr" : ""}`, style: "font-size:14px;", text: q.q }),
      ...options,
      el("div", { class: "explanation", html: `<b>پاسخ تشریحی:</b> ` }),
    ]);
  });

  // متن تشریحی را امن (بدون HTML خام) اضافه می‌کنیم
  cards.forEach((card, i) => {
    const exp = card.querySelector(".explanation");
    exp.appendChild(document.createTextNode(exam.questions[i].explanation));
  });

  return [
    renderTopbar("مرور پاسخ‌ها", r.examTitle, () => { state.screen = "result"; render(); }),
    ...cards,
    el("button", { class: "btn btn-outline", onclick: () => { state.screen = "result"; render(); }, text: "بازگشت به کارنامه" }),
  ];
}

function renderHistory() {
  const results = loadResults();

  const items = results.map((r) =>
    el("div", { class: "card tappable history-item", onclick: () => openResult(r) }, [
      el("div", { class: "row1" }, [
        el("div", {}, [
          el("div", { class: "title", text: r.examTitle }),
          el("div", { class: "date", text: `${r.groupTitle} · ${formatDate(r.date)}` }),
        ]),
        el("div", { class: `pct ${pctClass(r.percent)}`, text: formatPercent(r.percent) }),
      ]),
    ]));

  return [
    renderTopbar("کارنامه‌های من", `${faNum(results.length)} آزمون ثبت‌شده`, goHome),
    results.length === 0
      ? el("div", { class: "empty-note", text: "هنوز آزمونی نداده‌اید.\nاز صفحه اصلی یک رشته را انتخاب کنید و اولین آزمون خود را شروع کنید. 🎯" })
      : null,
    ...items,
  ];
}

function renderStats() {
  const results = loadResults();
  const avg = results.length ? results.reduce((s, r) => s + r.percent, 0) / results.length : null;
  const best = results.length ? Math.max(...results.map((r) => r.percent)) : null;

  const frag = [
    renderTopbar("آمار پیشرفت", "نمای کلی عملکرد شما در آزمون‌ها", goHome),
    el("div", { class: "stats-row" }, [
      el("div", { class: "stat-box" }, [
        el("div", { class: "num", text: faNum(results.length) }),
        el("div", { class: "lbl", text: "آزمون داده‌شده" }),
      ]),
      el("div", { class: "stat-box" }, [
        el("div", { class: "num", text: avg == null ? "—" : formatPercent(avg) }),
        el("div", { class: "lbl", text: "میانگین درصد" }),
      ]),
      el("div", { class: "stat-box" }, [
        el("div", { class: "num", text: best == null ? "—" : formatPercent(best) }),
        el("div", { class: "lbl", text: "بهترین درصد" }),
      ]),
    ]),
    el("div", { class: "section-title" }, ["وضعیت هر رشته"]),
  ];

  for (const group of QUESTION_BANK.groups) {
    const rows = group.exams.map((exam) => {
      const bestPct = bestScoreFor(exam.id);
      const attempts = loadResults().filter((r) => r.examId === exam.id).length;
      const width = bestPct == null ? 0 : Math.max(0, Math.min(100, bestPct));
      const color = bestPct == null ? "var(--surface-2)"
        : bestPct >= 40 ? "var(--accent)" : bestPct >= 20 ? "var(--warn)" : "var(--danger)";
      return el("div", { class: "subject-row" }, [
        el("div", { class: "head" }, [
          el("span", { text: exam.title }),
          el("span", { class: "pct", text: bestPct == null ? "—" : formatPercent(bestPct) }),
        ]),
        el("div", { class: "bar" }, [el("div", { style: `width:${width}%;background:${color}` })]),
        el("div", { class: "detail", text: attempts ? `${faNum(attempts)} بار آزمون داده‌اید` : "هنوز آزمون نداده‌اید" }),
      ]);
    });

    frag.push(
      el("div", { class: "card" }, [
        el("div", { style: "font-weight:700;font-size:14px;margin-bottom:12px;", text: `${group.icon || "📖"} ${group.title}` }),
        ...rows,
      ]),
    );
  }

  return frag;
}

function appVersionLabel() {
  try {
    if (typeof AndroidApp !== "undefined" && AndroidApp.getContentVersion) {
      return AndroidApp.getContentVersion();
    }
  } catch (e) { /* - */ }
  return (typeof APP_UPDATE_CONFIG !== "undefined" && APP_UPDATE_CONFIG.currentVersion) || "—";
}

function renderMore() {
  const themeRow = el("button", { class: "market-more-row", type: "button", onclick: toggleTheme }, [
    el("span", { class: "market-more-row-label", text: "تم اپلیکیشن" }),
    el("span", { class: "market-more-row-value", id: "themeToggleValue", text: currentTheme() === "light" ? "تم روشن" : "تم تاریک" }),
  ]);

  const copyright = el("p", { class: "market-more-copyright" });
  copyright.innerHTML =
    'طراحی و توسعه توسط <a href="https://t.me/m3hdi_v1" target="_blank" rel="noopener noreferrer" dir="ltr" class="accent">m3hdi_v1</a> | ' +
    `<span id="currentYear">${new Date().getFullYear()}</span> &copy;`;

  return [
    renderTopbar("بیشتر", null, goHome),
    el("section", { class: "market-more-section" }, [
      el("h3", { class: "market-more-section-title", text: "ظاهر" }),
      themeRow,
    ]),
    el("section", { class: "market-more-section" }, [
      el("h3", { class: "market-more-section-title", text: "آزمون" }),
      el("div", { class: "market-more-row market-more-row-static" }, [
        el("span", { class: "market-more-row-label", text: "تعداد آزمون‌ها" }),
        el("span", { class: "market-more-row-value", text: faNum(QUESTION_BANK.groups.reduce((n, g) => n + g.exams.length, 0)) }),
      ]),
      el("div", { class: "market-more-row market-more-row-static" }, [
        el("span", { class: "market-more-row-label", text: "تعداد سؤالات" }),
        el("span", { class: "market-more-row-value", text: faNum(QUESTION_BANK.groups.reduce((n, g) => n + g.exams.reduce((m, e) => m + e.questions.length, 0), 0)) }),
      ]),
      el("p", { class: "market-more-hint", text: "نمره‌دهی مطابق کنکور سراسری است: هر ۳ پاسخ غلط، یک پاسخ صحیح را خنثی می‌کند." }),
    ]),
    el("section", { class: "market-more-section", id: "appUpdateSection" }, [
      el("h3", { class: "market-more-section-title", text: "درباره" }),
      el("div", { class: "market-more-row market-more-row-static" }, [
        el("span", { class: "market-more-row-label", text: "نسخه اپلیکیشن" }),
        el("span", { class: "market-more-row-value", id: "appContentVersion", text: appVersionLabel() }),
      ]),
      el("p", { class: "market-more-hint", text: "بروزرسانی‌ها به‌صورت خودکار بررسی می‌شوند و در صورت وجود نسخه جدید، از شما تأیید گرفته می‌شود." }),
    ]),
    copyright,
  ];
}

function renderConfirmSheet() {
  const sheet = state.confirmSheet;
  if (!sheet) return null;
  return el("div", {
    class: "sheet-backdrop",
    onclick: (ev) => {
      if (ev.target.classList.contains("sheet-backdrop")) {
        state.confirmSheet = null;
        render();
      }
    },
  }, [
    el("div", { class: "sheet" }, [
      el("h3", { text: sheet.title }),
      el("p", { text: sheet.message }),
      el("button", {
        class: `btn ${sheet.danger ? "btn-danger" : "btn-primary"}`,
        onclick: () => { const fn = sheet.onConfirm; state.confirmSheet = null; fn(); },
        text: sheet.confirmLabel,
      }),
      el("button", {
        class: "btn btn-outline",
        onclick: () => { state.confirmSheet = null; render(); },
        text: "انصراف",
      }),
    ]),
  ]);
}

function render() {
  appEl.innerHTML = "";
  let nodes = [];
  if (state.screen === "home") nodes = renderHome();
  else if (state.screen === "group") nodes = renderGroup();
  else if (state.screen === "exam") nodes = renderExam();
  else if (state.screen === "result") nodes = renderResult();
  else if (state.screen === "review") nodes = renderReview();
  else if (state.screen === "history") nodes = renderHistory();
  else if (state.screen === "stats") nodes = renderStats();
  else if (state.screen === "more") nodes = renderMore();

  for (const node of nodes) {
    if (node) appEl.appendChild(node);
  }

  // ناوبری پایین در همه صفحات به‌جز حین آزمون
  const navVisible = state.screen !== "exam";
  document.body.classList.toggle("has-bottom-nav", navVisible);
  if (navVisible) appEl.appendChild(renderBottomNav());

  const sheetNode = renderConfirmSheet();
  if (sheetNode) appEl.appendChild(sheetNode);

  if (state.screen !== "exam") window.scrollTo(0, 0);
}

applyTheme(currentTheme());
render();
