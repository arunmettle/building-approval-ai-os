function buildSentence({
  sentenceId,
  type,
  text,
  citationRefs,
  supportTerms,
  confidence
}) {
  return {
    sentenceId,
    type,
    text,
    citationRefs: [...new Set(citationRefs)].sort((a, b) => a - b),
    supportTerms: [...new Set(supportTerms)].filter(Boolean),
    confidence
  };
}

function normalizeText(value) {
  return String(value || "").toLowerCase();
}

function findCitationRefs(citations, matcher) {
  const refs = [];

  citations.forEach((citation, index) => {
    if (matcher(citation, index)) {
      refs.push(index);
    }
  });

  return refs;
}

function hasAnyTerm(text, terms) {
  const lowerText = normalizeText(text);
  return terms.some((term) => lowerText.includes(normalizeText(term)));
}

function firstSupportingPassage(retrievedContext, terms, jurisdictionId) {
  return (retrievedContext || []).find((passage) => {
    if (jurisdictionId && passage.jurisdictionId !== jurisdictionId) {
      return false;
    }

    return hasAnyTerm(passage.text, terms);
  });
}

function buildParagraphs(sentences) {
  const intro = [];
  const evidence = [];
  const actions = [];

  for (const sentence of sentences) {
    if (["pathway", "threshold", "unknowns"].includes(sentence.type)) {
      intro.push(sentence.text);
      continue;
    }

    if (["planning", "standards"].includes(sentence.type)) {
      evidence.push(sentence.text);
      continue;
    }

    actions.push(sentence.text);
  }

  return [intro.join(" "), evidence.join(" "), actions.join(" ")]
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function buildExplanation(input, assessment, recommendation) {
  const { citations, requiredDocuments, retrievedContext } = recommendation;
  const sentences = [];

  if (assessment.matchedRules.length > 0) {
    const refs = assessment.matchedRules
      .map((rule) => citations.findIndex((citation) => citation.sourceUrl === rule.evidence?.sourceUrl))
      .filter((ref) => ref >= 0);

    sentences.push(
      buildSentence({
        sentenceId: "pathway-sentence",
        type: "pathway",
        text: `${assessment.pathwayLabel}.`,
        citationRefs: refs,
        supportTerms: ["approval", input.projectType, "pathway"],
        confidence: 0.9
      })
    );
  }

  if (assessment.matchedRules.some((rule) => rule.outcome.includes("no-building-work-approval"))) {
    const refs = assessment.matchedRules
      .map((rule) => citations.findIndex((citation) => citation.sourceUrl === rule.evidence?.sourceUrl))
      .filter((ref) => ref >= 0);

    const dimensionalTerms = [
      "10m",
      "5.0 m",
      "2.4m",
      "2.1m",
      "setback",
      "easement"
    ];

    sentences.push(
      buildSentence({
        sentenceId: "threshold-sentence",
        type: "threshold",
        text: `The strongest current evidence indicates this ${input.projectType} may stay on a lower-friction building pathway if its size, height, setbacks, easement position, and nearby infrastructure conditions remain within the stated thresholds.`,
        citationRefs: refs,
        supportTerms: [input.projectType, ...dimensionalTerms],
        confidence: 0.87
      })
    );
  }

  const planningPassage = firstSupportingPassage(
    retrievedContext,
    ["overlay", "zone", "setback", "planning approval", "concurrence agency referral"],
    input.jurisdictionId
  );

  if (planningPassage) {
    const refs = findCitationRefs(
      citations,
      (citation) => citation.sourceUrl === planningPassage.sourceUrl
    );

    sentences.push(
      buildSentence({
        sentenceId: "planning-sentence",
        type: "planning",
        text: "Planning and siting checks still matter because overlays, setback variations, or zone-specific controls can move a simple project into a council or certifier review pathway.",
        citationRefs: refs,
        supportTerms: ["overlay", "setback", "zone", "application", "referral"],
        confidence: 0.79
      })
    );
  }

  const standardsPassage = firstSupportingPassage(
    retrievedContext,
    ["structural", "fire", "roof water", "tie down", "bracing", "building code"],
    input.jurisdictionId
  );

  if (standardsPassage) {
    const refs = findCitationRefs(
      citations,
      (citation) => citation.sourceUrl === standardsPassage.sourceUrl
    );

    sentences.push(
      buildSentence({
        sentenceId: "standards-sentence",
        type: "standards",
        text: "Even where a lower-friction pathway appears available, the project still needs to satisfy baseline building standards such as structural adequacy, fire separation, drainage, and related code requirements.",
        citationRefs: refs,
        supportTerms: ["structural", "fire", "drainage", "building code", "standards"],
        confidence: 0.8
      })
    );
  }

  if (requiredDocuments.length > 0) {
    const refs = findCitationRefs(
      citations,
      (citation) =>
        hasAnyTerm(citation.snippet, ["form", "site", "plan", "certifier", "report"]) ||
        hasAnyTerm(citation.sectionRef, ["forms", "building", "shed"])
    );

    sentences.push(
      buildSentence({
        sentenceId: "documents-sentence",
        type: "documents",
        text: `The current evidence suggests preparing ${requiredDocuments.slice(0, 6).join(", ")}${requiredDocuments.length > 6 ? ", and other supporting materials" : ""} before relying on this pathway outcome.`,
        citationRefs: refs,
        supportTerms: ["site", "plan", "report", "certifier", "application"],
        confidence: 0.76
      })
    );
  }

  if (assessment.unknowns.length > 0) {
    sentences.push(
      buildSentence({
        sentenceId: "unknowns-sentence",
        type: "unknowns",
        text: `This explanation is still constrained by missing information: ${assessment.unknowns.join(", ")}.`,
        citationRefs: [],
        supportTerms: assessment.unknowns,
        confidence: 0.72
      })
    );
  }

  const reviewPassage = firstSupportingPassage(
    retrievedContext,
    ["private building certifier", "certifier", "council recommends consulting"],
    input.jurisdictionId
  );

  if (reviewPassage || recommendation.professionalReviewRecommended) {
    const refs = reviewPassage
      ? findCitationRefs(citations, (citation) => citation.sourceUrl === reviewPassage.sourceUrl)
      : [];

    sentences.push(
      buildSentence({
        sentenceId: "review-sentence",
        type: "review",
        text: recommendation.professionalReviewRecommended
          ? "Professional review is recommended before relying on this outcome because the current evidence indicates a formal review or approval path may apply."
          : "A private building certifier remains a sensible checkpoint because site-specific overlays, services, or siting details can change the final pathway.",
        citationRefs: refs,
        supportTerms: ["certifier", "review", "overlay", "services", "siting"],
        confidence: 0.78
      })
    );
  }

  return {
    sentences,
    paragraphs: buildParagraphs(sentences)
  };
}
