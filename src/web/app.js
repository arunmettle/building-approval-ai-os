const demoInput = {
  propertyProfileId: "sc-shed-demo-001",
  propertyLookupKey: "sunshine-coast-demo-shed-lot",
  address: "12 Coastal Court, Bokarina QLD 4575",
  jurisdictionId: "au-qld-sunshine-coast",
  projectType: "shed",
  planAreaSqm: 9,
  maxHeightM: 2.4,
  meanHeightM: 2.1,
  longestSideM: 5,
  easementStatus: "no",
  boundarySetbacksCompliant: true,
  locatedOverInfrastructure: false,
  nearRetainingWall: false,
  distanceToFrontBoundaryM: 6,
  distanceToSideBoundaryM: 2,
  distanceToRearBoundaryM: 2,
  zoneKnown: null,
  overlaysKnown: null,
  nearPoolEnclosure: false,
  affectsExistingStructure: false
};

const storageKey = "building-approval-ai-os.sessionToken";

const state = {
  session: null,
  cases: [],
  queueItems: [],
  queueMetrics: null,
  operators: [],
  selectedCaseId: null,
  queueFilters: {
    state: "",
    priority: "",
    assignment: "all"
  }
};

const loginScreenElement = document.querySelector("#loginScreen");
const appShellElement = document.querySelector("#appShell");
const caseListElement = document.querySelector("#caseList");
const caseDetailElement = document.querySelector("#caseDetail");
const formStatusElement = document.querySelector("#formStatus");
const reviewStatusElement = document.querySelector("#reviewStatus");
const authStatusElement = document.querySelector("#authStatus");
const queueStatusElement = document.querySelector("#queueStatus");
const caseForm = document.querySelector("#caseForm");
const reviewForm = document.querySelector("#reviewForm");
const loginForm = document.querySelector("#loginForm");
const reassessButton = document.querySelector("#reassessCase");
const saveReviewButton = document.querySelector("#saveReview");
const operatorSummaryElement = document.querySelector("#operatorSummary");
const queueMetricsElement = document.querySelector("#queueMetrics");
const queueStateFilter = document.querySelector("#queueStateFilter");
const queuePriorityFilter = document.querySelector("#queuePriorityFilter");
const queueAssignmentFilter = document.querySelector("#queueAssignmentFilter");
const reviewerSelect = document.querySelector("#assignedReviewerId");

function parseMaybeBoolean(value) {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return null;
}

function parseMaybeNumber(value) {
  if (value === "" || value === null) {
    return null;
  }

  return Number(value);
}

function setStatus(target, message) {
  target.textContent = message || "";
}

function getToken() {
  return window.localStorage.getItem(storageKey);
}

function setToken(token) {
  if (!token) {
    window.localStorage.removeItem(storageKey);
    return;
  }

  window.localStorage.setItem(storageKey, token);
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : "Unknown";
}

function workflowBadge(caseItem) {
  return `<span class="badge">${caseItem.workflowState}</span>`;
}

function renderSession() {
  const authenticated = Boolean(state.session);

  loginScreenElement.hidden = authenticated;
  appShellElement.hidden = !authenticated;

  if (!authenticated) {
    operatorSummaryElement.innerHTML = "";
    return;
  }

  operatorSummaryElement.innerHTML = `
    <p class="eyebrow">Signed in</p>
    <h2>${state.session.operator.displayName}</h2>
    <p class="case-meta">${state.session.operator.email}</p>
    <p class="case-meta">${state.session.operator.role}</p>
    <p class="case-meta">${state.session.operator.tenantName}</p>
  `;
}

function renderQueueMetrics() {
  if (!state.queueMetrics) {
    queueMetricsElement.innerHTML = `<p class="case-meta">No queue metrics.</p>`;
    return;
  }

  queueMetricsElement.innerHTML = `
    <div class="metric-card">
      <strong>${state.queueMetrics.total}</strong>
      <span>Total cases</span>
    </div>
    <div class="metric-card">
      <strong>${state.queueMetrics.unassigned}</strong>
      <span>Unassigned</span>
    </div>
    <div class="metric-card">
      <strong>${state.queueMetrics.highPriority}</strong>
      <span>High priority</span>
    </div>
    <div class="metric-card">
      <strong>${state.queueMetrics.pendingDocuments}</strong>
      <span>Pending docs</span>
    </div>
    <div class="metric-card">
      <strong>${state.queueMetrics.professionalReviewRequired}</strong>
      <span>Professional review</span>
    </div>
  `;
}

function renderCaseList() {
  caseListElement.innerHTML = "";

  if (!state.queueItems.length) {
    caseListElement.innerHTML = `<p class="case-meta">No cases match the queue filters.</p>`;
    return;
  }

  for (const item of state.queueItems) {
    const element = document.createElement("button");
    element.type = "button";
    element.className = `case-card${state.selectedCaseId === item.caseId ? " active" : ""}`;
    element.innerHTML = `
      <h3>${item.projectType} - ${item.riskRating}</h3>
      <p class="case-meta">${item.address || item.jurisdictionId}</p>
      <p class="case-meta">${item.pathwayLabel}</p>
      <p class="case-meta">Priority: ${item.workflowPriority}</p>
      <p class="case-meta">Assigned: ${item.assignedReviewer || "Unassigned"}</p>
      ${workflowBadge(item)}
    `;
    element.addEventListener("click", () => selectCase(item.caseId));
    caseListElement.appendChild(element);
  }
}

function listMarkup(items) {
  if (!items?.length) {
    return `<p class="case-meta">None</p>`;
  }

  return `<ul class="detail-list">${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
}

function renderReviewerOptions() {
  reviewerSelect.innerHTML = `<option value="">Unassigned</option>`;

  for (const operator of state.operators) {
    const option = document.createElement("option");
    option.value = operator.operatorId;
    option.textContent = `${operator.displayName} (${operator.role})`;
    reviewerSelect.appendChild(option);
  }
}

function operatorNameById(operatorId) {
  return state.operators.find((operator) => operator.operatorId === operatorId)?.displayName || null;
}

function renderCaseDetail(caseRecord) {
  if (!caseRecord) {
    caseDetailElement.className = "case-detail empty";
    caseDetailElement.textContent = "Select a case to inspect workflow, evidence, and review actions.";
    reassessButton.disabled = true;
    saveReviewButton.disabled = true;
    return;
  }

  reassessButton.disabled = false;
  saveReviewButton.disabled = false;
  caseDetailElement.className = "case-detail";
  caseDetailElement.innerHTML = `
    <div class="detail-grid">
      <div class="detail-card">
        <h4>Assessment</h4>
        <p><strong>Case ID:</strong> ${caseRecord.caseId}</p>
        <p><strong>Risk:</strong> ${caseRecord.riskRating}</p>
        <p><strong>Pathway:</strong> ${caseRecord.pathwayLabel}</p>
      </div>
      <div class="detail-card">
        <h4>Workflow</h4>
        <p><strong>State:</strong> ${caseRecord.reviewerWorkflow.state}</p>
        <p><strong>Priority:</strong> ${caseRecord.reviewerWorkflow.priority}</p>
        <p><strong>Assigned:</strong> ${caseRecord.assignedReviewer || "Unassigned"}</p>
      </div>
      <div class="detail-card">
        <h4>Parcel Context</h4>
        <p><strong>Zone:</strong> ${caseRecord.propertyContext?.zone || "Unknown"}</p>
        <p><strong>Overlays:</strong> ${caseRecord.propertyContext?.overlays?.join(", ") || "None"}</p>
        <p><strong>Address:</strong> ${caseRecord.address || "Unknown"}</p>
      </div>
    </div>
    <div class="detail-grid">
      <div class="detail-card">
        <h4>Required Actions</h4>
        ${listMarkup(caseRecord.reviewerWorkflow.requiredActions)}
      </div>
      <div class="detail-card">
        <h4>Blocking Items</h4>
        ${listMarkup(caseRecord.reviewerWorkflow.blockingItems)}
      </div>
      <div class="detail-card">
        <h4>Escalation Reasons</h4>
        ${listMarkup(caseRecord.reviewerWorkflow.escalationReasons)}
      </div>
    </div>
    <div class="detail-grid">
      <div class="detail-card">
        <h4>Required Documents</h4>
        ${listMarkup(caseRecord.requiredDocuments)}
      </div>
      <div class="detail-card">
        <h4>Unknowns</h4>
        ${listMarkup(caseRecord.unknowns)}
      </div>
      <div class="detail-card">
        <h4>Latest Artifact</h4>
        <p><strong>Markdown:</strong> ${caseRecord.latestArtifact?.mdPath || "None"}</p>
        <p><strong>JSON:</strong> ${caseRecord.latestArtifact?.jsonPath || "None"}</p>
      </div>
    </div>
    <div class="detail-grid">
      <div class="detail-card">
        <h4>Workflow History</h4>
        ${
          caseRecord.workflowHistory?.length
            ? caseRecord.workflowHistory
                .slice()
                .reverse()
                .map(
                  (event) =>
                    `<p><strong>${event.type}</strong><br>${event.actor?.displayName || "system"} - ${formatDate(event.createdAt)}</p>`
                )
                .join("")
            : `<p class="case-meta">No workflow history yet.</p>`
        }
      </div>
      <div class="detail-card span-2-card">
        <h4>Reviewer Notes</h4>
        ${
          caseRecord.reviewerNotes?.length
            ? caseRecord.reviewerNotes
                .map(
                  (note) =>
                    `<p><strong>${note.author}</strong> - ${formatDate(note.createdAt)}<br>${note.note}</p>`
                )
                .join("")
            : `<p class="case-meta">No reviewer notes yet.</p>`
        }
      </div>
    </div>
  `;

  reviewForm.elements.assignedReviewerId.value = caseRecord.assignedReviewerId || "";
  reviewForm.elements.state.value = "";
  reviewForm.elements.note.value = "";
}

async function fetchJson(url, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Request failed.");
  }

  return payload;
}

async function restoreSession() {
  const token = getToken();

  if (!token) {
    renderSession();
    return;
  }

  try {
    const payload = await fetchJson("/api/session");
    state.session = payload.session;
    renderSession();
    await bootstrapAuthenticatedApp();
  } catch (error) {
    setToken(null);
    state.session = null;
    renderSession();
    setStatus(authStatusElement, error.message);
  }
}

async function login(email, accessCode) {
  const payload = await fetchJson("/api/session/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, accessCode })
  });

  setToken(payload.session.token);
  state.session = {
    token: payload.session.token,
    tenantId: payload.session.operator.tenantId,
    operator: payload.session.operator
  };
  renderSession();
  await bootstrapAuthenticatedApp();
}

async function logout() {
  try {
    await fetchJson("/api/session/logout", { method: "POST" });
  } catch (error) {
    // Ignore logout errors during local session cleanup.
  }

  setToken(null);
  state.session = null;
  state.selectedCaseId = null;
  state.cases = [];
  state.queueItems = [];
  state.operators = [];
  state.queueMetrics = null;
  renderSession();
  renderQueueMetrics();
  renderCaseList();
  renderCaseDetail(null);
}

async function loadOperators() {
  const payload = await fetchJson("/api/operators");
  state.operators = payload.operators;
  renderReviewerOptions();
}

async function loadCases() {
  const payload = await fetchJson("/api/cases");
  state.cases = payload.cases;
}

function queueQuery() {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(state.queueFilters)) {
    if (value && value !== "all") {
      params.set(key, value);
    }
  }

  const suffix = params.toString();
  return suffix ? `?${suffix}` : "";
}

async function loadQueue() {
  const payload = await fetchJson(`/api/queue${queueQuery()}`);
  state.queueItems = payload.items;
  state.queueMetrics = payload.metrics;
  renderQueueMetrics();
  renderCaseList();

  if (state.selectedCaseId && !state.queueItems.find((item) => item.caseId === state.selectedCaseId)) {
    const matchingCase = state.cases.find((item) => item.caseId === state.selectedCaseId);
    if (!matchingCase) {
      state.selectedCaseId = null;
      renderCaseDetail(null);
    }
  }
}

async function selectCase(caseId) {
  state.selectedCaseId = caseId;
  renderCaseList();
  const payload = await fetchJson(`/api/cases/${caseId}`);
  renderCaseDetail(payload.case);
}

function formToInput(form) {
  return {
    propertyProfileId: form.elements.propertyProfileId.value || null,
    propertyLookupKey: form.elements.propertyLookupKey.value || null,
    address: form.elements.address.value || null,
    jurisdictionId: form.elements.jurisdictionId.value || null,
    projectType: form.elements.projectType.value,
    planAreaSqm: parseMaybeNumber(form.elements.planAreaSqm.value),
    maxHeightM: parseMaybeNumber(form.elements.maxHeightM.value),
    meanHeightM: parseMaybeNumber(form.elements.meanHeightM.value),
    longestSideM: parseMaybeNumber(form.elements.longestSideM.value),
    easementStatus: form.elements.easementStatus.value,
    boundarySetbacksCompliant: parseMaybeBoolean(form.elements.boundarySetbacksCompliant.value),
    locatedOverInfrastructure: parseMaybeBoolean(form.elements.locatedOverInfrastructure.value),
    nearRetainingWall: parseMaybeBoolean(form.elements.nearRetainingWall.value),
    distanceToFrontBoundaryM: parseMaybeNumber(form.elements.distanceToFrontBoundaryM.value),
    distanceToSideBoundaryM: parseMaybeNumber(form.elements.distanceToSideBoundaryM.value),
    distanceToRearBoundaryM: parseMaybeNumber(form.elements.distanceToRearBoundaryM.value),
    zoneKnown: null,
    overlaysKnown: null,
    nearPoolEnclosure: parseMaybeBoolean(form.elements.nearPoolEnclosure.value),
    affectsExistingStructure: parseMaybeBoolean(form.elements.affectsExistingStructure.value),
    sitePlanAvailable: parseMaybeBoolean(form.elements.sitePlanAvailable.value),
    dimensionedDrawingAvailable: parseMaybeBoolean(form.elements.dimensionedDrawingAvailable.value),
    sitePhotosAvailable: parseMaybeBoolean(form.elements.sitePhotosAvailable.value)
  };
}

function loadDemoIntoForm() {
  for (const [key, value] of Object.entries(demoInput)) {
    if (!caseForm.elements[key]) {
      continue;
    }

    caseForm.elements[key].value = value ?? "";
  }
}

async function refreshData() {
  await loadOperators();
  await loadCases();
  await loadQueue();

  if (state.selectedCaseId) {
    await selectCase(state.selectedCaseId);
  }
}

async function bootstrapAuthenticatedApp() {
  queueStateFilter.value = state.queueFilters.state;
  queuePriorityFilter.value = state.queueFilters.priority;
  queueAssignmentFilter.value = state.queueFilters.assignment;
  await refreshData();
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus(authStatusElement, "Signing in...");

  try {
    await login(loginForm.elements.email.value, loginForm.elements.accessCode.value);
    setStatus(authStatusElement, "Signed in.");
  } catch (error) {
    setStatus(authStatusElement, error.message);
  }
});

document.querySelector("#logoutButton").addEventListener("click", () => {
  logout().catch((error) => setStatus(authStatusElement, error.message));
});

caseForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus(formStatusElement, "Creating case...");

  try {
    const payload = await fetchJson("/api/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formToInput(caseForm))
    });

    setStatus(formStatusElement, "Case created.");
    await refreshData();
    await selectCase(payload.case.caseId);
  } catch (error) {
    setStatus(formStatusElement, error.message);
  }
});

reviewForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!state.selectedCaseId) {
    return;
  }

  setStatus(reviewStatusElement, "Saving reviewer update...");

  try {
    const assignedReviewerId = reviewForm.elements.assignedReviewerId.value || null;
    await fetchJson(`/api/cases/${state.selectedCaseId}/reviewer`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assignedReviewerId,
        assignedReviewer: assignedReviewerId ? operatorNameById(assignedReviewerId) : null,
        state: reviewForm.elements.state.value || null,
        note: reviewForm.elements.note.value || null,
        author: state.session.operator.displayName
      })
    });

    setStatus(reviewStatusElement, "Reviewer update saved.");
    await refreshData();
    await selectCase(state.selectedCaseId);
  } catch (error) {
    setStatus(reviewStatusElement, error.message);
  }
});

document.querySelector("#refreshCases").addEventListener("click", () => {
  refreshData().catch((error) => setStatus(queueStatusElement, error.message));
});

document.querySelector("#loadDemo").addEventListener("click", () => {
  loadDemoIntoForm();
});

reassessButton.addEventListener("click", async () => {
  if (!state.selectedCaseId) {
    return;
  }

  setStatus(reviewStatusElement, "Reassessing case...");

  try {
    await fetchJson(`/api/cases/${state.selectedCaseId}/reassess`, {
      method: "POST"
    });

    setStatus(reviewStatusElement, "Case reassessed.");
    await refreshData();
    await selectCase(state.selectedCaseId);
  } catch (error) {
    setStatus(reviewStatusElement, error.message);
  }
});

document.querySelector("#applyFilters").addEventListener("click", () => {
  state.queueFilters.state = queueStateFilter.value;
  state.queueFilters.priority = queuePriorityFilter.value;
  state.queueFilters.assignment = queueAssignmentFilter.value;
  setStatus(queueStatusElement, "Refreshing queue...");
  loadQueue()
    .then(() => setStatus(queueStatusElement, "Queue updated."))
    .catch((error) => setStatus(queueStatusElement, error.message));
});

document.querySelector("#resetFilters").addEventListener("click", () => {
  state.queueFilters = {
    state: "",
    priority: "",
    assignment: "all"
  };
  queueStateFilter.value = "";
  queuePriorityFilter.value = "";
  queueAssignmentFilter.value = "all";
  setStatus(queueStatusElement, "Refreshing queue...");
  loadQueue()
    .then(() => setStatus(queueStatusElement, "Queue reset."))
    .catch((error) => setStatus(queueStatusElement, error.message));
});

document.querySelector("#demoLoginIntake").addEventListener("click", () => {
  loginForm.elements.email.value = "intake@sunrise-installers.demo";
  loginForm.elements.accessCode.value = "sunrise-intake";
});

document.querySelector("#demoLoginReview").addEventListener("click", () => {
  loginForm.elements.email.value = "review@sunrise-installers.demo";
  loginForm.elements.accessCode.value = "sunrise-review";
});

loadDemoIntoForm();
renderSession();
renderQueueMetrics();
renderCaseDetail(null);
restoreSession();
