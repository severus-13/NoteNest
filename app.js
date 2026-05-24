const DB_NAME = "SemesterNotesHub";
const DB_VERSION = 3;
const STORE = "files";

let db = null;
let currentSemester = null;
let currentSubject = null;
let currentType = null;
let currentModule = null;
let fileSearchQuery = "";
let timetableEditMode = false;
let timetableDraft = null;

const views = {
  semester: document.getElementById("semesterView"),
  subjects: document.getElementById("subjectsView"),
  subject: document.getElementById("subjectView")
};

const yearGroups = document.getElementById("yearGroups");
const recentList = document.getElementById("recentList");
const recentEmpty = document.getElementById("recentEmpty");
const statFiles = document.getElementById("statFiles");
const statSize = document.getElementById("statSize");
const statSemesters = document.getElementById("statSemesters");
const statSubjects = document.getElementById("statSubjects");

const YEAR_GROUPS = [
  { label: "Year 1 — Foundation", semesters: [1, 2] },
  { label: "Year 2 — Core CS", semesters: [3, 4] },
  { label: "Year 3 — Advanced", semesters: [5, 6] },
  { label: "Year 4 — Specialization", semesters: [7, 8] }
];

const CURRENT_SEMESTER_KEY = "currentSemester";
const CUSTOM_TIMETABLES_KEY = "customTimetables";
const CUSTOM_SUBJECTS_KEY = "customSubjects";

function userStorageKey(base) {
  const user = getCurrentUser();
  return user ? `${base}_${user}` : base;
}

const TYPE_LABELS = {
  notes: "Notes",
  assignments: "Assignments",
  ppt: "Presentations",
  other: "Question Paper"
};

const FILE_TYPES = [
  { type: "notes", icon: "📚", label: "Notes", hint: "Lecture notes, PDFs & study sheets" },
  { type: "assignments", icon: "✏️", label: "Assignments", hint: "Submissions, lab work & projects" },
  { type: "ppt", icon: "📽️", label: "Presentations", hint: "PPT slides & seminar decks" },
  { type: "other", icon: "📋", label: "Question Paper", hint: "Previous year papers, model exams & QP sets" }
];

const subjectsGrid = document.getElementById("subjectsGrid");
const subjectsTitle = document.getElementById("subjectsTitle");
const editSubjectsBtn = document.getElementById("editSubjectsBtn");
const subjectsEditPanel = document.getElementById("subjectsEditPanel");
const subjectsEditList = document.getElementById("subjectsEditList");
const addSubjectBtn = document.getElementById("addSubjectBtn");
const saveSubjectsBtn = document.getElementById("saveSubjectsBtn");
const cancelSubjectsBtn = document.getElementById("cancelSubjectsBtn");
const resetSubjectsBtn = document.getElementById("resetSubjectsBtn");
const subjectsEmpty = document.getElementById("subjectsEmpty");

let subjectsEditMode = false;
const backBtn = document.getElementById("backBtn");
const siteHeader = document.getElementById("siteHeader");
const pageTitle = document.getElementById("pageTitle");
const pageSubtitle = document.getElementById("pageSubtitle");
const brandHome = document.getElementById("brandHome");

const HOME_SUBTITLE = "Your personal study hub for every semester";

const SUBJECT_ICONS = ["📚", "📐", "💻", "🔬", "🧮", "📝", "⚗️", "🎓"];

const MODULES = [
  { num: 1, label: "Module 1", icon: "M1" },
  { num: 2, label: "Module 2", icon: "M2" },
  { num: 3, label: "Module 3", icon: "M3" },
  { num: 4, label: "Module 4", icon: "M4" }
];

function setHeaderHome() {
  siteHeader.classList.add("header--home");
  siteHeader.classList.remove("header--sub");
  pageTitle.classList.add("hidden");
  pageTitle.textContent = "";
  pageSubtitle.textContent = HOME_SUBTITLE;
}

function setHeaderSub(title, subtitle) {
  siteHeader.classList.remove("header--home");
  siteHeader.classList.add("header--sub");
  pageTitle.classList.remove("hidden");
  pageTitle.textContent = title;
  pageSubtitle.textContent = subtitle;
}
const subjectBadge = document.getElementById("subjectBadge");
const subjectTitle = document.getElementById("subjectTitle");
const fileList = document.getElementById("fileList");
const emptyState = document.getElementById("emptyState");
const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const typeIcons = document.getElementById("typeIcons");
const moduleIcons = document.getElementById("moduleIcons");
const modulePrompt = document.getElementById("modulePrompt");
const filesPanel = document.getElementById("filesPanel");
const filesPanelTitle = document.getElementById("filesPanelTitle");
const subjectPrompt = document.getElementById("subjectPrompt");
const backToModules = document.getElementById("backToModules");
const uploadHint = document.getElementById("uploadHint");
const fileSearch = document.getElementById("fileSearch");
const noSearchResults = document.getElementById("noSearchResults");
const timetableSemLabel = document.getElementById("timetableSemLabel");
const timetableView = document.getElementById("timetableView");
const timetableEdit = document.getElementById("timetableEdit");
const editTimetableBtn = document.getElementById("editTimetableBtn");

function getStoredSemester() {
  const n = parseInt(localStorage.getItem(userStorageKey(CURRENT_SEMESTER_KEY)), 10);
  return n >= 1 && n <= 8 ? n : null;
}

function setStoredSemester(num) {
  localStorage.setItem(userStorageKey(CURRENT_SEMESTER_KEY), String(num));
}

function getCustomTimetables() {
  try {
    return JSON.parse(localStorage.getItem(userStorageKey(CUSTOM_TIMETABLES_KEY))) || {};
  } catch {
    return {};
  }
}

function getTimetableForSemester(semNum) {
  const custom = getCustomTimetables();
  if (custom[String(semNum)]) return custom[String(semNum)];
  if (TIMETABLES[semNum]) return JSON.parse(JSON.stringify(TIMETABLES[semNum]));
  return [];
}

function saveTimetableForSemester(semNum, data) {
  const custom = getCustomTimetables();
  custom[String(semNum)] = data;
  localStorage.setItem(userStorageKey(CUSTOM_TIMETABLES_KEY), JSON.stringify(custom));
}

function resetTimetableForSemester(semNum) {
  const custom = getCustomTimetables();
  delete custom[String(semNum)];
  localStorage.setItem(userStorageKey(CUSTOM_TIMETABLES_KEY), JSON.stringify(custom));
}

function getCustomSubjectsMap() {
  try {
    return JSON.parse(localStorage.getItem(userStorageKey(CUSTOM_SUBJECTS_KEY))) || {};
  } catch {
    return {};
  }
}

function getDefaultSubjects(semNum) {
  return [...(SEMESTERS[semNum]?.subjects || [])];
}

function getSubjectsForSemester(semNum) {
  const custom = getCustomSubjectsMap();
  if (custom[String(semNum)] && Array.isArray(custom[String(semNum)])) {
    return custom[String(semNum)].filter((s) => String(s).trim());
  }
  return getDefaultSubjects(semNum);
}

function saveSubjectsForSemester(semNum, subjects) {
  const custom = getCustomSubjectsMap();
  const cleaned = subjects.map((s) => s.trim()).filter(Boolean);
  custom[String(semNum)] = cleaned;
  localStorage.setItem(userStorageKey(CUSTOM_SUBJECTS_KEY), JSON.stringify(custom));
}

function resetSubjectsForSemester(semNum) {
  const custom = getCustomSubjectsMap();
  delete custom[String(semNum)];
  localStorage.setItem(userStorageKey(CUSTOM_SUBJECTS_KEY), JSON.stringify(custom));
}

function hasCustomSubjects(semNum) {
  return Boolean(getCustomSubjectsMap()[String(semNum)]);
}

function totalSubjectCount() {
  let total = 0;
  for (let i = 1; i <= 8; i++) {
    total += getSubjectsForSemester(i).length;
  }
  return total;
}

function closeSubjectsEdit() {
  subjectsEditMode = false;
  subjectsEditPanel?.classList.add("hidden");
  subjectsGrid?.classList.remove("hidden");
  editSubjectsBtn.textContent = "Edit subjects";
}

function renderSubjectsEditList(subjects) {
  subjectsEditList.innerHTML = "";
  subjects.forEach((name, idx) => {
    const li = document.createElement("li");
    li.className = "subjects-edit-item";
    li.innerHTML = `
      <input type="text" class="edit-input subjects-edit-input" value="${escapeHtml(name)}" placeholder="Subject name" maxlength="80">
      <button type="button" class="icon-btn remove-subject-btn" title="Remove subject" data-idx="${idx}">×</button>
    `;
    li.querySelector(".remove-subject-btn").addEventListener("click", () => {
      const inputs = collectSubjectsFromEditForm();
      inputs.splice(idx, 1);
      renderSubjectsEditList(inputs.length ? inputs : [""]);
    });
    subjectsEditList.appendChild(li);
  });
}

function collectSubjectsFromEditForm() {
  return [...subjectsEditList.querySelectorAll(".subjects-edit-input")].map((input) => input.value);
}

function openSubjectsEdit() {
  if (!currentSemester) return;
  subjectsEditMode = true;
  subjectsEditPanel.classList.remove("hidden");
  subjectsGrid.classList.add("hidden");
  subjectsEmpty?.classList.add("hidden");
  editSubjectsBtn.textContent = "Editing…";
  renderSubjectsEditList(getSubjectsForSemester(currentSemester));
}

function renderSubjectsGrid(semNum) {
  const subjects = getSubjectsForSemester(semNum);
  subjectsGrid.innerHTML = "";
  subjectsEmpty?.classList.toggle("hidden", subjects.length > 0);

  subjects.forEach((name, idx) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "subject-card";
    const subIcon = SUBJECT_ICONS[idx % SUBJECT_ICONS.length];
    card.innerHTML = `<span class="icon subject-icon">${subIcon}</span><span class="name">${escapeHtml(name)}</span>`;
    card.addEventListener("click", () => selectSubject(name));
    subjectsGrid.appendChild(card);
  });
}

function saveSubjectsFromEdit() {
  const names = collectSubjectsFromEditForm().map((s) => s.trim()).filter(Boolean);
  if (!names.length) {
    alert("Add at least one subject name.");
    return;
  }
  const seen = new Set();
  for (const n of names) {
    const key = n.toLowerCase();
    if (seen.has(key)) {
      alert(`Duplicate subject: "${n}". Each name must be unique.`);
      return;
    }
    seen.add(key);
  }
  saveSubjectsForSemester(currentSemester, names);
  closeSubjectsEdit();
  renderSubjectsGrid(currentSemester);
  refreshHome();
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function renderTimetableView(days) {
  if (!days.length) {
    timetableView.innerHTML = '<p class="timetable-placeholder">No classes scheduled. Click Edit to add your timetable.</p>';
    return;
  }
  timetableView.innerHTML = days
    .map(
      (day) => `
      <div class="timetable-day">
        <div class="timetable-day-name">${escapeHtml(day.day)}</div>
        <ul class="timetable-slots">
          ${(day.slots || [])
            .map(
              (s) => `
            <li class="timetable-slot">
              <span class="slot-time">${escapeHtml(s.time)}</span>
              <span class="slot-subject">${escapeHtml(s.subject)}</span>
            </li>`
            )
            .join("")}
        </ul>
      </div>`
    )
    .join("");
}

function renderTimetableEditForm() {
  if (!timetableDraft) return;
  timetableEdit.innerHTML = `
    <div class="timetable-edit-form" id="timetableEditForm">
      ${timetableDraft
        .map(
          (day, dayIdx) => `
        <div class="edit-day" data-day-idx="${dayIdx}">
          <div class="edit-day-header">
            <input type="text" class="edit-input edit-day-name" value="${escapeHtml(day.day)}" placeholder="Day name" data-field="day">
            <button type="button" class="text-btn danger remove-day-btn" data-day-idx="${dayIdx}">Remove day</button>
          </div>
          <div class="edit-slots">
            ${(day.slots || [])
              .map(
                (slot, slotIdx) => `
              <div class="edit-slot" data-day-idx="${dayIdx}" data-slot-idx="${slotIdx}">
                <input type="text" class="edit-input" value="${escapeHtml(slot.time)}" placeholder="Time" data-field="time">
                <input type="text" class="edit-input" value="${escapeHtml(slot.subject)}" placeholder="Subject" data-field="subject">
                <button type="button" class="icon-btn remove-slot-btn" title="Remove slot" data-day-idx="${dayIdx}" data-slot-idx="${slotIdx}">×</button>
              </div>`
              )
              .join("")}
          </div>
          <button type="button" class="text-btn add-slot-btn" data-day-idx="${dayIdx}">+ Add period</button>
        </div>`
        )
        .join("")}
    </div>
    <button type="button" class="text-btn" id="addDayBtn">+ Add day</button>
    <div class="timetable-edit-actions">
      <button type="button" class="btn-primary" id="saveTimetableBtn">Save timetable</button>
      <button type="button" class="btn-secondary" id="cancelTimetableBtn">Cancel</button>
      <button type="button" class="text-btn danger" id="resetTimetableBtn">Reset to default</button>
    </div>
  `;

  timetableEdit.querySelector("#addDayBtn").addEventListener("click", () => {
    timetableDraft.push({ day: "New Day", slots: [{ time: "9:00–10:00", subject: "" }] });
    renderTimetableEditForm();
  });

  timetableEdit.querySelectorAll(".add-slot-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.dayIdx, 10);
      timetableDraft[idx].slots.push({ time: "", subject: "" });
      renderTimetableEditForm();
    });
  });

  timetableEdit.querySelectorAll(".remove-day-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.dayIdx, 10);
      if (timetableDraft.length <= 1) {
        alert("Keep at least one day in your timetable.");
        return;
      }
      timetableDraft.splice(idx, 1);
      renderTimetableEditForm();
    });
  });

  timetableEdit.querySelectorAll(".remove-slot-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const dayIdx = parseInt(btn.dataset.dayIdx, 10);
      const slotIdx = parseInt(btn.dataset.slotIdx, 10);
      timetableDraft[dayIdx].slots.splice(slotIdx, 1);
      renderTimetableEditForm();
    });
  });

  document.getElementById("saveTimetableBtn").addEventListener("click", saveTimetableFromForm);
  document.getElementById("cancelTimetableBtn").addEventListener("click", exitTimetableEdit);
  document.getElementById("resetTimetableBtn").addEventListener("click", resetTimetableToDefault);
}

function collectTimetableFromForm() {
  const form = document.getElementById("timetableEditForm");
  if (!form) return [];
  return [...form.querySelectorAll(".edit-day")].map((dayEl) => {
    const day = dayEl.querySelector(".edit-day-name").value.trim() || "Day";
    const slots = [...dayEl.querySelectorAll(".edit-slot")].map((slotEl) => ({
      time: slotEl.querySelector('[data-field="time"]').value.trim(),
      subject: slotEl.querySelector('[data-field="subject"]').value.trim()
    })).filter((s) => s.time || s.subject);
    return { day, slots };
  });
}

function saveTimetableFromForm() {
  const semNum = getStoredSemester();
  if (!semNum) return;
  timetableDraft = collectTimetableFromForm();
  saveTimetableForSemester(semNum, timetableDraft);
  exitTimetableEdit();
  renderTimetable();
}

function resetTimetableToDefault() {
  const semNum = getStoredSemester();
  if (!semNum) return;
  if (!confirm("Reset this semester's timetable to the default schedule? Your edits will be lost.")) return;
  resetTimetableForSemester(semNum);
  timetableDraft = JSON.parse(JSON.stringify(TIMETABLES[semNum] || []));
  renderTimetableEditForm();
}

function enterTimetableEdit() {
  const semNum = getStoredSemester();
  if (!semNum) return;
  timetableEditMode = true;
  timetableDraft = JSON.parse(JSON.stringify(getTimetableForSemester(semNum)));
  timetableView.classList.add("hidden");
  timetableEdit.classList.remove("hidden");
  editTimetableBtn.textContent = "Viewing…";
  editTimetableBtn.disabled = true;
  renderTimetableEditForm();
}

function exitTimetableEdit() {
  timetableEditMode = false;
  timetableDraft = null;
  timetableView.classList.remove("hidden");
  timetableEdit.classList.add("hidden");
  timetableEdit.innerHTML = "";
  editTimetableBtn.textContent = "Edit";
  editTimetableBtn.disabled = false;
}

function renderTimetable() {
  const semNum = getStoredSemester();
  editTimetableBtn.classList.toggle("hidden", !semNum);

  if (timetableEditMode) return;

  if (!semNum) {
    timetableSemLabel.textContent = "Select a semester to view your timetable";
    timetableView.innerHTML =
      '<p class="timetable-placeholder">Click any semester card on the left to set it as your current semester.</p>';
    return;
  }

  const sem = SEMESTERS[semNum];
  timetableSemLabel.textContent = sem.label;
  renderTimetableView(getTimetableForSemester(semNum));
}

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      db = req.result;
      resolve(db);
    };
    req.onupgradeneeded = (e) => {
      const database = e.target.result;
      if (!database.objectStoreNames.contains(STORE)) {
        const store = database.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
        store.createIndex("byPath", ["semester", "subject", "type", "module"], { unique: false });
      } else {
        const tx = e.target.transaction;
        const store = tx.objectStore(STORE);
        if (e.oldVersion < 2 && !store.indexNames.contains("byPath")) {
          store.createIndex("byPath", ["semester", "subject", "type", "module"], { unique: false });
        }
        if (e.oldVersion < 3 && !store.indexNames.contains("byUser")) {
          store.createIndex("byUser", "username", { unique: false });
        }
      }
    };
  });
}

function fileModule(f) {
  return f.module || 1;
}

function fileKey() {
  return {
    semester: currentSemester,
    subject: currentSubject,
    type: currentType,
    module: currentModule
  };
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function formatDate(ts) {
  return new Date(ts).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function fileEmoji(name) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  const map = {
    pdf: "📄", doc: "📝", docx: "📝", ppt: "📊", pptx: "📊",
    xls: "📈", xlsx: "📈", png: "🖼️", jpg: "🖼️", jpeg: "🖼️", zip: "📦"
  };
  return map[ext] || "📎";
}

const EXT_MIME = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  bmp: "image/bmp",
  mp4: "video/mp4",
  webm: "video/webm",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  txt: "text/plain",
  md: "text/plain",
  csv: "text/csv",
  json: "application/json",
  html: "text/html",
  htm: "text/html"
};

let viewerObjectUrl = null;
let viewerCurrentFile = null;

const fileViewer = document.getElementById("fileViewer");
const fileViewerTitle = document.getElementById("fileViewerTitle");
const fileViewerBody = document.getElementById("fileViewerBody");
const fileViewerClose = document.getElementById("fileViewerClose");
const fileViewerBackdrop = document.getElementById("fileViewerBackdrop");
const fileViewerDownload = document.getElementById("fileViewerDownload");

function fileExtension(name) {
  return name.split(".").pop()?.toLowerCase() || "";
}

function resolveMime(file) {
  if (file.mime) return file.mime;
  return EXT_MIME[fileExtension(file.name)] || "application/octet-stream";
}

function getViewKind(file) {
  const ext = fileExtension(file.name);
  const mime = resolveMime(file).toLowerCase();
  if (mime.includes("pdf") || ext === "pdf") return "pdf";
  if (mime.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"].includes(ext)) return "image";
  if (mime.startsWith("video/") || ["mp4", "webm", "ogg", "mov"].includes(ext)) return "video";
  if (mime.startsWith("audio/") || ["mp3", "wav", "ogg", "m4a"].includes(ext)) return "audio";
  if (
    mime.startsWith("text/") ||
    mime === "application/json" ||
    ["txt", "md", "csv", "json", "html", "htm", "css", "js", "xml"].includes(ext)
  ) {
    return "text";
  }
  return "unsupported";
}

function fileToBlob(file) {
  return new Blob([file.data], { type: resolveMime(file) });
}

function downloadFileRecord(file) {
  const blob = fileToBlob(file);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  URL.revokeObjectURL(url);
}

function closeFileViewer() {
  if (viewerObjectUrl) {
    URL.revokeObjectURL(viewerObjectUrl);
    viewerObjectUrl = null;
  }
  viewerCurrentFile = null;
  fileViewerBody.innerHTML = "";
  fileViewer.classList.add("hidden");
  document.body.classList.remove("file-viewer-open");
}

async function openFileViewer(file) {
  closeFileViewer();
  viewerCurrentFile = file;
  const blob = fileToBlob(file);
  viewerObjectUrl = URL.createObjectURL(blob);
  const kind = getViewKind(file);

  fileViewerTitle.textContent = file.name;
  fileViewerBody.innerHTML = "";

  if (kind === "pdf") {
    const iframe = document.createElement("iframe");
    iframe.className = "file-viewer-iframe";
    iframe.src = viewerObjectUrl;
    iframe.title = file.name;
    fileViewerBody.appendChild(iframe);
  } else if (kind === "image") {
    const img = document.createElement("img");
    img.className = "file-viewer-image";
    img.src = viewerObjectUrl;
    img.alt = file.name;
    fileViewerBody.appendChild(img);
  } else if (kind === "video") {
    const video = document.createElement("video");
    video.className = "file-viewer-media";
    video.src = viewerObjectUrl;
    video.controls = true;
    video.playsInline = true;
    fileViewerBody.appendChild(video);
  } else if (kind === "audio") {
    const audio = document.createElement("audio");
    audio.className = "file-viewer-audio";
    audio.src = viewerObjectUrl;
    audio.controls = true;
    fileViewerBody.appendChild(audio);
  } else if (kind === "text") {
    try {
      const text = await blob.text();
      const pre = document.createElement("pre");
      pre.className = "file-viewer-text";
      pre.textContent = text;
      fileViewerBody.appendChild(pre);
    } catch {
      fileViewerBody.innerHTML = `<p class="file-viewer-fallback">Could not display this file. Use Download instead.</p>`;
    }
  } else {
    fileViewerBody.innerHTML = `
      <div class="file-viewer-fallback">
        <p><strong>Preview not available</strong> for this file type in the browser.</p>
        <p class="file-viewer-fallback-hint">Word, PowerPoint, and Excel files need to be downloaded to open in another app.</p>
        <button type="button" class="btn-primary file-viewer-open-tab" id="fileViewerOpenTab">Try open in new tab</button>
      </div>
    `;
    fileViewerBody.querySelector("#fileViewerOpenTab")?.addEventListener("click", () => {
      window.open(viewerObjectUrl, "_blank", "noopener");
    });
  }

  fileViewer.classList.remove("hidden");
  document.body.classList.add("file-viewer-open");
}

function showView(name) {
  Object.values(views).forEach((v) => v.classList.remove("active"));
  views[name].classList.add("active");
  backBtn.classList.toggle("hidden", name === "semester");
  if (name === "semester") setHeaderHome();
}

function fileBelongsToCurrentUser(file) {
  const user = getCurrentUser();
  return user && file.username === user;
}

function getAllFiles() {
  const user = getCurrentUser();
  if (!user) return Promise.resolve([]);

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    if (store.indexNames.contains("byUser")) {
      const req = store.index("byUser").getAll(user);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    } else {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result.filter((f) => f.username === user));
      req.onerror = () => reject(req.error);
    }
  });
}

function filesForSemester(all, num) {
  return all.filter((f) => f.semester === num);
}

async function refreshHome() {
  const all = await getAllFiles();
  const totalSize = all.reduce((n, f) => n + (f.size || 0), 0);
  const semestersUsed = new Set(all.map((f) => f.semester)).size;

  statFiles.textContent = all.length;
  statSize.textContent = formatSize(totalSize);
  statSemesters.textContent = semestersUsed;
  statSubjects.textContent = totalSubjectCount();

  yearGroups.innerHTML = "";
  YEAR_GROUPS.forEach((year) => {
    const block = document.createElement("div");
    block.className = "year-block";
    const grid = document.createElement("div");
    grid.className = "semester-grid";

    year.semesters.forEach((i) => {
      const sem = SEMESTERS[i];
      const semFiles = filesForSemester(all, i);
      const card = document.createElement("button");
      card.type = "button";
      card.className = "semester-card";
      const badgeClass = semFiles.length ? "file-badge" : "file-badge empty";
      const badgeText = semFiles.length ? `${semFiles.length} file${semFiles.length === 1 ? "" : "s"}` : "Empty";
      card.innerHTML = `
        <span class="num-wrap"><span class="num">${i}</span></span>
        <span class="card-body">
          <span class="label">${sem.label}</span>
          <span class="meta">${getSubjectsForSemester(i).length} subjects</span>
        </span>
        <span class="${badgeClass}">${badgeText}</span>
      `;
      card.addEventListener("click", () => selectSemester(i));
      grid.appendChild(card);
    });

    block.innerHTML = `<div class="year-label">${year.label}</div>`;
    block.appendChild(grid);
    yearGroups.appendChild(block);
  });

  const recent = [...all].sort((a, b) => b.added - a.added).slice(0, 6);
  recentList.innerHTML = "";
  recentEmpty.classList.toggle("hidden", recent.length > 0);

  renderTimetable();

  recent.forEach((f) => {
    const mod = fileModule(f);
    const li = document.createElement("li");
    li.className = "recent-item";
    li.innerHTML = `
      <span class="recent-emoji">${fileEmoji(f.name)}</span>
      <span class="recent-info">
        <span class="recent-name" title="${escapeHtml(f.name)}">${escapeHtml(f.name)}</span>
        <span class="recent-path">Sem ${f.semester} · ${escapeHtml(f.subject)} · ${TYPE_LABELS[f.type] || f.type} · M${mod}</span>
      </span>
    `;
    li.addEventListener("click", () => openFileLocation(f));
    recentList.appendChild(li);
  });
}

function showCategoryPicker() {
  currentType = null;
  currentModule = null;
  filesPanel.classList.add("hidden");
  moduleIcons.classList.add("hidden");
  modulePrompt.classList.add("hidden");
  typeIcons.classList.remove("hidden");
  subjectPrompt.classList.remove("hidden");
  renderTypeIcons();
}

function showModulePicker() {
  currentModule = null;
  filesPanel.classList.add("hidden");
  typeIcons.classList.add("hidden");
  subjectPrompt.classList.add("hidden");
  moduleIcons.classList.remove("hidden");
  modulePrompt.classList.remove("hidden");
  renderModuleIcons();
}

async function getSubjectFiles() {
  const all = await getAllFiles();
  return all.filter(
    (f) => f.semester === currentSemester && f.subject === currentSubject
  );
}

async function getCategoryFiles() {
  const subjectFiles = await getSubjectFiles();
  return subjectFiles.filter((f) => f.type === currentType);
}

async function renderTypeIcons() {
  const subjectFiles = await getSubjectFiles();
  typeIcons.innerHTML = "";

  FILE_TYPES.forEach((cat) => {
    const count = subjectFiles.filter((f) => f.type === cat.type).length;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "type-icon-btn";
    btn.dataset.type = cat.type;
    btn.innerHTML = `
      <span class="type-icon-emoji">${cat.icon}</span>
      <span class="type-icon-label">${cat.label}</span>
      <span class="type-icon-count">${count} file${count === 1 ? "" : "s"}</span>
    `;
    btn.addEventListener("click", () => selectCategory(cat.type));
    typeIcons.appendChild(btn);
  });
}

async function renderModuleIcons() {
  const categoryFiles = await getCategoryFiles();
  const cat = FILE_TYPES.find((c) => c.type === currentType);
  moduleIcons.innerHTML = "";

  MODULES.forEach((mod) => {
    const count = categoryFiles.filter((f) => fileModule(f) === mod.num).length;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "module-icon-btn";
    btn.dataset.module = mod.num;
    btn.innerHTML = `
      <span class="module-icon-badge">${mod.icon}</span>
      <span class="module-icon-label">${mod.label}</span>
      <span class="module-icon-count">${count} file${count === 1 ? "" : "s"}</span>
    `;
    btn.addEventListener("click", () => selectModule(mod.num));
    moduleIcons.appendChild(btn);
  });

  pageSubtitle.textContent = `${cat.label} — choose a module`;
}

function selectCategory(type) {
  currentType = type;
  showModulePicker();
}

function selectModule(num) {
  currentModule = num;
  const cat = FILE_TYPES.find((c) => c.type === currentType);
  const mod = MODULES.find((m) => m.num === num);
  filesPanelTitle.textContent = `${cat.label} · ${mod.label}`;
  uploadHint.textContent = `${cat.hint} — ${mod.label} — stored in your browser`;
  emptyState.textContent = `No files in ${mod.label} yet. Use the upload button above.`;
  fileSearchQuery = "";
  if (fileSearch) fileSearch.value = "";

  moduleIcons.classList.add("hidden");
  modulePrompt.classList.add("hidden");
  filesPanel.classList.remove("hidden");

  pageSubtitle.textContent = `${cat.label} · ${mod.label}`;
  loadFiles();
}

function openFileLocation(file) {
  currentSemester = file.semester;
  currentSubject = file.subject;
  subjectBadge.textContent = SEMESTERS[currentSemester].label;
  subjectTitle.textContent = currentSubject;
  setHeaderSub(currentSubject, "Choose a category to view or upload files");
  showView("subject");
  currentType = file.type;
  selectModule(fileModule(file));
}

function selectSemester(num) {
  currentSemester = num;
  setStoredSemester(num);
  closeSubjectsEdit();
  const sem = SEMESTERS[num];
  const customNote = hasCustomSubjects(num) ? " · Your custom list" : "";
  subjectsTitle.textContent = `${sem.label} — Subjects${customNote}`;
  setHeaderSub(sem.label, "Select a subject or edit your subject list");
  renderSubjectsGrid(num);
  showView("subjects");
}

function selectSubject(name) {
  currentSubject = name;
  subjectBadge.textContent = SEMESTERS[currentSemester].label;
  subjectTitle.textContent = name;
  setHeaderSub(name, "Choose a category to view or upload files");
  showView("subject");
  showCategoryPicker();
}

function goBack() {
  if (views.subject.classList.contains("active")) {
    if (currentModule !== null) {
      showModulePicker();
      return;
    }
    if (currentType !== null) {
      showCategoryPicker();
      setHeaderSub(currentSubject, "Choose a category to view or upload files");
      return;
    }
    selectSemester(currentSemester);
    return;
  }
  if (views.subjects.classList.contains("active")) {
    if (subjectsEditMode) {
      closeSubjectsEdit();
      renderSubjectsGrid(currentSemester);
      return;
    }
    currentSemester = null;
    closeSubjectsEdit();
    showView("semester");
    refreshHome();
  }
}

async function saveFile(file) {
  const user = getCurrentUser();
  if (!user) return;
  const blob = await file.arrayBuffer();
  const record = {
    ...fileKey(),
    username: user,
    name: file.name,
    size: file.size,
    mime: file.type,
    added: Date.now(),
    data: blob
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const req = tx.objectStore(STORE).add(record);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function getFiles() {
  const { semester, subject, type, module } = fileKey();
  const all = await getAllFiles();
  const matched = all.filter(
    (f) =>
      f.semester === semester &&
      f.subject === subject &&
      f.type === type &&
      fileModule(f) === module
  );
  matched.sort((a, b) => b.added - a.added);
  return matched;
}

async function deleteFile(id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const req = tx.objectStore(STORE).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function filterFilesBySearch(files) {
  const q = fileSearchQuery.trim().toLowerCase();
  if (!q) return files;
  return files.filter((f) => f.name.toLowerCase().includes(q));
}

async function refreshSubjectPanels() {
  if (currentModule !== null) await renderModuleIcons();
  else if (currentType !== null) await renderModuleIcons();
  else await renderTypeIcons();
}

async function loadFiles() {
  const allFiles = await getFiles();
  const files = filterFilesBySearch(allFiles);
  const q = fileSearchQuery.trim().toLowerCase();

  fileList.innerHTML = "";
  const hasFiles = allFiles.length > 0;
  const searching = q.length > 0;
  emptyState.classList.toggle("hidden", hasFiles);
  noSearchResults.classList.toggle("hidden", !(searching && hasFiles && files.length === 0));

  files.forEach((f) => {
    const li = document.createElement("li");
    li.className = "file-item";
    li.innerHTML = `
      <span class="file-icon">${fileEmoji(f.name)}</span>
      <div class="file-info">
        <div class="file-name" title="${escapeHtml(f.name)}">${escapeHtml(f.name)}</div>
        <div class="file-meta">${formatSize(f.size)} · ${formatDate(f.added)}</div>
      </div>
      <div class="file-actions">
        <button type="button" class="view-btn">View</button>
        <button type="button" class="download-btn">Download</button>
        <button type="button" class="delete-btn">Delete</button>
      </div>
    `;
    const openView = () => openFileViewer(f);
    li.querySelector(".file-name").classList.add("file-name--clickable");
    li.querySelector(".file-name").addEventListener("click", openView);
    li.querySelector(".view-btn").addEventListener("click", openView);
    li.querySelector(".download-btn").addEventListener("click", () => downloadFileRecord(f));
    li.querySelector(".delete-btn").addEventListener("click", async () => {
      if (confirm(`Delete "${f.name}"?`)) {
        await deleteFile(f.id);
        await loadFiles();
        await refreshSubjectPanels();
        if (views.semester.classList.contains("active")) refreshHome();
      }
    });
    fileList.appendChild(li);
  });
}

editSubjectsBtn?.addEventListener("click", () => {
  if (subjectsEditMode) {
    closeSubjectsEdit();
    renderSubjectsGrid(currentSemester);
  } else {
    openSubjectsEdit();
  }
});

addSubjectBtn?.addEventListener("click", () => {
  const list = collectSubjectsFromEditForm();
  list.push("");
  renderSubjectsEditList(list);
});

saveSubjectsBtn?.addEventListener("click", saveSubjectsFromEdit);
cancelSubjectsBtn?.addEventListener("click", () => {
  closeSubjectsEdit();
  renderSubjectsGrid(currentSemester);
});
resetSubjectsBtn?.addEventListener("click", () => {
  if (!currentSemester) return;
  if (!confirm(`Reset ${SEMESTERS[currentSemester].label} subjects to the default list? Your custom names will be removed.`)) return;
  resetSubjectsForSemester(currentSemester);
  renderSubjectsEditList(getDefaultSubjects(currentSemester));
});

backToModules.addEventListener("click", showModulePicker);

fileSearch.addEventListener("input", () => {
  fileSearchQuery = fileSearch.value;
  loadFiles();
});

uploadBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", async () => {
  const files = [...fileInput.files];
  fileInput.value = "";
  for (const file of files) {
    await saveFile(file);
  }
  await loadFiles();
  await refreshSubjectPanels();
  if (views.semester.classList.contains("active")) refreshHome();
});

backBtn.addEventListener("click", goBack);

brandHome.addEventListener("click", () => {
  if (views.semester.classList.contains("active")) return;
  currentSemester = null;
  currentSubject = null;
  currentType = null;
  currentModule = null;
  showView("semester");
  refreshHome();
});

editTimetableBtn.addEventListener("click", () => {
  if (timetableEditMode) return;
  enterTimetableEdit();
});

fileViewerClose.addEventListener("click", closeFileViewer);
fileViewerBackdrop.addEventListener("click", closeFileViewer);
fileViewerDownload.addEventListener("click", () => {
  if (viewerCurrentFile) downloadFileRecord(viewerCurrentFile);
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !fileViewer.classList.contains("hidden")) closeFileViewer();
});

let appInitialized = false;

function resetAppNavigation() {
  currentSemester = null;
  currentSubject = null;
  currentType = null;
  currentModule = null;
  showView("semester");
  setHeaderHome();
}

window.closeFileViewer = closeFileViewer;

window.initNoteNestApp = function initNoteNestApp() {
  if (appInitialized && db) {
    window.updateUserBar?.();
    resetAppNavigation();
    refreshHome();
    return;
  }

  openDB().then(() => {
    appInitialized = true;
    window.updateUserBar?.();
    setHeaderHome();
    resetAppNavigation();
    refreshHome();
  });
};
