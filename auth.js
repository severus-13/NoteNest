const USER_KEY = "noteNestUsername";
const USERS_REGISTRY_KEY = "noteNestUsersRegistry";
const USERNAME_LENGTH = 5;

const authScreen = document.getElementById("authScreen");
const appShell = document.getElementById("appShell");
const usernameInput = document.getElementById("usernameInput");
const authActionBtn = document.getElementById("authActionBtn");
const authError = document.getElementById("authError");
const authTitle = document.getElementById("authTitle");
const authDesc = document.getElementById("authDesc");
const authTabCreate = document.getElementById("authTabCreate");
const authTabSignin = document.getElementById("authTabSignin");
const currentUserDisplay = document.getElementById("currentUserDisplay");
const switchUserBtn = document.getElementById("switchUserBtn");

let authMode = "create";

const AUTH_COPY = {
  create: {
    title: "Create your username",
    desc: `Pick a unique 5-character username (letters and numbers). No one else on this device can use the same one.`,
    button: "Create username"
  },
  signin: {
    title: "Sign in",
    desc: "Enter your 5-character username to open your files and upload new ones.",
    button: "Sign in"
  }
};

function normalizeUsername(raw) {
  return raw.trim().toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, USERNAME_LENGTH);
}

function isValidUsernameFormat(name) {
  return /^[a-z][a-z0-9]{4}$/.test(name);
}

function getRegisteredUsers() {
  try {
    const list = JSON.parse(localStorage.getItem(USERS_REGISTRY_KEY));
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function isUsernameRegistered(name) {
  const norm = normalizeUsername(name);
  return getRegisteredUsers().includes(norm);
}

function registerUsername(name) {
  const norm = normalizeUsername(name);
  if (!isValidUsernameFormat(norm)) {
    return { ok: false, error: "Username must be exactly 5 characters (letter first, then letters or numbers)." };
  }
  if (isUsernameRegistered(norm)) {
    return { ok: false, error: "This username is already taken. Try another or sign in." };
  }

  const users = getRegisteredUsers();
  users.push(norm);
  localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(users));
  return { ok: true, username: norm };
}

function getCurrentUser() {
  const name = localStorage.getItem(USER_KEY);
  if (!name) return null;
  const norm = normalizeUsername(name);
  return isValidUsernameFormat(norm) ? norm : null;
}

function setCurrentUser(name) {
  const normalized = normalizeUsername(name);
  localStorage.setItem(USER_KEY, normalized);
  return normalized;
}

function clearCurrentUser() {
  localStorage.removeItem(USER_KEY);
}

function updateUserBar() {
  const user = getCurrentUser();
  if (currentUserDisplay && user) {
    currentUserDisplay.textContent = user;
  }
}

function setAuthMode(mode) {
  authMode = mode;
  const copy = AUTH_COPY[mode];
  authTitle.textContent = copy.title;
  authDesc.textContent = copy.desc;
  authActionBtn.textContent = copy.button;
  authTabCreate?.classList.toggle("active", mode === "create");
  authTabSignin?.classList.toggle("active", mode === "signin");
  authTabCreate?.setAttribute("aria-selected", mode === "create" ? "true" : "false");
  authTabSignin?.setAttribute("aria-selected", mode === "signin" ? "true" : "false");
  authError?.classList.add("hidden");
  if (usernameInput) {
    usernameInput.placeholder = "alan1";
    usernameInput.value = "";
  }
  usernameInput?.focus();
}

function showAuthScreen() {
  authScreen?.classList.remove("hidden");
  appShell?.classList.add("hidden");
  document.body.classList.add("auth-locked");
  if (usernameInput) usernameInput.value = "";
  authError?.classList.add("hidden");
  setAuthMode("create");
}

function hideAuthScreen() {
  authScreen?.classList.add("hidden");
  appShell?.classList.remove("hidden");
  document.body.classList.remove("auth-locked");
  updateUserBar();
}

function showAuthError(message) {
  if (!authError) return;
  authError.textContent = message;
  authError.classList.remove("hidden");
}

function completeSignIn(username) {
  authError?.classList.add("hidden");
  setCurrentUser(username);
  hideAuthScreen();
  if (typeof window.initNoteNestApp === "function") {
    window.initNoteNestApp();
  }
}

function handleAuthAction() {
  const name = normalizeUsername(usernameInput?.value ?? "");

  if (!name) {
    showAuthError("Please enter a username.");
    return;
  }

  if (name.length !== USERNAME_LENGTH) {
    showAuthError(`Username must be exactly ${USERNAME_LENGTH} characters (example: alan1).`);
    return;
  }

  if (!isValidUsernameFormat(name)) {
    showAuthError("Start with a letter, then use only letters or numbers (example: alan1).");
    return;
  }

  if (authMode === "create") {
    const result = registerUsername(name);
    if (!result.ok) {
      showAuthError(result.error);
      return;
    }
    completeSignIn(result.username);
    return;
  }

  if (!isUsernameRegistered(name)) {
    showAuthError("This username does not exist. Create it first using the Create tab.");
    return;
  }

  completeSignIn(name);
}

function handleSwitchUser() {
  if (!confirm("Switch user? You will sign out and can create or sign in with another username.")) return;
  clearCurrentUser();
  if (typeof window.closeFileViewer === "function") window.closeFileViewer();
  showAuthScreen();
}

window.updateUserBar = updateUserBar;

function checkAuthOnLoad() {
  const user = getCurrentUser();
  if (user && isUsernameRegistered(user)) {
    hideAuthScreen();
    if (typeof window.initNoteNestApp === "function") {
      window.initNoteNestApp();
    }
  } else {
    if (user) clearCurrentUser();
    showAuthScreen();
  }
}

function sanitizeUsernameInput() {
  if (!usernameInput) return;
  const pos = usernameInput.selectionStart;
  usernameInput.value = normalizeUsername(usernameInput.value);
  usernameInput.setSelectionRange(
    Math.min(pos, usernameInput.value.length),
    Math.min(pos, usernameInput.value.length)
  );
}

authTabCreate?.addEventListener("click", () => setAuthMode("create"));
authTabSignin?.addEventListener("click", () => setAuthMode("signin"));
authActionBtn?.addEventListener("click", handleAuthAction);
usernameInput?.addEventListener("input", sanitizeUsernameInput);
usernameInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleAuthAction();
});
switchUserBtn?.addEventListener("click", handleSwitchUser);

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", checkAuthOnLoad);
} else {
  checkAuthOnLoad();
}
