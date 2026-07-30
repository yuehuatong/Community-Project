import {
  contentBlock,
  keyFact,
  rankingStateDefinition,
  signalCard,
  sourceList,
  verificationBadge,
} from "../components.js";
import { rankLineChart, stackedDistribution } from "../charts.js";
import {
  badge,
  esc,
  externalLink,
  footer,
  fmtNumber,
  notice,
  routeHref,
  setDocumentTitle,
  titleCase,
} from "../utils.js";

const TABS = [
  ["overview", "Overview"],
  ["structure", "Programme structure"],
  ["entry", "Entry requirements"],
  ["research", "Research & thesis"],
  ["engagement", "Sustainability engagement"],
  ["rankings", "Institutional rankings"],
  ["community", "Community insights"],
  ["sources", "Sources & data quality"],
];

function tabNavigation(programme, selected) {
  return `<nav class="tab-list" aria-label="Programme evidence sections">
    ${TABS.map(([key, label]) => `<a
      href="${routeHref("/programme", { id: programme.id, tab: key === "overview" ? "" : key })}"
      ${selected === key ? 'aria-current="page"' : ""}
    >${esc(label)}</a>`).join("")}
  </nav>`;
}

function scoringPanel(programme) {
  const scoring = programme.scoring;
  if (!scoring) {
    return notice(
      "warning",
      "Scoring snapshot unavailable",
      "Programme evidence remains available, but the current scoring snapshot could not be matched to this stable programme identity.",
      "!",
    );
  }
  const institutionScore = scoring.components["Institution Strength"]?.score;
  const route = scoring.track === "research"
    ? "Research-oriented (provisional)"
    : scoring.track === "taught"
      ? "Taught / Professional (provisional)"
      : "Validation in progress";
  const provisionalScore = scoring.provisionalScore === null
    ? "Not calculated"
    : `${scoring.provisionalScore.toFixed(1)}/100`;
  const provisionalRank = scoring.provisionalRank === null
    ? "Not published"
    : `#${scoring.provisionalRank}${scoring.provisionalRankGroupSize > 1 ? ` · shared by ${scoring.provisionalRankGroupSize}` : ""}`;
  const coverage = scoring.scoredWeightCoverage === null
    ? "Not collected"
    : `${scoring.scoredWeightCoverage.toFixed(1)}%`;
  const routeConfidence = scoring.routeClassification?.confidence
    ? titleCase(scoring.routeClassification.confidence)
    : "Data pending";
  const components = Object.entries(scoring.components || {});
  const ranked = scoring.provisionalRank !== null;

  return `<section class="panel scoring-panel">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Approved method 1.1</p>
        <h2>${ranked ? "Provisional programme ranking" : "Programme ranking eligibility"}</h2>
      </div>
      ${badge(scoring.status.tone, scoring.status.label)}
    </div>
    <div class="key-facts">
      ${keyFact("Provisional route", route)}
      ${keyFact("Route confidence", routeConfidence)}
      ${ranked
        ? `${keyFact("Provisional score", provisionalScore)}
          ${keyFact("Within-track rank", provisionalRank)}`
        : keyFact("Provisional result", "Not ranked — eligibility review")}
      ${keyFact(
        "Institution Strength",
        institutionScore === null || institutionScore === undefined
          ? "Not calculated"
          : `${institutionScore.toFixed(1)}/100`,
        null,
        "Institution-level QS and THE context. This is not a programme-quality score.",
      )}
      ${keyFact(
        "Scored-weight coverage",
        coverage,
        null,
        "The percentage of the documented programme-ranking weight with a calculated component score.",
      )}
      ${keyFact("Strict final score", scoring.finalScore === null ? "Not calculated" : `${scoring.finalScore.toFixed(1)}/100`)}
      ${keyFact("Strict ordinal rank", scoring.ordinalRank === null ? "Not published" : `#${scoring.ordinalRank}`)}
    </div>
    ${ranked
      ? notice(
          "warning",
          scoring.publicLabel,
          "Low evidence coverage does not prevent provisional inclusion under approved method 1.1. Unscored weight is shrunk toward a neutral value of 50. Strict validated scores and ranks remain separate and unpublished.",
          "!",
        )
      : notice(
          "danger",
          "Not included in the provisional ranking",
          (scoring.exclusionReasons || []).join(" ") || "Programme eligibility has not been established.",
          "!",
        )}
    <details class="readiness-details">
      <summary>Component scores and coverage</summary>
      <div class="table-wrap">
        <table class="data-table compact-table">
          <thead><tr><th>Component</th><th>Weight</th><th>Score</th><th>Component coverage</th></tr></thead>
          <tbody>${components.map(([name, component]) => `<tr>
            <td>${esc(name)}</td>
            <td>${component.weightPercent.toFixed(1)}%</td>
            <td><strong>${component.score === null ? "Data pending" : component.score.toFixed(1)}</strong></td>
            <td>${component.coveragePercent.toFixed(1)}%</td>
          </tr>`).join("")}</tbody>
        </table>
      </div>
    </details>
    <details class="readiness-details">
      <summary>Route basis and cautions</summary>
      <p>${esc(scoring.routeClassification?.basis || "Route classification is still being reviewed.")}</p>
      <ul>${scoring.warnings.map((warning) => `<li>${esc(warning)}</li>`).join("")}</ul>
    </details>
  </section>`;
}

function overview(programme) {
  return `<section class="panel">
    <h2>Programme overview</h2>
    <div class="key-facts">
      ${keyFact("Country", programme.country)}
      ${keyFact("Selection cohort", `${programme.selectionCohort} · position ${programme.cohortPosition}`, null, "The mutually exclusive cohort used to construct the 30 QS + 30 THE sample.")}
      ${keyFact("Candidate source", programme.candidateSource)}
      ${keyFact("Provisional ranking route", programme.programmeType.value, programme.programmeType.state, "Approved method 1.1 uses a rule-based provisional route. The confidence and evidence basis remain visible.")}
      ${keyFact("Duration", programme.details.duration.display, programme.details.duration.state)}
      ${keyFact("Study mode", programme.details.studyMode.display, programme.details.studyMode.state)}
      ${keyFact("Teaching language", programme.details.language.display, programme.details.language.state)}
      ${keyFact("Thesis option", programme.details.thesis.value, programme.details.thesis.state)}
    </div>
  </section>
  <section class="panel">
    <h2>What the current evidence says</h2>
    <div class="content-grid">
      ${contentBlock("Curriculum focus", programme.details.curriculum, { full: true })}
      ${contentBlock("Entry requirements", programme.details.entryRequirements, { full: true })}
      ${contentBlock("Career or placement evidence", programme.details.careerEvidence, { full: true })}
    </div>
  </section>
  <section class="panel">
    <h2>Classification status</h2>
    <p>${esc(programme.programmeType.basis)}</p>
    ${notice("info", "Rule-based provisional classification", `Route confidence: ${titleCase(programme.programmeType.confidence || "not collected")}. An optional dissertation does not automatically make a programme research-oriented; strict validation remains separate.`, "i")}
  </section>
  ${scoringPanel(programme)}`;
}

function structure(programme) {
  return `<section class="panel">
    <h2>Programme structure and delivery</h2>
    <div class="key-facts">
      ${keyFact("Duration", programme.details.duration.display, programme.details.duration.state)}
      ${keyFact("Study mode", programme.details.studyMode.display, programme.details.studyMode.state)}
      ${keyFact("Study load", programme.details.studyLoad.join(" / ") || "Not stated")}
      ${keyFact("Capstone / project", programme.details.capstone.display, programme.details.capstone.state)}
    </div>
  </section>
  <section class="panel">
    <div class="content-grid">
      ${contentBlock("Tuition and fees", programme.details.tuition, { full: true, showOriginal: true })}
      ${contentBlock("Duration", programme.details.duration, { showOriginal: true })}
      ${contentBlock("Study mode / delivery", programme.details.studyMode, { showOriginal: true })}
      ${contentBlock("Curriculum focus", programme.details.curriculum, { full: true, showOriginal: true })}
      ${contentBlock("Capstone / project evidence", programme.details.capstone, { full: true, showOriginal: true })}
      ${contentBlock("Internship / fieldwork evidence", programme.details.internshipFieldwork, { full: true, showOriginal: true })}
    </div>
  </section>`;
}

function entry(programme) {
  return `<section class="panel">
    <h2>Entry requirements</h2>
    <p class="muted">Admissions rigor is not inferred from a country or university reputation. Country-aware threshold mapping remains a manual step.</p>
    <div class="content-grid">
      ${contentBlock("Academic and application requirements", programme.details.entryRequirements, { full: true, showOriginal: true })}
      ${contentBlock("English-language requirements", programme.details.englishRequirement, { full: true, showOriginal: true })}
    </div>
  </section>
  ${programme.details.englishRequirement.state === "not-collected"
    ? notice("warning", "English requirement incomplete", "See the linked official admissions page. Missing text does not mean an applicant has no English-language requirement.", "!")
    : notice("info", "Threshold scoring remains manual", "The captured source may include component scores, waivers, and different test versions. No regular-expression score has been generated.", "i")
  }`;
}

function research(programme) {
  const readiness = programme.rankingReadiness.research;
  return `<section class="panel">
    <h2>Research and thesis options</h2>
    <div class="key-facts">
      ${keyFact("Thesis option", programme.details.thesis.value, programme.details.thesis.state)}
      ${keyFact("Capstone / project", programme.details.capstone.display, programme.details.capstone.state)}
      ${keyFact("Internship / fieldwork", programme.details.internshipFieldwork.display, programme.details.internshipFieldwork.state)}
      ${keyFact("Research-route signal", programme.programmeType.value, programme.programmeType.state)}
    </div>
  </section>
  <section class="panel">
    <div class="content-grid">
      ${contentBlock("Thesis source evidence", programme.details.thesis, { showOriginal: true })}
      ${contentBlock("Capstone / project source evidence", programme.details.capstone, { showOriginal: true })}
      ${contentBlock("Curriculum and methods evidence", programme.details.curriculum, { full: true })}
    </div>
  </section>
  <section class="panel">
    <h2>Research evidence coverage</h2>
    <p><strong>${readiness.evidenceCoverage.toFixed(1)}% evidence coverage</strong> · ${esc(readiness.coverageLabel)}</p>
    <p class="muted">${esc(readiness.publicTreatment)}</p>
    ${notice(
      "info",
      programme.scoring?.track === "research" ? "Provisional research route" : "Not classified in the provisional research track",
      programme.scoring?.track === "research"
        ? "Approved method 1.1 allows provisional ranking despite low coverage and shows each missing component. This evidence-readiness measure remains useful context but does not block provisional inclusion."
        : "This evidence-readiness view does not override the approved rule-based provisional route shown in the scoring panel.",
      "i",
    )}
  </section>`;
}

function engagement(programme) {
  const { aashe, prme, openAlex } = programme.signals;
  return `<section class="panel">
    <h2>Sustainability engagement and research signals</h2>
    <p class="muted">Scope matters. Campus- and school-level records are not promoted to the entire university.</p>
    <div class="signal-grid">
      ${signalCard("AASHE STARS", aashe.state, [
        ["Matched institution", aashe.matchedInstitution],
        ["Rating", aashe.rating],
        ["Valid through", aashe.validThrough],
        ["Scope note", aashe.scopeNote],
      ], aashe.profileUrl, "AASHE profile")}
      ${signalCard("UN PRME", prme.state, [
        ["Matched signatory", prme.matchedSignatory],
        ["Status", prme.status],
        ["Recent SIP reports", prme.recentSipCount],
        ["Scope note", prme.scopeNote],
      ], prme.signatoryUrl, "PRME signatory")}
      ${signalCard("OpenAlex", openAlex.state, [
        ["Matched institution", openAlex.matchedInstitution],
        ["All-time works", openAlex.works === null ? null : fmtNumber(openAlex.works)],
        ["All-time H-index", openAlex.hIndex === null ? null : fmtNumber(openAlex.hIndex)],
        ["Keyword works, 2021–2025", openAlex.keywordWorks2021to2025 === null ? null : fmtNumber(openAlex.keywordWorks2021to2025)],
      ], openAlex.searchUrl, "OpenAlex match")}
    </div>
  </section>
  ${notice("info", "Institutional scope only", "OpenAlex indicators are institution-level research signals and are incomplete for 32 programmes. AASHE and PRME have geographic and organisational coverage limits.", "i")}`;
}

function rankings(programme) {
  return `${notice("info", "Institutional context, not a programme rank", "QS Sustainability and THE Impact describe institutional sustainability or impact. QS and THE World University Rankings describe the institution overall.", "i")}
  <section class="panel">
    <div class="section-heading">
      <div>
        <h2>Institution Strength context</h2>
        <p class="muted">The documented recent-series formula is applied to available ranking histories. It is not a final programme score.</p>
      </div>
      <div>
        <strong>${programme.institutionStrength.score ?? "Not available"}</strong>
        <div class="small muted">${programme.institutionStrength.coverage.toFixed(1)}% of four series available</div>
      </div>
    </div>
    <p class="small">${rankingStateDefinition()}</p>
    <div class="chart-grid">
      ${rankLineChart("QS Sustainability", programme.rankings.qsSustainability)}
      ${rankLineChart("THE Impact", programme.rankings.theImpact)}
      ${rankLineChart("QS World University Rankings", programme.rankings.qsUniversity)}
      ${rankLineChart("THE World University Rankings", programme.rankings.theUniversity)}
    </div>
  </section>`;
}

function community(programme) {
  const community = programme.community;
  if (!community.eligibleRecords || !community.headlineTone) {
    return `${notice("info", "Community discussion coverage", community.warning, "i")}
      <section class="panel"><h2>No eligible aggregate evidence</h2><p>No headline-tone score or comparison is shown. Missing community evidence is not treated as neutral or zero.</p></section>`;
  }
  const tone = community.headlineTone;
  const outcomes = community.admissionsOutcomes;
  return `${notice("warning", "Exploratory community evidence", "These are institution-associated Reddit discussions, not verified sentiment about this selected programme. Reddit never enters either academic ranking.", "!")}
    ${community.warning ? notice("warning", "Coverage warning", community.warning, "!") : ""}
    <section class="panel">
      <div class="section-heading">
        <div>
          <h2>Community discussion coverage</h2>
          <p class="muted">Headline tone uses de-identified aggregate counts only.</p>
        </div>
        ${badge(community.comparable ? "verified" : "manual-review", community.coverageLevel)}
      </div>
      <div class="key-facts">
        ${keyFact("Eligible records", fmtNumber(community.eligibleRecords))}
        ${keyFact("High relevance", fmtNumber(community.highRelevance))}
        ${keyFact("Medium relevance", fmtNumber(community.mediumRelevance))}
        ${keyFact("Top primary topic", community.topTopic || "Not collected")}
        ${keyFact("General forum", fmtNumber(community.generalForum))}
        ${keyFact("School forum", fmtNumber(community.schoolForum))}
      </div>
    </section>
    <section class="panel">
      <h2>Exploratory headline tone</h2>
      ${stackedDistribution(
        [tone.positive, tone.neutral, tone.negative],
        ["Positive", "Neutral", "Negative"],
        { ariaLabel: "Institution-associated headline tone distribution" },
      )}
      <p class="small muted">VADER title labels: Positive ≥ 0.05; Negative ≤ −0.05; otherwise Neutral. Manual calibration is not complete.</p>
    </section>
    <section class="panel">
      <h2>Admissions-outcome mentions</h2>
      <div class="key-facts">
        ${keyFact("Accepted or offer", fmtNumber(outcomes.acceptedOrOffer))}
        ${keyFact("Rejected", fmtNumber(outcomes.rejected))}
        ${keyFact("Waitlisted", fmtNumber(outcomes.waitlisted))}
        ${keyFact("Pending or waiting", fmtNumber(outcomes.pendingOrWaiting))}
      </div>
      <p class="small muted">Outcome classification is separate from sentiment. A rejection post may still use positive language.</p>
    </section>`;
}

function sources(programme) {
  const scoringSources = programme.scoring?.sources || [];
  return `<section class="panel">
    <h2>Sources</h2>
    ${sourceList(programme)}
  </section>
  <section class="panel">
    <h2>Audit and data quality</h2>
    <div class="content-grid">
      ${contentBlock("Extraction status", { value: programme.audit.extractionStatus, display: programme.audit.extractionStatus || "Not collected", state: programme.audit.extractionStatus ? "manual-review" : "not-collected" })}
      ${contentBlock("Review notes", { value: programme.audit.reviewNotes, display: programme.audit.reviewNotes || "Not collected", state: programme.audit.reviewNotes ? "manual-review" : "not-collected" })}
      ${contentBlock("URL audit", { value: programme.audit.urlAuditNote, display: programme.audit.urlAuditNote || "Not collected", state: programme.verification.urlAudit === "OK" ? "verified" : "manual-review" }, { full: true })}
    </div>
  </section>
  <section class="panel">
    <h2>Scoring snapshot and source links</h2>
    <p class="muted">Scoring method ${esc(programme.scoring?.methodVersion || "Not collected")}. The snapshot supplies the approved provisional route, available component scores, coverage, and—where eligible—a provisional score and within-track rank. Strict validated results remain separate.</p>
    <div class="source-list">${scoringSources.map((url, index) => `
      <div class="source-row">
        <strong>Scoring source ${index + 1}</strong>
        <span class="small muted">${index === 0 ? "Programme evidence source" : "Institutional ranking source"}</span>
        ${externalLink(url, "Open source", "small secondary")}
      </div>
    `).join("") || '<p class="muted">No scoring source links were supplied.</p>'}</div>
  </section>
  <section class="panel">
    <h2>Meaning of missing states</h2>
    <dl class="definition-list">
      <dt>Not stated</dt><dd>The reviewed source did not state a usable value.</dd>
      <dt>Not collected</dt><dd>A usable source value was not captured. This is not zero or No.</dd>
      <dt>Manual review required</dt><dd>Source evidence exists, but value, programme identity, or scope remains ambiguous.</dd>
      <dt>Not ranked / ranking not published</dt><dd>These are separate published-ranking states and are never silently merged.</dd>
    </dl>
  </section>`;
}

export function renderProgramme(context, query) {
  const id = query.get("id") || "";
  const programme = context.data.programmeById.get(id);
  if (!programme) {
    setDocumentTitle("Programme not found");
    return `<div class="page page-narrow">
      <div class="error-state">
        <div>
          <p class="eyebrow">Invalid programme link</p>
          <h1>Programme not found</h1>
          <p class="muted">The URL did not contain a current stable programme identifier.</p>
          <a class="button" href="${routeHref("/explore")}">Return to Explore</a>
        </div>
      </div>
      ${footer(context.data.metadata)}
    </div>`;
  }
  setDocumentTitle(programme.programme);
  const requestedTab = query.get("tab") || "overview";
  const validTabs = new Set(TABS.map(([key]) => key));
  const tab = validTabs.has(requestedTab) ? requestedTab : "overview";
  const invalidTab = requestedTab !== tab;
  const selected = context.store.compare.includes(programme.id);
  const body = {
    overview,
    structure,
    entry,
    research,
    engagement,
    rankings,
    community,
    sources,
  }[tab](programme);

  return `<div class="page">
    <a class="small" href="${routeHref("/explore")}">← Back to Explore</a>
    <header class="detail-hero">
      <div>
        <p class="eyebrow">${esc(programme.country)} · ${esc(programme.candidateSource)}</p>
        <h1>${esc(programme.programme)}</h1>
        <p class="lede">${esc(programme.institution)}</p>
        <div class="badge-row">
          ${verificationBadge(programme)}
          ${badge(programme.programmeType.state, programme.programmeType.value)}
          ${programme.scoring ? badge(programme.scoring.status.tone, programme.scoring.status.label) : ""}
        </div>
      </div>
      <div class="detail-actions">
        ${externalLink(programme.sources.programmeUrl, "Official programme")}
        <button class="button ${selected ? "danger" : "secondary"}" type="button" data-compare-toggle="${esc(programme.id)}">${selected ? "Remove from compare" : "Add to compare"}</button>
      </div>
    </header>
    ${programme.verification.warning
      ? notice(
          programme.verification.state === "unverified" ? "danger" : "warning",
          programme.verification.state === "unverified" ? "Programme eligibility unverified" : "Data quality notice",
          `${programme.verification.warning} ${programme.verification.note || ""}`,
          "!",
        )
      : ""}
    ${programme.scoring?.provisionalEligible === false
      ? notice(
          programme.scoring.criticalWarning ? "danger" : "warning",
          "Excluded from provisional programme ranking",
          (programme.scoring.exclusionReasons || []).join(" ")
            || "Programme eligibility requires further review.",
          "!",
        )
      : ""}
    ${invalidTab ? notice("warning", "Invalid section parameter", "The requested section does not exist, so Overview is shown.", "!") : ""}
    ${tabNavigation(programme, tab)}
    <div id="programme-tab">${body}</div>
    ${footer(context.data.metadata)}
  </div>`;
}
