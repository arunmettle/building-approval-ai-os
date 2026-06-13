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

const state = {
  cases: [],
  selectedCaseId: null
};

const caseListElement = document.querySelector("#caseList");
const caseDetailElement = document.querySelector("#caseDetail");
const formStatusElement = document.querySelector("#formStatus");
const reviewStatusElement = document.querySelector("#reviewStatus");
const caseForm = document.querySelector("#caseForm");
const reviewForm = document.querySelector("#reviewForm");
const reassessButton = document.querySelector("#reassessCase");
const saveReviewButton = document.querySelector("#saveReview");

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

function workflowBadge(caseItem) {
  return `<span class="badge">${caseItem.workflowState}</span>`;
}

function renderCaseList() {
  caseListElement.innerHTML = "";

  if (!state.cases.length) {
    caseListElement.innerHTML = `<p class="case-meta">No cases yet.</p>`;
    return;
  }

  for (const item of state.cases) {
    const element = document.createElement("button");
    element.type = "button";
    element.className = `case-card${state.selectedCaseId === item.caseId ? " active" : ""}`;
    element.innerHTML = `
      <h3>${item.projectType} • ${item.riskRating}</h3>
      <p class="case-meta">${item.address || item.jurisdictionId}</p>
      <p class="case-meta">${item.pathwayLabel}</p>
      <p class="case-meta">Priority: ${item.workflowPriority}</p>
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
    <div class="detail-card">
      <h4>Reviewer Notes</h4>
      ${
        caseRecord.reviewerNotes?.length
          ? caseRecord.reviewerNotes
              .map(
                (note) =>
                  `<p><strong>${note.author}</strong> • ${new Date(note.createdAt).toLocaleString()}<br>${note.note}</p>`
              )
              .join("")
          : `<p class="case-meta">No reviewer notes yet.</p>`
      }
    </div>
  `;

  reviewForm.elements.assignedReviewer.value = caseRecord.assignedReviewer || "";
  reviewForm.elements.state.value = "";
  reviewForm.elements.note.value = "";
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Request failed.");
  }

  return payload;
}

async function loadCases() {
  const payload = await fetchJson("/api/cases");
  state.cases = payload.cases;
  renderCaseList();

  if (state.selectedCaseId) {
    await selectCase(state.selectedCaseId);
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
    await loadCases();
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
    await fetchJson(`/api/cases/${state.selectedCaseId}/reviewer`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assignedReviewer: reviewForm.elements.assignedReviewer.value || null,
        state: reviewForm.elements.state.value || null,
        note: reviewForm.elements.note.value || null,
        author: reviewForm.elements.assignedReviewer.value || "reviewer"
      })
    });

    setStatus(reviewStatusElement, "Reviewer update saved.");
    await loadCases();
  } catch (error) {
    setStatus(reviewStatusElement, error.message);
  }
});

document.querySelector("#refreshCases").addEventListener("click", () => {
  loadCases().catch((error) => setStatus(formStatusElement, error.message));
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
    await loadCases();
  } catch (error) {
    setStatus(reviewStatusElement, error.message);
  }
});

loadDemoIntoForm();
loadCases().catch((error) => {
  setStatus(formStatusElement, error.message);
});
