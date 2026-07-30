import { coverageMeter } from "../components.js";
import {
  badge,
  esc,
  footer,
  notice,
  routeHref,
  setDocumentTitle,
} from "../utils.js";

const TRACKS = {
  research: {
    title: "Research-Oriented Provisional Ranking",
    shortTitle: "Research-oriented",
    description: "Coverage-adjusted results for programmes provisionally classified around independent research, thesis, or original-research signals.",
  },
  taught: {
    title: "Taught / Professional Provisional Ranking",
    shortTitle: "Taught / Professional",
    description: "Coverage-adjusted results for programmes provisionally classified around coursework, applied learning, and professional practice.",
  },
};

function displayComponentName(name) {
  return name.replace(/^Program /, "Programme ");
}

function routeConfidenceBadge(confidence) {
  if (confidence === "high") return badge("info", "High route confidence");
  if (confidence === "medium") return badge("manual-review", "Medium route confidence");
  if (confidence === "low") return badge("manual-review", "Low route confidence");
  return badge("not-collected", "Route confidence not available");
}

function componentDetails(programme) {
  const entries = Object.entries(programme.scoring.components);
  const scored = entries.filter(([, component]) => component.score !== null).length;
  const pending = entries.length - scored;
  return `<details class="ranking-details">
    <summary>${scored}/${entries.length} components scored · ${pending} pending</summary>
    <div class="component-list">
      ${entries.map(([name, component]) => `
        <div class="component-row">
          <div>
            <strong>${esc(displayComponentName(name))}</strong>
            <span>${component.weightPercent === null ? "Weight not available" : `${component.weightPercent.toFixed(0)}% method weight`} · ${component.coveragePercent === null ? "Coverage not available" : `${component.coveragePercent.toFixed(0)}% component coverage`}</span>
          </div>
          <div>
            <strong>${component.score === null ? "Data pending" : component.score.toFixed(1)}</strong>
          </div>
        </div>
      `).join("")}
    </div>
    <div class="ranking-warning-list">
      <strong>Evidence and validation notes</strong>
      <ul>${programme.scoring.warnings.map((warning) => `<li>${esc(warning)}</li>`).join("")}</ul>
    </div>
  </details>`;
}

function rankingResult(programme, track, trackCount) {
  const scoring = programme.scoring;
  const shared = scoring.provisionalRankGroupSize > 1;
  return `<article class="ranking-result">
    <div class="ranking-position">
      <span>Provisional rank</span>
      <strong>${esc(scoring.provisionalRankText)}</strong>
      <small>${shared ? `Shared rank group · ${scoring.provisionalRankGroupSize} programmes` : `Within ${trackCount} ${track.shortTitle.toLowerCase()} programmes`}</small>
    </div>
    <div class="ranking-programme">
      <div class="badge-row">
        ${badge("manual-review", "Provisional result")}
        ${routeConfidenceBadge(scoring.routeClassification.confidence)}
      </div>
      <h2><a href="${routeHref("/programme", { id: programme.id })}">${esc(programme.programme)}</a></h2>
      <p>${esc(programme.institution)} · ${esc(programme.country)}</p>
      <span class="small muted">${esc(scoring.routeClassification.basis || "Rule-based provisional route classification.")}</span>
    </div>
    <div class="ranking-metrics">
      <div>
        <span>Provisional score</span>
        <strong>${esc(scoring.provisionalScoreText)}</strong>
        <small>Coverage-adjusted / 100</small>
      </div>
      <div>
        <span>Scored-weight coverage</span>
        ${coverageMeter(scoring.scoredWeightCoverage, "Scored-weight coverage")}
        <small>Neutral shrinkage applies to missing weight</small>
      </div>
      <div>
        <span>Strict result</span>
        <strong>Not published</strong>
        <small>Final score and strict rank remain separate</small>
      </div>
    </div>
    ${componentDetails(programme)}
  </article>`;
}

function exclusionsSection(programmes) {
  return `<section class="panel exclusion-panel">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Programme eligibility</p>
        <h2>Excluded from the provisional ranking</h2>
        <p class="muted">These records receive no provisional score or rank while programme identity or graduate-programme eligibility remains unresolved.</p>
      </div>
      ${badge("unverified", `${programmes.length} excluded`)}
    </div>
    <div class="exclusion-list">${programmes.map((programme) => `
      <article>
        <div>
          <h3><a href="${routeHref("/programme", { id: programme.id })}">${esc(programme.institution)}</a></h3>
          <p>${esc(programme.programme)}</p>
        </div>
        <div>
          ${badge("unverified", "Not ranked — eligibility review")}
          <ul>${programme.scoring.exclusionReasons.map((reason) => `<li>${esc(reason)}</li>`).join("")}</ul>
        </div>
      </article>
    `).join("")}</div>
  </section>`;
}

export function renderRankings(context, trackKey) {
  const track = TRACKS[trackKey];
  setDocumentTitle(track.title);
  const allProgrammes = context.data.programmes;
  const scoring = context.data.metadata.scoring;
  const programmes = allProgrammes
    .filter((programme) => (
      programme.scoring?.track === trackKey
      && programme.scoring.provisionalRank !== null
    ))
    .sort((a, b) => (
      a.scoring.provisionalRank - b.scoring.provisionalRank
      || b.scoring.provisionalScore - a.scoring.provisionalScore
      || a.institution.localeCompare(b.institution)
    ));
  const exclusions = allProgrammes
    .filter((programme) => programme.scoring?.provisionalEligible === false)
    .sort((a, b) => a.institution.localeCompare(b.institution));
  const coverages = programmes.map((programme) => programme.scoring.scoredWeightCoverage);
  const lowConfidenceRoutes = programmes.filter(
    (programme) => programme.scoring.routeClassification.confidence === "low",
  ).length;
  const componentWeights = Object.entries(programmes[0]?.scoring.components || {});

  return `<div class="page">
    <header class="page-header">
      <p class="eyebrow">Approved project methodology · ${esc(scoring.methodVersion)}</p>
      <h1>${esc(track.title)}</h1>
      <p class="lede">${esc(track.description)} Research and taught programmes remain separate because they serve different study goals.</p>
    </header>

    ${notice(
      "warning",
      "Provisional project ranking — not an official QS or THE ranking",
      "These results use approved method 1.1. Low coverage does not block provisional inclusion; coverage, route confidence, missing components, and warnings remain visible. Strict final scores and ranks are not published.",
      "!",
    )}

    <nav class="track-switcher" aria-label="Provisional ranking route">
      <a href="${routeHref("/rankings/research")}" ${trackKey === "research" ? 'aria-current="page"' : ""}>Research-oriented</a>
      <a href="${routeHref("/rankings/taught")}" ${trackKey === "taught" ? 'aria-current="page"' : ""}>Taught / Professional</a>
    </nav>

    <section class="panel scoring-panel ranking-summary">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Current provisional release</p>
          <h2>${programmes.length} programmes in this route</h2>
          <p class="muted">${esc(scoring.publicLabel)}</p>
        </div>
        <a class="button ghost" href="${routeHref("/methodology")}">How method 1.1 works</a>
      </div>
      <div class="key-facts">
        <div class="key-fact"><span class="fact-label">Ranked in this route</span><strong>${programmes.length}</strong><span class="small muted">Within-track only</span></div>
        <div class="key-fact"><span class="fact-label">Coverage range</span><strong>${Math.min(...coverages).toFixed(0)}–${Math.max(...coverages).toFixed(0)}%</strong><span class="small muted">Scored method weight</span></div>
        <div class="key-fact"><span class="fact-label">Low-confidence routes</span><strong>${lowConfidenceRoutes}</strong><span class="small muted">Classification confidence remains visible</span></div>
        <div class="key-fact"><span class="fact-label">Strict ranks published</span><strong>${scoring.ordinalRanksPublished}</strong><span class="small muted">Separate future validated release</span></div>
      </div>
    </section>

    <section class="panel">
      <details class="method-details">
        <summary>View component weights for this route</summary>
        <div class="weight-grid">${componentWeights.map(([name, component]) => `
          <div class="weight-card">
            <strong>${component.weightPercent === null ? "Data pending" : `${component.weightPercent.toFixed(0)}%`}</strong>
            <span>${esc(displayComponentName(name))}</span>
          </div>
        `).join("")}</div>
      </details>
    </section>

    <section aria-labelledby="provisional-results-title">
      <div class="section-heading ranking-list-heading">
        <div>
          <p class="eyebrow">Within-track order</p>
          <h2 id="provisional-results-title">Coverage-adjusted provisional results</h2>
        </div>
        <span class="small muted">Shared rank groups may contain different rounded scores.</span>
      </div>
      <div class="ranking-list">${programmes.map((programme) => rankingResult(programme, track, programmes.length)).join("")}</div>
    </section>

    ${exclusionsSection(exclusions)}

    ${notice(
      "info",
      "Strict validated release remains separate",
      `Method 1.1 currently publishes ${scoring.provisionalRanked} coverage-adjusted provisional ranks. Strict final programme scores remain not calculated and strict ordinal ranks remain not published.`,
      "i",
    )}
    ${footer(context.data.metadata)}
  </div>`;
}
