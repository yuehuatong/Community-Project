import { horizontalBars, stackedDistribution } from "../charts.js";
import { keyFact } from "../components.js";
import {
  badge,
  esc,
  footer,
  fmtNumber,
  notice,
  routeHref,
  setDocumentTitle,
} from "../utils.js";

function institutionPanel(programme) {
  const community = programme.community;
  if (!community.eligibleRecords || !community.headlineTone) {
    return `<div class="content-block full">
      <h2>${esc(programme.institution)}</h2>
      ${notice("info", "No eligible aggregate records", community.warning, "i")}
      <p class="muted">No zero or neutral tone value is imputed.</p>
    </div>`;
  }
  const tone = community.headlineTone;
  return `<div class="content-block full">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Single-institution view</p>
        <h2>${esc(programme.institution)}</h2>
        <p class="muted">${esc(programme.programme)}</p>
      </div>
      ${badge(community.comparable ? "verified" : "manual-review", community.coverageLevel)}
    </div>
    ${community.warning ? notice("warning", "Coverage warning", community.warning, "!") : ""}
    <div class="key-facts">
      ${keyFact("Eligible records", fmtNumber(community.eligibleRecords))}
      ${keyFact("High relevance", fmtNumber(community.highRelevance))}
      ${keyFact("Medium relevance", fmtNumber(community.mediumRelevance))}
      ${keyFact("Top primary topic", community.topTopic || "Not collected")}
      ${keyFact("General-forum discussions", fmtNumber(community.generalForum))}
      ${keyFact("School-forum discussions", fmtNumber(community.schoolForum))}
    </div>
    <h3 style="margin-top:22px">Exploratory headline tone</h3>
    ${stackedDistribution(
      [tone.positive, tone.neutral, tone.negative],
      ["Positive", "Neutral", "Negative"],
      { ariaLabel: `${programme.institution} institution-associated headline tone` },
    )}
    <p class="small muted">This is not verified sentiment about the selected programme and is not used to compare programme quality.</p>
  </div>`;
}

function monthlyTable(monthly) {
  return `<div class="table-wrap">
    <table class="data-table">
      <caption>Combined monthly volume. Source composition changes in July 2025.</caption>
      <thead><tr><th>Month</th><th>Eligible posts</th><th>Positive</th><th>Neutral</th><th>Negative</th><th>Mean headline compound</th></tr></thead>
      <tbody>${monthly.map((row) => `<tr>
        <td>${esc(row.month)}</td>
        <td>${fmtNumber(row.uniquePosts)}</td>
        <td>${fmtNumber(row.positive)}</td>
        <td>${fmtNumber(row.neutral)}</td>
        <td>${fmtNumber(row.negative)}</td>
        <td>${row.meanHeadlineCompound?.toFixed(3) ?? "Not collected"}</td>
      </tr>`).join("")}</tbody>
    </table>
  </div>`;
}

export function renderCommunity(context, query) {
  setDocumentTitle("Community insights");
  const { community, programmes, programmeById, metadata } = context.data;
  const requestedId = query.get("institution") || "";
  const selected = requestedId ? programmeById.get(requestedId) : null;
  const invalid = Boolean(requestedId && !selected);
  const meta = community.metadata;
  const tone = community.overallHeadlineTone;
  const totalTone = tone.positive + tone.neutral + tone.negative;
  const sourceComposition = Object.fromEntries(
    community.sourceComposition.map((item) => [item.sourceType, item.uniquePosts]),
  );

  return `<div class="page">
    <header class="page-header">
      <p class="eyebrow">Community insights</p>
      <h1>Institution-associated discussions, interpreted carefully.</h1>
      <p class="lede">The public package contains de-identified aggregate evidence only. It does not contain usernames, author IDs, post IDs, titles, excerpts, or direct post links.</p>
    </header>
    ${notice("warning", "Exploratory community evidence — not programme quality", "Most records are institution-associated graduate-admissions or university discussions, and many are not programme-specific. Reddit is excluded from both academic rankings.", "!")}
    ${invalid ? notice("warning", "Invalid institution parameter ignored", "The requested identifier is not part of the synchronized 60-programme sample.", "!") : ""}

    <section class="community-summary-grid" aria-label="Community dataset summary">
      <div class="summary-stat"><strong>${fmtNumber(meta.uniqueEligiblePosts)}</strong><span>unique eligible Reddit posts</span></div>
      <div class="summary-stat"><strong>${fmtNumber(meta.institutionPostRecords)}</strong><span>institution-post records</span></div>
      <div class="summary-stat"><strong>${meta.institutionsCovered}/60</strong><span>institutions with eligible records</span></div>
      <div class="summary-stat"><strong>${meta.rawFiles}</strong><span>source files in the integrity manifest</span></div>
    </section>

    <section class="panel">
      <div class="section-heading">
        <div>
          <h2>Overall exploratory headline tone</h2>
          <p class="muted">${esc(meta.method)}</p>
        </div>
        ${badge("manual-review", "Manual calibration incomplete")}
      </div>
      ${stackedDistribution(
        [tone.positive, tone.neutral, tone.negative],
        ["Positive", "Neutral", "Negative"],
        { ariaLabel: `Overall headline tone across ${totalTone} unique eligible posts` },
      )}
    </section>

    <div class="content-grid">
      <section class="panel">
        <h2>Primary-topic distribution</h2>
        <p class="small muted">Each eligible post receives one primary topic. Topic is separate from sentiment.</p>
        ${horizontalBars(community.topics, "topic", "uniquePosts", 8)}
      </section>
      <section class="panel">
        <h2>Admissions-outcome distribution</h2>
        <p class="small muted">Outcome labels do not imply positive or negative tone.</p>
        ${horizontalBars(community.outcomes, "outcome", "uniquePosts", 6)}
      </section>
      <section class="panel">
        <h2>Concern-signal distribution</h2>
        <p class="small muted">Concern flags are multi-label and do not sum to the total. They are signals, not verified programme characteristics.</p>
        ${horizontalBars(community.concerns, "concern", "uniquePosts", 8)}
      </section>
      <section class="panel">
        <h2>General versus school forums</h2>
        <div class="key-facts" style="grid-template-columns:repeat(2,minmax(0,1fr))">
          ${keyFact("General-forum discussions", fmtNumber(sourceComposition["General forum"] || 0))}
          ${keyFact("School-forum discussions", fmtNumber(sourceComposition["School forum"] || 0))}
        </div>
        <p class="small muted" style="margin-top:14px">Forum cultures differ. An institution with general-forum-only evidence receives a visible warning and is not treated as comparable.</p>
      </section>
    </div>

    <section class="panel">
      <h2>Inspect one institution’s coverage</h2>
      <p class="muted">This is a single-institution inspection, not a sentiment leaderboard.</p>
      <div class="community-select">
        <div class="field">
          <label for="community-institution">Institution</label>
          <select id="community-institution">
            <option value="">Choose an institution</option>
            ${[...programmes].sort((a, b) => a.institution.localeCompare(b.institution)).map((programme) => `
              <option value="${esc(programme.id)}" ${selected?.id === programme.id ? "selected" : ""}>${esc(programme.institution)} — ${esc(programme.programme)}</option>
            `).join("")}
          </select>
        </div>
        ${selected ? `<a class="button ghost" href="${routeHref("/programme", { id: selected.id, tab: "community" })}">Open programme page</a>` : ""}
      </div>
      ${selected ? institutionPanel(selected) : `<div class="empty-state" style="min-height:180px"><p>Select an institution to inspect eligible records, relevance, forum composition, and coverage level.</p></div>`}
    </section>

    <section class="panel">
      <h2>Monthly collection view</h2>
      ${notice("warning", "Visible source-composition break", meta.trendWarning, "!")}
      ${monthlyTable(community.monthly)}
    </section>

    <section class="panel">
      <h2>Institution discussion coverage</h2>
      <p class="muted">This table compares collection coverage only—not sentiment, reputation, or programme quality.</p>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Programme</th><th>Eligible records</th><th>High relevance</th><th>Medium relevance</th><th>General forum</th><th>School forum</th><th>Coverage Level</th></tr></thead>
          <tbody>${[...programmes].sort((a, b) => a.institution.localeCompare(b.institution)).map((programme) => {
            const item = programme.community;
            return `<tr>
              <td class="programme-cell"><a href="${routeHref("/community", { institution: programme.id })}">${esc(programme.institution)}</a><div class="small muted">${esc(programme.programme)}</div></td>
              <td>${fmtNumber(item.eligibleRecords)}</td>
              <td>${fmtNumber(item.highRelevance)}</td>
              <td>${fmtNumber(item.mediumRelevance)}</td>
              <td>${fmtNumber(item.generalForum)}</td>
              <td>${fmtNumber(item.schoolForum)}</td>
              <td>${badge(item.comparable ? "verified" : "manual-review", item.coverageLevel)}${item.generalForumOnly ? '<div class="micro muted">General-forum evidence only</div>' : ""}</td>
            </tr>`;
          }).join("")}</tbody>
        </table>
      </div>
    </section>

    <section class="panel">
      <h2>Methodology warnings</h2>
      <dl class="definition-list">
        <dt>Collection window</dt><dd>${esc(meta.collectionStart)} through ${esc(meta.collectionEnd)}. r/gradadmissions begins ${esc(meta.gradAdmissionsStart)}.</dd>
        <dt>Coverage Level</dt><dd>A sample-volume label based on eligible record count. It is not statistical confidence or source quality.</dd>
        <dt>High / Medium relevance</dt><dd>Automated and rule-based match tiers retained from the analysis pipeline; manual calibration is incomplete.</dd>
        <dt>Privacy</dt><dd>${esc(meta.privacy)}</dd>
        <dt>Use in ranking</dt><dd>None. Community evidence is excluded from Research-Oriented and Taught/Professional academic rankings.</dd>
      </dl>
    </section>
    ${footer(metadata)}
  </div>`;
}

export function bindCommunity() {
  document.getElementById("community-institution")?.addEventListener("change", (event) => {
    location.hash = routeHref("/community", { institution: event.target.value }).slice(1);
  });
}
