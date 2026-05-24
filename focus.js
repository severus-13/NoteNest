function focusStorageKey() {
  const user = localStorage.getItem("noteNestUsername");
  return user ? `noteNestFocus_${user}` : "noteNestFocus";
}
const BREAK_MINUTES = 5;
const RING_CIRCUMFERENCE = 2 * Math.PI * 52;

const REFRESHMENT_TIPS = [
  "Drink a full glass of water — hydration helps focus.",
  "Follow the 20-20-20 rule: look at something 20 feet away for 20 seconds.",
  "Stand up and roll your shoulders back five times.",
  "Take a slow walk around your room or corridor.",
  "Do four deep breaths: in for 4, hold for 4, out for 4.",
  "Stretch your neck gently — tilt ear toward each shoulder.",
  "Rest your eyes: close them for 30 seconds without screens.",
  "Have a light healthy snack — fruit or nuts, not heavy sugar.",
  "Open a window or step outside for fresh air if you can.",
  "Wash your face with cool water to feel refreshed."
];

const PHASE = { IDLE: "idle", FOCUS: "focus", BREAK: "break", PAUSED: "paused" };
const FOCUS_MIN_LIMIT = 1;
const FOCUS_MAX_LIMIT = 180;
const DEFAULT_FOCUS_MINUTES = 25;

let phase = PHASE.IDLE;
let pausedFromPhase = PHASE.FOCUS;
let focusMinutes = DEFAULT_FOCUS_MINUTES;
let secondsLeft = 25 * 60;
let timerInterval = null;
let endTimestamp = null;
let originalTitle = "NoteNest";

const els = {
  widget: document.getElementById("focusWidget"),
  toggle: document.getElementById("focusToggle"),
  toggleIcon: document.getElementById("focusToggleIcon"),
  toggleLabel: document.getElementById("focusToggleLabel"),
  toggleTime: document.getElementById("focusToggleTime"),
  panel: document.getElementById("focusPanel"),
  phase: document.getElementById("focusPhase"),
  countdown: document.getElementById("focusCountdown"),
  ringProgress: document.getElementById("focusRingProgress"),
  durationPick: document.getElementById("focusDurationPick"),
  minutesInput: document.getElementById("focusMinutesInput"),
  startBtn: document.getElementById("focusStartBtn"),
  pauseBtn: document.getElementById("focusPauseBtn"),
  resetBtn: document.getElementById("focusResetBtn"),
  sessions: document.getElementById("focusSessions"),
  overlay: document.getElementById("breakOverlay"),
  breakTitle: document.getElementById("breakTitle"),
  breakTip: document.getElementById("breakTip"),
  breakIdeas: document.getElementById("breakIdeas"),
  breakTimerBlock: document.getElementById("breakTimerBlock"),
  breakCountdown: document.getElementById("breakCountdown"),
  breakStartBtn: document.getElementById("breakStartBtn"),
  breakSkipBtn: document.getElementById("breakSkipBtn")
};

function clampFocusMinutes(value, fallback = DEFAULT_FOCUS_MINUTES) {
  const n = Math.round(Number(value));
  if (Number.isNaN(n) || value === "") return fallback;
  return Math.min(FOCUS_MAX_LIMIT, Math.max(FOCUS_MIN_LIMIT, n));
}

function loadFocusPrefs() {
  try {
    return JSON.parse(localStorage.getItem(focusStorageKey())) || {};
  } catch {
    return {};
  }
}

function applyFocusMinutes(minutes, updateInput = true) {
  focusMinutes = clampFocusMinutes(minutes, focusMinutes);
  if (updateInput && els.minutesInput) {
    els.minutesInput.value = String(focusMinutes);
  }
  if (phase === PHASE.IDLE) {
    secondsLeft = focusMinutes * 60;
    updateDisplay();
  }
}

function saveFocusPrefs(extra = {}) {
  const data = loadFocusPrefs();
  const today = new Date().toDateString();
  let sessionsToday = data.sessionsToday || 0;
  if (data.sessionsDate !== today) sessionsToday = 0;
  localStorage.setItem(
    focusStorageKey(),
    JSON.stringify({ ...data, focusMinutes, sessionsToday, sessionsDate: today, ...extra })
  );
  updateSessionsLabel(extra.sessionsToday ?? sessionsToday);
}

function incrementSessionCount() {
  const data = loadFocusPrefs();
  const today = new Date().toDateString();
  let count = data.sessionsDate === today ? (data.sessionsToday || 0) : 0;
  saveFocusPrefs({ sessionsToday: count + 1, sessionsDate: today });
}

function updateSessionsLabel(count) {
  const data = loadFocusPrefs();
  const today = new Date().toDateString();
  const n = count ?? (data.sessionsDate === today ? data.sessionsToday || 0 : 0);
  els.sessions.textContent = `${n} focus session${n === 1 ? "" : "s"} today`;
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function pickTips(count = 3) {
  return [...REFRESHMENT_TIPS].sort(() => Math.random() - 0.5).slice(0, count);
}

function setRingProgress(ratio) {
  const offset = RING_CIRCUMFERENCE * (1 - Math.min(1, Math.max(0, ratio)));
  els.ringProgress.style.strokeDashoffset = String(offset);
}

function totalSecondsForPhase() {
  if (phase === PHASE.BREAK || pausedFromPhase === PHASE.BREAK) return BREAK_MINUTES * 60;
  return focusMinutes * 60;
}

function setDocumentTitle() {
  if (phase === PHASE.FOCUS || phase === PHASE.BREAK) {
    document.title = `${formatTime(secondsLeft)} · ${phase === PHASE.BREAK ? "Break" : "Focus"} — NoteNest`;
  } else {
    document.title = originalTitle;
  }
}

function updateDisplay() {
  const formatted = formatTime(secondsLeft);
  els.countdown.textContent = formatted;
  els.toggleTime.textContent = formatted;
  els.toggleTime.classList.toggle("hidden", phase === PHASE.IDLE);

  const total = totalSecondsForPhase();
  setRingProgress(total > 0 ? secondsLeft / total : 1);

  if (phase === PHASE.FOCUS) {
    els.phase.textContent = "Focusing";
    els.toggleIcon.textContent = "📖";
    els.toggleLabel.textContent = "Focus";
    els.widget.classList.add("focus-widget--active");
    els.widget.classList.remove("focus-widget--break");
  } else if (phase === PHASE.BREAK) {
    els.phase.textContent = "Break time";
    els.toggleIcon.textContent = "🧘";
    els.toggleLabel.textContent = "Break";
    els.widget.classList.add("focus-widget--break");
    els.widget.classList.remove("focus-widget--active");
    els.breakCountdown.textContent = formatted;
  } else if (phase === PHASE.PAUSED) {
    els.phase.textContent = "Paused";
  } else {
    els.phase.textContent = "Ready";
    els.toggleIcon.textContent = "📖";
    els.toggleLabel.textContent = "Focus";
    els.widget.classList.remove("focus-widget--active", "focus-widget--break");
    els.countdown.textContent = formatTime(focusMinutes * 60);
    setRingProgress(1);
  }

  setDocumentTitle();
}

function updateControls() {
  const running = phase === PHASE.FOCUS || phase === PHASE.BREAK;
  const paused = phase === PHASE.PAUSED;

  els.durationPick.classList.toggle("hidden", running || paused);
  if (els.minutesInput) els.minutesInput.disabled = running || paused;
  els.pauseBtn.classList.toggle("hidden", !running);
  els.resetBtn.classList.toggle("hidden", phase === PHASE.IDLE);

  if (paused) {
    els.startBtn.classList.remove("hidden");
    els.startBtn.textContent = "Resume";
  } else if (running) {
    els.startBtn.classList.add("hidden");
    els.pauseBtn.textContent = "Pause";
  } else {
    els.startBtn.classList.remove("hidden");
    els.startBtn.textContent = "Start focus";
  }
}

function clearTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  endTimestamp = null;
}

function tick() {
  if (!endTimestamp) return;
  secondsLeft = Math.max(0, Math.ceil((endTimestamp - Date.now()) / 1000));
  updateDisplay();
  if (secondsLeft <= 0) {
    clearTimer();
    onPhaseComplete();
  }
}

function startTimer(durationSeconds, nextPhase) {
  clearTimer();
  phase = nextPhase;
  pausedFromPhase = nextPhase;
  secondsLeft = durationSeconds;
  endTimestamp = Date.now() + durationSeconds * 1000;
  updateDisplay();
  updateControls();
  timerInterval = setInterval(tick, 250);
  tick();
}

function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function sendNotification(title, body) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body });
  }
}

function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 523;
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.45);
  } catch {
    /* optional */
  }
}

function populateBreakModal() {
  const tips = pickTips(3);
  els.breakTitle.textContent = "Great work — time to refresh!";
  els.breakTip.textContent = tips[0];
  els.breakIdeas.innerHTML = tips.map((t) => `<li>${t}</li>`).join("");
  els.breakTimerBlock.classList.add("hidden");
  els.breakStartBtn.classList.remove("hidden");
  els.breakStartBtn.textContent = "Start 5 min break";
  els.breakSkipBtn.classList.remove("hidden");
  els.breakSkipBtn.textContent = "Skip break — focus again";
}

function showBreakModal() {
  populateBreakModal();
  els.overlay.classList.remove("hidden");
}

function hideBreakModal() {
  els.overlay.classList.add("hidden");
}

function onPhaseComplete() {
  if (phase === PHASE.FOCUS) {
    incrementSessionCount();
    playChime();
    sendNotification("NoteNest — Break time!", "You focused well. Take 5 minutes to refresh.");
    phase = PHASE.IDLE;
    secondsLeft = focusMinutes * 60;
    updateDisplay();
    updateControls();
    showBreakModal();
    return;
  }

  if (phase === PHASE.BREAK) {
    playChime();
    sendNotification("NoteNest — Break over!", "Ready for another focus session?");
    phase = PHASE.IDLE;
    secondsLeft = focusMinutes * 60;
    els.breakTitle.textContent = "Break complete!";
    els.breakTip.textContent = "You're recharged. Start another session when ready.";
    els.breakTimerBlock.classList.add("hidden");
    els.breakStartBtn.textContent = "Start focus session";
    els.breakStartBtn.classList.remove("hidden");
    els.breakSkipBtn.classList.add("hidden");
    els.overlay.classList.remove("hidden");
    updateDisplay();
    updateControls();
  }
}

function startFocus() {
  hideBreakModal();
  requestNotificationPermission();
  applyFocusMinutes(els.minutesInput?.value ?? focusMinutes, true);
  saveFocusPrefs({ focusMinutes });
  startTimer(focusMinutes * 60, PHASE.FOCUS);
}

function startBreak() {
  els.breakTimerBlock.classList.remove("hidden");
  els.breakStartBtn.classList.add("hidden");
  startTimer(BREAK_MINUTES * 60, PHASE.BREAK);
}

function pauseTimer() {
  if (phase !== PHASE.FOCUS && phase !== PHASE.BREAK) return;
  pausedFromPhase = phase;
  clearTimer();
  phase = PHASE.PAUSED;
  updateDisplay();
  updateControls();
}

function resumeTimer() {
  if (phase !== PHASE.PAUSED) return;
  phase = pausedFromPhase;
  endTimestamp = Date.now() + secondsLeft * 1000;
  updateControls();
  timerInterval = setInterval(tick, 250);
  tick();
}

function resetTimer() {
  clearTimer();
  hideBreakModal();
  phase = PHASE.IDLE;
  secondsLeft = focusMinutes * 60;
  updateDisplay();
  updateControls();
}

function togglePanel() {
  const isHidden = els.panel.classList.toggle("hidden");
  els.toggle.setAttribute("aria-expanded", String(!isHidden));
  els.widget.classList.toggle("focus-widget--open", !isHidden);
}

function initFocusWidget() {
  const data = loadFocusPrefs();
  applyFocusMinutes(data.focusMinutes ?? DEFAULT_FOCUS_MINUTES);
  saveFocusPrefs();
  secondsLeft = focusMinutes * 60;

  els.ringProgress.style.strokeDasharray = `${RING_CIRCUMFERENCE}`;
  setRingProgress(1);
  updateDisplay();
  updateControls();

  els.minutesInput.disabled = false;

  els.minutesInput.addEventListener("input", () => {
    if (phase !== PHASE.IDLE) return;
    applyFocusMinutes(els.minutesInput.value, false);
  });

  els.minutesInput.addEventListener("change", () => {
    if (phase !== PHASE.IDLE) return;
    applyFocusMinutes(els.minutesInput.value);
    saveFocusPrefs({ focusMinutes });
  });

  els.minutesInput.addEventListener("blur", () => {
    applyFocusMinutes(els.minutesInput.value);
    if (phase === PHASE.IDLE) saveFocusPrefs({ focusMinutes });
  });

  els.toggle.addEventListener("click", togglePanel);
  els.startBtn.addEventListener("click", () => {
    if (phase === PHASE.PAUSED) resumeTimer();
    else if (els.breakStartBtn.textContent === "Start focus session" && !els.overlay.classList.contains("hidden")) {
      hideBreakModal();
      startFocus();
    } else startFocus();
  });
  els.pauseBtn.addEventListener("click", pauseTimer);
  els.resetBtn.addEventListener("click", resetTimer);
  els.breakStartBtn.addEventListener("click", () => {
    if (els.breakStartBtn.textContent === "Start focus session") {
      hideBreakModal();
      startFocus();
    } else {
      startBreak();
    }
  });
  els.breakSkipBtn.addEventListener("click", () => {
    hideBreakModal();
    resetTimer();
    startFocus();
  });
  els.overlay.addEventListener("click", (e) => {
    if (e.target === els.overlay && phase === PHASE.IDLE) hideBreakModal();
  });
}

initFocusWidget();
