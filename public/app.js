let states = [];
let syncedStateId = null;
let selectDirty = false;

const stateSelect = document.getElementById("state-select");
const passwordInput = document.getElementById("password-input");
const applyBtn = document.getElementById("apply-btn");
const stepsEl = document.getElementById("steps");
const progressFill = document.getElementById("progress-fill");
const statusLabel = document.getElementById("status-label");
const statusMessage = document.getElementById("status-message");
const etaEl = document.getElementById("eta");
const pizzaVisual = document.getElementById("pizza-visual");
const deliveryCar = document.getElementById("delivery-car");
const sceneHouse = document.getElementById("scene-house");
const syncNote = document.getElementById("sync-note");
const feedbackEl = document.getElementById("feedback");

const DRIVING_STATES = new Set([
  "driving-to-restaurant",
  "driving-home",
  "driving-to-your-place",
]);

const AT_PARENTS_STATES = new Set([
  "eating-obligatory-food",
  "making-small-talk",
  "packaging-food",
  "midwestern-goodbye",
]);

function renderSteps(activeStateId) {
  const activeIndex = states.findIndex((state) => state.id === activeStateId);

  stepsEl.innerHTML = states
    .map((state, index) => {
      const status =
        index < activeIndex
          ? "complete"
          : index === activeIndex
            ? "active"
            : "upcoming";

      return `
        <li class="step step--${status}" role="listitem">
          <span class="step-dot">${state.emoji}</span>
          <span class="step-label">${state.shortLabel}</span>
        </li>
      `;
    })
    .join("");
}

function renderScene(state) {
  document.body.dataset.state = state.id;

  pizzaVisual.style.opacity = DRIVING_STATES.has(state.id) ? "0.35" : "1";
  sceneHouse.style.opacity = AT_PARENTS_STATES.has(state.id) ? "1" : "0";
  deliveryCar.style.opacity = DRIVING_STATES.has(state.id) ? "1" : "0";

  const face = pizzaVisual.querySelector(".pizza-face");
  if (state.id === "arriving-soon") {
    face.textContent = "🎉";
  } else if (state.id === "packaging-food") {
    face.textContent = "📦";
  } else if (state.id === "midwestern-goodbye") {
    face.textContent = "👋";
  } else if (AT_PARENTS_STATES.has(state.id)) {
    face.textContent = "🙂";
  } else {
    face.textContent = "😋";
  }
}

function applyState(state, updatedAt) {
  document.title = `Pizza Tracker · ${state.shortLabel}`;

  statusLabel.textContent = state.shortLabel;
  statusMessage.textContent = state.message;
  etaEl.textContent = state.eta;
  progressFill.style.setProperty("--progress", `${state.progress}%`);
  renderSteps(state.id);
  renderScene(state);

  if (updatedAt) {
    syncNote.textContent = `Last updated ${new Date(updatedAt).toLocaleString()}`;
  }
}

function showFeedback(message, type) {
  feedbackEl.hidden = false;
  feedbackEl.textContent = message;
  feedbackEl.dataset.type = type;
}

function clearFeedback() {
  feedbackEl.hidden = true;
  feedbackEl.textContent = "";
  feedbackEl.removeAttribute("data-type");
}

async function loadConfig() {
  const response = await fetch("/api/config");
  if (!response.ok) {
    throw new Error("Could not load tracker config.");
  }

  const data = await response.json();
  states = data.states;

  stateSelect.innerHTML = states
    .map(
      (state, index) =>
        `<option value="${state.id}">${index + 1}. ${state.label}</option>`
    )
    .join("");
  stateSelect.disabled = false;
}

async function refreshState() {
  const response = await fetch("/api/state");
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error ?? "Could not load tracker state.");
  }

  const data = await response.json();
  applyState(data.state, data.updatedAt);
  syncedStateId = data.stateId;
  if (!selectDirty) {
    stateSelect.value = data.stateId;
  }
}

async function updateState() {
  clearFeedback();
  stateSelect.classList.remove("invalid");

  const response = await fetch("/api/state", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      stateId: stateSelect.value,
      password: passwordInput.value,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      showFeedback("Wrong password.", "error");
      return;
    }

    if (response.status === 400) {
      stateSelect.classList.add("invalid");
      showFeedback(data.error ?? "Invalid state.", "error");
      return;
    }

    showFeedback(data.error ?? "Update failed.", "error");
    return;
  }

  applyState(data.state, data.updatedAt);
  syncedStateId = data.stateId;
  stateSelect.value = data.stateId;
  selectDirty = false;
  showFeedback("Tracker updated.", "success");
}

applyBtn.addEventListener("click", () => {
  updateState().catch((error) => showFeedback(error.message, "error"));
});

stateSelect.addEventListener("change", () => {
  stateSelect.classList.remove("invalid");
  clearFeedback();
  selectDirty = stateSelect.value !== syncedStateId;
});

passwordInput.addEventListener("input", clearFeedback);

async function init() {
  try {
    await loadConfig();
    await refreshState();
    setInterval(() => {
      refreshState().catch(() => {});
    }, 5000);
  } catch (error) {
    statusMessage.textContent = error.message;
    showFeedback(error.message, "error");
  }
}

init();
