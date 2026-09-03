import { generateTotp, normalizeSecret } from "./totp.js";

const secretInput = document.querySelector("#secret-input");
const secretField = document.querySelector(".secret-field");
const secretError = document.querySelector("#secret-error");
const visibilityButton = document.querySelector("#visibility-button");
const clearButton = document.querySelector("#clear-button");
const codeButton = document.querySelector("#code-button");
const codeValue = document.querySelector("#code-value");
const copyButton = document.querySelector("#copy-button");
const copyStatus = document.querySelector("#copy-status");
const secondsLeft = document.querySelector("#seconds-left");
const timerProgress = document.querySelector("#timer-progress");
const statusLabel = document.querySelector("#status-label");

let currentCode = "";
let lastCounter = -1;
let updateVersion = 0;
let copyMessageTimer;

function readSecretFromAddress() {
  const url = new URL(window.location.href);
  const fromQuery = url.searchParams.get("secret");
  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
  const fromHash = hashParams.get("secret");
  const secret = fromHash || fromQuery;

  if (secret) {
    secretInput.value = secret;
    history.replaceState(null, "", `${url.pathname}${url.hash ? "" : ""}`);
  }
}

function setReady(ready) {
  codeButton.disabled = !ready;
  copyButton.disabled = !ready;
  statusLabel.classList.toggle("ready", ready);
  statusLabel.textContent = ready ? "Đang hoạt động" : "Đang chờ khóa";
}

function showError(message = "") {
  secretError.textContent = message;
  secretField.classList.toggle("invalid", Boolean(message));
}

function formatCode(code) {
  return `${code.slice(0, 3)} ${code.slice(3)}`;
}

async function refreshCode(force = false) {
  const now = Date.now();
  const counter = Math.floor(now / 30000);
  const remaining = 30 - (Math.floor(now / 1000) % 30);
  secondsLeft.textContent = String(remaining);
  timerProgress.value = remaining;
  timerProgress.classList.toggle("urgent", remaining <= 5);

  const rawSecret = secretInput.value;
  if (!rawSecret.trim()) {
    currentCode = "";
    lastCounter = -1;
    codeValue.textContent = "——— ———";
    setReady(false);
    showError();
    return;
  }

  if (!force && counter === lastCounter) return;
  const thisUpdate = ++updateVersion;

  try {
    const normalized = normalizeSecret(rawSecret);
    const nextCode = await generateTotp(normalized, now);
    if (thisUpdate !== updateVersion) return;
    currentCode = nextCode;
    lastCounter = counter;
    codeValue.textContent = formatCode(nextCode);
    setReady(true);
    showError();
  } catch (error) {
    if (thisUpdate !== updateVersion) return;
    currentCode = "";
    lastCounter = -1;
    codeValue.textContent = "——— ———";
    setReady(false);
    showError(error instanceof Error ? error.message : "Không thể tạo mã.");
  }
}

async function copyCode() {
  if (!currentCode) return;

  try {
    await navigator.clipboard.writeText(currentCode);
    copyStatus.textContent = "Đã sao chép mã";
  } catch {
    const temporaryInput = document.createElement("textarea");
    temporaryInput.value = currentCode;
    temporaryInput.setAttribute("readonly", "");
    temporaryInput.style.position = "fixed";
    temporaryInput.style.opacity = "0";
    document.body.appendChild(temporaryInput);
    temporaryInput.select();
    document.execCommand("copy");
    temporaryInput.remove();
    copyStatus.textContent = "Đã sao chép mã";
  }

  clearTimeout(copyMessageTimer);
  copyMessageTimer = setTimeout(() => {
    copyStatus.textContent = "";
  }, 1800);
}

let inputTimer;
secretInput.addEventListener("input", () => {
  clearTimeout(inputTimer);
  lastCounter = -1;
  inputTimer = setTimeout(() => refreshCode(true), 120);
});

visibilityButton.addEventListener("click", () => {
  const shouldShow = secretInput.type === "password";
  secretInput.type = shouldShow ? "text" : "password";
  visibilityButton.setAttribute("aria-pressed", String(shouldShow));
  visibilityButton.setAttribute("aria-label", shouldShow ? "Ẩn khóa bảo mật" : "Hiện khóa bảo mật");
  secretInput.focus();
});

clearButton.addEventListener("click", () => {
  secretInput.value = "";
  currentCode = "";
  lastCounter = -1;
  updateVersion += 1;
  copyStatus.textContent = "";
  refreshCode(true);
  secretInput.focus();
});

copyButton.addEventListener("click", copyCode);
codeButton.addEventListener("click", copyCode);

readSecretFromAddress();
refreshCode(true);
setInterval(refreshCode, 250);
