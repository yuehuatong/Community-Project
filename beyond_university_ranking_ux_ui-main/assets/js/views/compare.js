import {
  coverageMeter,
  numberOrState,
  verificationBadge,
} from "../components.js";
import {
  badge,
  esc,
  footer,
  fmtNumber,
  notice,
  routeHref,
  setDocumentTitle,
} from "../utils.js";

function seriesSummary(series) {
  return series.map((item) => `${item.year}: ${item.rank.display}`).join(" · ");
}

function comparisonRow(label, programmes, renderer, keyFn = null) {
  const values = programmes.map((programme) => renderer(programme));
  const keys = programmes.map((programme, index) => (
    keyFn ? keyFn(programme) : values[index].replace(/<[^>]*>/g, "").trim()
  ));
  const differs = new Set(keys).size > 1;
  return `<div class="compare-label">${esc(label)}</div>
    ${values.map((value) => `<div class="${differs ? "difference" : ""}">${value}</div>`).join("")}`;
}

function textValue(value, fallback = "Not collected") {
  return esc(value || fallback);
}

function communityValue(programme) {
  const community = programme.community;
  if (!community.eligibleRecords) {
    return `${badge("not-collected", "No eligible records")}<div class="small muted">No tone distribution is shown.</div>`;
  }
  const tone = community.headlineTone;
  const toneText = community.comparable && tone
    ? `<div class="small">${tone.positive} positive · ${tone.neutral} neutral · ${tone.negative} negative</div>`
    : `<div class="small muted">Tone comparison withheld because coverage or source composition is insufficient.</div>`;
  return `${badge(community.comparable ? "verified" : "manual-review", community.coverageLevel)}
    <div class="small">${fmtNumber(community.eligibleRecords)} eligible · ${community.highRelevance} high · ${community.mediumRelevance} medium relevance</div>
    <div class="small">${community.generalForum} general-forum · ${community.schoolForum} school-forum</div>
    ${toneText}`;
}

function provisionalResult(programme) {
  const scoring = programme.scoring;
  if (!scoring) return badge("not-collected", "Scoring snapshot unavailable");
  if (scoring.provisionalRank === null) {
    return `${badge("unverified", "Not ranked — eligibility review")}
      <div class="small">${esc((scoring.exclusionReasons || []).join(" ") || "Programme eligibility requires review.")}</div>`;
  }
  return `<strong>#${scoring.provisionalRank}${scoring.provisionalRankGroupSize > 1 ? ` · shared by ${scoring.provisionalRankGroupSize}` : ""}</strong>
    <div class="small">Provisional score: ${scoring.provisionalScore.toFixed(1)}/100</div>
    <div class="micro muted">Within the ${scoring.track === "research" ? "Research-oriented" : "Taught / Professional"} track</div>`;
}

function componentAvailability(programme) {
  if (!programme.scoring?.components) return badge("not-collected", "Data pending");
  return Object.entries(programme.scoring.components).map(([name, component]) => `
    <div class="component-availability">
      <span>${esc(name)}</span>
      <strong>${component.score === null ? "Data pending" : component.score.toFixed(1)}</strong>
    </div>
  `).join("");
}

export function selectedIdsFromQuery(query, context) {
  if (!query.has("ids")) return { ids: context.store.compare, invalid: 0 };
  const requested = (query.get("ids") || "").split(",").filter(Boolean);
  const valid = [...new Set(requested.filter((id) => context.data.programmeById.has(id)))].slice(0, 3);
  return { ids: valid, invalid: requested.length - valid.length };
}

export function renderCompare(context, query) {
  setDocumentTitle("Compare programmes");
  const { ids, invalid } = selectedIdsFromQuery(query, context);
  const programmes = ids.map((id) => context.data.programmeById.get(id)).filter(Boolean);
  context.compareSelection = ids;

  if (!programmes.length) {
    return `<div class="page page-narrow">
      <header class="page-header">
        <p class="eyebrow">Comparison tool</p>
        <h1>Compare up to three programmes.</h1>
        <p class="lede">Select programmes from Explore to compare evidence side by side. No automatic winner is declared.</p>
      </header>
      ${invalid ? notice("warning", "Invalid programme identifiers ignored", `${invalid} identifier${invalid === 1 ? " was" : "s were"} not part of the current 60-programme sample.`, "!") : ""}
      <div class="empty-state">
        <div>
          <h2>No programmes selected</h2>
          <p class="muted">Use the Compare button on a programme card or detail page.</p>
          <a class="button" href="${routeHref("/explore")}">Explore programmes</a>
        </div>
      </div>
      ${footer(context.data.metadata)}
    </div>`;
  }

  return `<div class="page">
    <header class="page-header">
      <p class="eyebrow">Comparison tool</p>
      <h1>Meaningful differences, with uncertainty intact.</h1>
      <p class="lede">Compare one, two, or three programmes. Approved provisional results are shown with their limitations; highlighted cells differ but do not automatically mean better or worse.</p>
    </header>
    ${invalid ? notice("warning", "Invalid programme identifiers ignored", `${invalid} identifier${invalid === 1 ? " was" : "s were"} not part of the current sample.`, "!") : ""}
    ${notice("warning", "Provisional project ranking — not an official QS or THE ranking", "Method 1.1 provisional scores and within-track ranks are displayed, but Research-oriented and Taught / Professional routes remain separate. No automatic winner is declared across tracks.", "!")}
    <div class="compare-grid" style="--columns:${programmes.length}">
      <div class="compare-label">Programme</div>
      ${programmes.map((programme) => `<div class="compare-heading">
        <div class="eyebrow">${esc(programme.institution)}</div>
        <h2><a href="${routeHref("/programme", { id: programme.id })}">${esc(programme.programme)}</a></h2>
        <button class="button small danger" type="button" data-compare-remove="${esc(programme.id)}">Remove</button>
      </div>`).join("")}

      ${comparisonRow("Country", programmes, (programme) => textValue(programme.country))}
      ${comparisonRow("Evidence status", programmes, (programme) => verificationBadge(programme), (programme) => programme.verification.state)}
      ${comparisonRow("Provisional ranking route", programmes, (programme) => `${badge(programme.programmeType.state, programme.programmeType.value)}
        <div class="small">Confidence: ${esc(programme.scoring?.routeClassification?.confidence || "Data pending")}</div>
        <div class="micro muted">${esc(programme.scoring?.routeClassification?.basis || "Validation in progress")}</div>`,
      (programme) => `${programme.programmeType.value}|${programme.scoring?.routeClassification?.confidence || "pending"}`)}
      ${comparisonRow("Provisional scoring status", programmes, (programme) => programme.scoring
        ? `${badge(programme.scoring.status.tone, programme.scoring.status.label)}`
        : badge("not-collected", "Scoring snapshot unavailable"),
      (programme) => programme.scoring?.status.code || "unavailable")}
      ${comparisonRow("Provisional score and within-track rank", programmes, provisionalResult,
      (programme) => `${programme.scoring?.provisionalScore ?? "none"}|${programme.scoring?.provisionalRank ?? "none"}|${programme.scoring?.track ?? "none"}`)}
      ${comparisonRow("Institution Strength", programmes, (programme) => `
        <strong>${programme.institutionStrength.score === null ? "Not calculated" : `${programme.institutionStrength.score.toFixed(1)}/100`}</strong>
        <div class="small muted">Institution-level context—not a programme-quality score</div>
      `, (programme) => programme.institutionStrength.score)}
      ${comparisonRow("Scored-weight coverage", programmes, (programme) => programme.scoring?.scoredWeightCoverage === null || programme.scoring?.scoredWeightCoverage === undefined
        ? badge("not-collected")
        : coverageMeter(programme.scoring.scoredWeightCoverage, "Scored-weight coverage"),
      (programme) => programme.scoring?.scoredWeightCoverage)}
      ${comparisonRow("Component availability", programmes, componentAvailability,
      (programme) => Object.values(programme.scoring?.components || {}).map((component) => component.score ?? "pending").join("|"))}
      ${comparisonRow("Strict validated result", programmes, (programme) => `
        <div class="small">Final programme score: <strong>${programme.scoring?.finalScore === null || programme.scoring?.finalScore === undefined ? "Not calculated" : programme.scoring.finalScore.toFixed(1)}</strong></div>
        <div class="small">Ordinal rank: <strong>${programme.scoring?.ordinalRank === null || programme.scoring?.ordinalRank === undefined ? "Not published" : `#${programme.scoring.ordinalRank}`}</strong></div>
      `, (programme) => `${programme.scoring?.finalScore ?? "none"}|${programme.scoring?.ordinalRank ?? "none"}`)}
      ${comparisonRow("Duration", programmes, (programme) => `${textValue(programme.details.duration.display)}<div>${badge(programme.details.duration.state)}</div>`, (programme) => programme.details.duration.display)}
      ${comparisonRow("Study mode", programmes, (programme) => `${textValue(programme.details.studyMode.display)}<div>${badge(programme.details.studyMode.state)}</div>`, (programme) => programme.details.studyMode.display)}
      ${comparisonRow("Thesis / research design", programmes, (programme) => `
        <strong>Thesis: ${esc(programme.details.thesis.value)}</strong>
        <div class="small">${esc(programme.details.capstone.display)} capstone/project</div>
        <div class="small muted">${esc(programme.programmeType.basis)}</div>
      `, (programme) => `${programme.details.thesis.value}|${programme.details.capstone.display}|${programme.programmeType.value}`)}
      ${comparisonRow("Entry requirements", programmes, (programme) => `<div class="small">${esc(programme.details.entryRequirements.display)}</div>${badge(programme.details.entryRequirements.state)}`, (programme) => programme.details.entryRequirements.display)}
      ${comparisonRow("English requirements", programmes, (programme) => `<div class="small">${esc(programme.details.englishRequirement.display)}</div>${badge(programme.details.englishRequirement.state)}`, (programme) => programme.details.englishRequirement.display)}
      ${comparisonRow("AASHE STARS", programmes, (programme) => `${badge(programme.signals.aashe.state)}<div class="small">${textValue(programme.signals.aashe.rating, programme.signals.aashe.matchStatus)}</div><div class="micro muted">${textValue(programme.signals.aashe.scopeNote)}</div>`, (programme) => `${programme.signals.aashe.state}|${programme.signals.aashe.rating}`)}
      ${comparisonRow("UN PRME", programmes, (programme) => `${badge(programme.signals.prme.state)}<div class="small">${textValue(programme.signals.prme.status)}</div><div class="micro muted">${textValue(programme.signals.prme.scopeNote)}</div>`, (programme) => `${programme.signals.prme.state}|${programme.signals.prme.status}`)}
      ${comparisonRow("OpenAlex indicators", programmes, (programme) => `${badge(programme.signals.openAlex.state)}
        <div class="small">Works: ${numberOrState(programme.signals.openAlex.works)}</div>
        <div class="small">H-index: ${numberOrState(programme.signals.openAlex.hIndex)}</div>
        <div class="small">Keyword works 2021–2025: ${numberOrState(programme.signals.openAlex.keywordWorks2021to2025)}</div>
      `, (programme) => `${programme.signals.openAlex.state}|${programme.signals.openAlex.works}|${programme.signals.openAlex.hIndex}`)}
      ${comparisonRow("QS Sustainability history", programmes, (programme) => `<div class="small">${esc(seriesSummary(programme.rankings.qsSustainability))}</div>`, (programme) => seriesSummary(programme.rankings.qsSustainability))}
      ${comparisonRow("THE Impact history", programmes, (programme) => `<div class="small">${esc(seriesSummary(programme.rankings.theImpact))}</div>`, (programme) => seriesSummary(programme.rankings.theImpact))}
      ${comparisonRow("QS university history", programmes, (programme) => `<div class="small">${esc(seriesSummary(programme.rankings.qsUniversity))}</div>`, (programme) => seriesSummary(programme.rankings.qsUniversity))}
      ${comparisonRow("THE university history", programmes, (programme) => `<div class="small">${esc(seriesSummary(programme.rankings.theUniversity))}</div>`, (programme) => seriesSummary(programme.rankings.theUniversity))}
      ${comparisonRow("Community coverage", programmes, communityValue, (programme) => `${programme.community.coverageLevel}|${programme.community.generalForumOnly}`)}
      ${comparisonRow("Research evidence coverage", programmes, (programme) => coverageMeter(programme.rankingReadiness.research.evidenceCoverage, "Research evidence coverage"), (programme) => programme.rankingReadiness.research.evidenceCoverage)}
      ${comparisonRow("Taught / professional evidence coverage", programmes, (programme) => coverageMeter(programme.rankingReadiness.taught.evidenceCoverage, "Taught evidence coverage"), (programme) => programme.rankingReadiness.taught.evidenceCoverage)}
      ${comparisonRow("Official source", programmes, (programme) => programme.sources.programmeUrl
        ? `<a href="${esc(programme.sources.programmeUrl)}" target="_blank" rel="noopener noreferrer">Official programme page ↗</a>`
        : badge("not-collected"))}
    </div>
    ${footer(context.data.metadata)}
  </div>`;
}

export function bindCompare(context) {
  document.querySelectorAll("[data-compare-remove]").forEach((button) => {
    button.addEventListener("click", () => {
      context.store.removeCompare(button.dataset.compareRemove);
      const remaining = context.compareSelection.filter((id) => id !== button.dataset.compareRemove);
      location.hash = routeHref("/compare", { ids: remaining.join(",") }).slice(1);
    });
  });
}
