import {
  badge,
  esc,
  externalLink,
  fieldDisplay,
  fieldState,
  fmtNumber,
  latestRankDisplay,
  nl2br,
  routeHref,
  STATE_LABELS,
  tooltip,
} from "./utils.js";

export function verificationBadge(programme) {
  return badge(programme.verification.state, programme.verification.label);
}

export function latestRankBox(label, item) {
  const rank = latestRankDisplay(item);
  return `<div class="rank-context">
    <strong>${esc(rank.display)}</strong>
    <span>${esc(label)}${rank.year ? ` · ${rank.year}` : ""}</span>
  </div>`;
}

function provisionalSnapshot(programme) {
  const scoring = programme.scoring;
  if (!scoring) {
    return `<div class="card-scoring unavailable">${badge("not-collected", "Scoring data pending")}</div>`;
  }
  if (scoring.provisionalRank === null) {
    return `<div class="card-scoring unavailable">
      <span class="fact-label">Provisional ranking</span>
      <strong>Not ranked</strong>
      <span class="small muted">Eligibility review</span>
    </div>`;
  }
  return `<div class="card-scoring" aria-label="Provisional programme ranking">
    <div>
      <span class="fact-label">Within-track rank</span>
      <strong>#${scoring.provisionalRank}${scoring.provisionalRankGroupSize > 1 ? ` · shared by ${scoring.provisionalRankGroupSize}` : ""}</strong>
    </div>
    <div>
      <span class="fact-label">Provisional score</span>
      <strong>${scoring.provisionalScore.toFixed(1)}</strong>
    </div>
    <div>
      <span class="fact-label">Evidence coverage</span>
      <strong>${scoring.scoredWeightCoverage.toFixed(1)}%</strong>
    </div>
  </div>`;
}

export function programmeCard(programme, selected = false) {
  return `<article class="programme-card" data-programme-card="${esc(programme.id)}">
    <div>
      <div class="eyebrow">${esc(programme.country)} · ${esc(programme.selectionCohort)} cohort</div>
      <h2><a href="${routeHref("/programme", { id: programme.id })}">${esc(programme.programme)}</a></h2>
      <div class="institution">${esc(programme.institution)}</div>
    </div>
    <div class="badge-row card-badges">
      ${verificationBadge(programme)}
      ${badge(programme.programmeType.state, programme.programmeType.value)}
    </div>
    ${programme.scoring?.provisionalEligible === false
      ? `<div class="card-warning"><strong>Not included in the provisional ranking</strong><span>${esc(
          (programme.scoring.exclusionReasons || []).join(" ")
            || "Programme eligibility requires review.",
        )}</span></div>`
      : ""}
    <div class="card-facts">
      <div><span class="fact-label">Duration</span><span class="fact-value">${esc(programme.details.duration.display)}</span></div>
      <div><span class="fact-label">Study mode</span><span class="fact-value">${esc(programme.details.studyMode.display)}</span></div>
      <div><span class="fact-label">Study load</span><span class="fact-value">${esc(programme.details.studyLoad.join(" / ") || "Not stated")}</span></div>
      <div><span class="fact-label">Thesis option</span><span class="fact-value">${esc(programme.details.thesis.value)}</span></div>
    </div>
    ${provisionalSnapshot(programme)}
    <div class="card-actions">
      <a class="button secondary" href="${routeHref("/programme", { id: programme.id })}">View evidence</a>
      <button
        class="button ${selected ? "danger" : "ghost"}"
        type="button"
        data-compare-toggle="${esc(programme.id)}"
        aria-pressed="${selected}"
      >${selected ? "Remove" : "Compare"}</button>
    </div>
  </article>`;
}

export function programmeTable(programmes, selectedIds) {
  return `<div class="table-wrap">
    <table class="data-table">
      <caption>${programmes.length} programmes. Provisional ranks are within separate Research-oriented or Taught / Professional tracks.</caption>
      <thead><tr>
        <th>Programme</th>
        <th>Country</th>
        <th>Evidence status</th>
        <th>Provisional route</th>
        <th>Provisional result</th>
        <th>Duration</th>
        <th>Compare</th>
      </tr></thead>
      <tbody>${programmes.map((programme) => {
        const selected = selectedIds.includes(programme.id);
        const scoring = programme.scoring;
        return `<tr>
          <td class="programme-cell">
            <a href="${routeHref("/programme", { id: programme.id })}">${esc(programme.programme)}</a>
            <div class="small muted">${esc(programme.institution)}</div>
          </td>
          <td>${esc(programme.country)}</td>
          <td>${verificationBadge(programme)}</td>
          <td>${esc(programme.programmeType.value)}<div class="micro muted">${esc(scoring?.routeClassification?.confidence || "Data pending")} confidence</div></td>
          <td>${scoring?.provisionalRank === null || scoring?.provisionalRank === undefined
            ? '<strong>Not ranked</strong><div class="micro muted">Eligibility review</div>'
            : `<strong>#${scoring.provisionalRank}${scoring.provisionalRankGroupSize > 1 ? ` · shared by ${scoring.provisionalRankGroupSize}` : ""}</strong><div class="micro muted">${scoring.provisionalScore.toFixed(1)}/100 · ${scoring.scoredWeightCoverage.toFixed(1)}% coverage</div>`}
          </td>
          <td>${esc(programme.details.duration.display)}</td>
          <td><button class="button small ${selected ? "danger" : "ghost"}" type="button" data-compare-toggle="${esc(programme.id)}">${selected ? "Remove" : "Compare"}</button></td>
        </tr>`;
      }).join("")}</tbody>
    </table>
  </div>`;
}

export function keyFact(label, value, state = null, definition = null) {
  const heading = definition ? tooltip(label, definition) : esc(label);
  return `<div class="key-fact">
    <span class="fact-label">${heading}</span>
    <strong>${esc(value ?? "Not collected")}</strong>
    ${state ? badge(state) : ""}
  </div>`;
}

export function contentBlock(title, field, options = {}) {
  const value = fieldDisplay(field, options.fallback || "Not collected");
  const state = fieldState(field);
  const original =
    options.showOriginal && field?.original && String(field.original).trim() !== String(value).trim()
      ? `<div class="original-value"><strong>Original source value:</strong><br>${nl2br(field.original)}</div>`
      : "";
  return `<section class="content-block ${options.full ? "full" : ""}">
    <h3>${esc(title)}</h3>
    <div class="long-copy">${nl2br(value)}</div>
    <div class="field-meta">
      ${badge(state)}
      ${field?.note ? `<span class="small muted">${esc(field.note)}</span>` : ""}
    </div>
    ${original}
  </section>`;
}

export function signalCard(title, state, rows, url = null, linkLabel = "Open source") {
  return `<article class="signal">
    <h3>${esc(title)}</h3>
    ${badge(state)}
    <dl>${rows.map(([label, value]) => `
      <dt>${esc(label)}</dt>
      <dd>${value === null || value === undefined || value === "" ? "Not collected" : esc(value)}</dd>
    `).join("")}</dl>
    ${url ? externalLink(url, linkLabel, "small secondary") : ""}
  </article>`;
}

export function coverageMeter(value, label) {
  return `<div>
    <strong class="numeric">${Number(value).toFixed(1)}%</strong>
    <div class="coverage-meter" role="img" aria-label="${esc(`${label}: ${Number(value).toFixed(1)} percent`)}">
      <span style="width:${Math.max(0, Math.min(100, Number(value)))}%"></span>
    </div>
  </div>`;
}

export function rankingStateDefinition() {
  return `${tooltip("NR", "Not ranked in the collected complete official table. This differs from missing collection.")}
    · ${tooltip("N/P", "The ranking edition was not published; it remains missing rather than zero.")}
    · ${tooltip("200+", "The institution ranked beyond 200. The exact published number is intentionally suppressed.")}`;
}

export function sourceList(programme) {
  const sources = [
    ["Official programme page", programme.sources.programmeUrl, "Programme structure, admissions, and other programme evidence."],
    ...programme.sources.additionalProgrammeUrls.map((url, index) => [
      `Additional official source ${index + 1}`,
      url,
      "Supplementary official programme evidence.",
    ]),
    ["QS institution profile", programme.sources.qsProfileUrl, "Institution-level QS context."],
    ["THE institution profile", programme.sources.theProfileUrl, "Institution-level THE context."],
  ].filter(([, url]) => url);
  return `<div class="source-list">${sources.map(([label, url, scope]) => `
    <div class="source-row">
      <strong>${esc(label)}</strong>
      <span class="small muted">${esc(scope)}</span>
      <a href="${esc(url)}" target="_blank" rel="noopener noreferrer">Open source ↗</a>
    </div>
  `).join("")}</div>`;
}

export function availabilityLabel(component) {
  const label = STATE_LABELS[component.status] || component.status;
  return `${badge(component.status, label)}<div class="small muted">${esc(component.detail)}</div>`;
}

export function numberOrState(value, state = "not-collected") {
  return value === null || value === undefined ? badge(state) : fmtNumber(value);
}
