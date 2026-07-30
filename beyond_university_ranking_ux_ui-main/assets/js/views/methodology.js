import { esc, footer, notice, setDocumentTitle } from "../utils.js";

function weightTable(title, rows) {
  return `<div class="table-wrap">
    <table class="data-table">
      <caption>${esc(title)}</caption>
      <thead><tr><th>Component</th><th>Weight</th></tr></thead>
      <tbody>${rows.map(([component, weight]) => `<tr><td>${esc(component)}</td><td>${weight}%</td></tr>`).join("")}</tbody>
    </table>
  </div>`;
}

export function renderMethodology(context) {
  setDocumentTitle("Methodology and data definitions");
  const { metadata, validation, community } = context.data;
  return `<div class="page page-narrow">
    <header class="page-header">
      <p class="eyebrow">Methodology and data definitions</p>
      <h1>How evidence becomes a transparent comparison.</h1>
      <p class="lede">The method separates institutional context from programme evidence, preserves uncertainty, and prevents incomplete records from looking artificially complete.</p>
    </header>

    <div class="method-layout">
      <div>
        <section class="panel" id="purpose">
          <h2>Purpose and scope</h2>
          <p>The synchronized sample contains 60 sustainability-related master’s programmes: 30 selected in QS Sustainability order and 30 highest-ranked nonduplicate additions from THE Impact, across ${metadata.countryCount} countries.</p>
          <p>QS and THE rankings answer institution-level questions. This explorer helps prospective students inspect programme-specific structure, admissions, research design, delivery, and evidence quality without claiming those institutional ranks directly measure a master’s programme.</p>
        </section>

        <section class="panel" id="sources">
          <h2>Source files feeding the interface</h2>
          <div class="source-list">
            <div class="source-row"><strong>Programme evidence</strong><span>${esc(metadata.sourceFiles.programmes)}</span><span class="small muted">60 synchronized records</span></div>
            <div class="source-row"><strong>Ranking histories</strong><span>${esc(metadata.sourceFiles.rankingHistories)}</span><span class="small muted">QS/THE sustainability and university series</span></div>
            <div class="source-row"><strong>Scoring snapshot</strong><span>${esc(metadata.sourceFiles.scoring)}</span><span class="small muted">Scoring status and calculated components</span></div>
            <div class="source-row"><strong>Community aggregates</strong><span>${metadata.sourceFiles.community.map(esc).join("<br>")}</span><span class="small muted">De-identified summaries only</span></div>
          </div>
          <p class="small muted" style="margin-top:14px">Historical 62-institution JSON snapshots are not used to populate the current interface.</p>
        </section>

        <section class="panel" id="identity">
          <h2>Stable identity and reproducibility</h2>
          <p>The offline build creates stable string identifiers from normalized institution and programme identity. Historical integer IDs are retained only as audit metadata and are never used to join the earlier 62-institution universe to the current sample.</p>
          <ul>
            <li>Programme and ranking workbooks are matched by normalized institution, programme, and country identity.</li>
            <li>Reddit institution summaries are reconciled by the same identity fields.</li>
            <li>The current build reports 0 duplicate identifiers, 0 ranking fallbacks, and 0 Reddit fallbacks.</li>
          </ul>
        </section>

        <section class="panel scoring-panel" id="scoring-release">
          <h2>Current scoring release</h2>
          <p><strong>${esc(metadata.scoring.publicLabel)}</strong></p>
          <p>The scoring snapshot is reconciled to stable institution-and-programme identities during the offline build. Its integer source IDs are retained for audit only and are not used as public identifiers or join keys.</p>
          <div class="key-facts">
            <div class="key-fact"><span class="fact-label">Method version</span><strong>${esc(metadata.scoring.methodVersion)}</strong></div>
            <div class="key-fact"><span class="fact-label">Matched programmes</span><strong>${metadata.scoring.matchedProgrammes}/${metadata.scoring.programmes}</strong></div>
            <div class="key-fact"><span class="fact-label">Institution Strength available</span><strong>${metadata.scoring.institutionStrengthAvailable}</strong></div>
            <div class="key-fact"><span class="fact-label">Provisional routes</span><strong>${metadata.scoring.provisionalRoutes}/${metadata.scoring.programmes}</strong></div>
            <div class="key-fact"><span class="fact-label">Provisional ranks</span><strong>${metadata.scoring.provisionalRanked}/${metadata.scoring.programmes}</strong></div>
            <div class="key-fact"><span class="fact-label">Eligibility exclusions</span><strong>${metadata.scoring.provisionalExcluded}</strong></div>
            <div class="key-fact"><span class="fact-label">Research rankings</span><strong>${metadata.scoring.researchProvisionalRanked}</strong></div>
            <div class="key-fact"><span class="fact-label">Taught / Professional rankings</span><strong>${metadata.scoring.taughtProvisionalRanked}</strong></div>
            <div class="key-fact"><span class="fact-label">Strict final results</span><strong>${metadata.scoring.ordinalRanksPublished}</strong></div>
          </div>
          ${notice("warning", "What is published now", `${metadata.scoring.provisionalRanked} eligible programmes have coverage-adjusted provisional scores and within-track ranks under approved method 1.1. Route confidence, scored-weight coverage, missing components, and warnings remain visible with every result. Strict validated final scores and ranks are separate and remain unpublished.`, "!")}
        </section>

        <section class="panel" id="rank-normalization">
          <h2>Institution ranking normalization</h2>
          <p>For an exact published rank from 1 to 200:</p>
          <p><code>RankScore = 100 × (201 − Rank) ÷ 200</code></p>
          <p>A published band uses its midpoint. Values beyond 200 display as <strong>200+</strong> and receive a RankScore of 0 without revealing an exact value. Explicit <strong>NR</strong> in a complete table receives 0. <strong>N/P</strong> and not-collected states remain missing.</p>
          <p>For each series:</p>
          <p><code>SeriesScore = 0.60 × latest available score + 0.40 × median of earlier available scores</code></p>
          ${notice("info", "Institution Strength only", "The four series each contribute 7.5% to the documented 30% Institution Strength component. The result is not a direct programme rank.", "i")}
        </section>

        <section class="panel" id="tracks">
          <h2>Separate ranking tracks</h2>
          <p>Research-oriented and Taught/Professional programmes are never mixed into one ordered list. Method 1.1 currently uses a rule-based provisional route with a visible confidence label and evidence basis. Manual confirmation remains required for the future strict validated release.</p>
          <div class="content-grid">
            ${weightTable("Research-Oriented Program Index", [
              ["Institution Strength", 30],
              ["Research Environment", 25],
              ["Programme Research Design", 15],
              ["Entry Requirement Selectivity", 10],
              ["English Requirement", 10],
              ["Sustainability Engagement", 10],
            ])}
            ${weightTable("Taught / Professional Program Index", [
              ["Institution Strength", 30],
              ["Curriculum and Professional Relevance", 20],
              ["Experiential Learning", 15],
              ["Entry Requirement Selectivity", 10],
              ["English Requirement", 10],
              ["Delivery and Duration Flexibility", 5],
              ["Career Outcome Evidence", 5],
              ["Sustainability Engagement", 5],
            ])}
          </div>
          <p class="small muted">${metadata.scoring.researchProvisionalRanked} eligible programmes appear in the provisional Research-oriented ranking and ${metadata.scoring.taughtProvisionalRanked} in the provisional Taught / Professional ranking. Missing component scores display as Data pending and are never converted to zero.</p>
        </section>

        <section class="panel" id="coverage">
          <h2>Provisional scoring, missing data, and coverage</h2>
          <div class="content-grid coverage-definitions">
            <div class="content-block">
              <h3>Evidence availability</h3>
              <p>Whether source evidence is available and sufficiently reliable to enter manual component scoring. Evidence may be available before a component score has been completed.</p>
            </div>
            <div class="content-block">
              <h3>Scored-weight coverage</h3>
              <p>The percentage of the documented 100% ranking method represented by calculated component scores. Current coverage ranges from partial Institution Strength alone to records with additional scored evidence.</p>
            </div>
          </div>
          <h3>Approved provisional treatment in method 1.1</h3>
          <p>Coverage does not block an eligible programme from receiving a provisional score or within-track rank. Missing components remain explicitly pending. The method calculates an observed score from available weight, then applies neutral shrinkage for the unscored weight:</p>
          <p><code>ObservedScore = Σ(AvailableWeight × ComponentScore) ÷ Σ(AvailableWeight)</code></p>
          <p><code>ProvisionalScore = Coverage × ObservedScore + (1 − Coverage) × 50</code></p>
          ${notice("warning", "How to interpret low coverage", "The neutral value is a missing-data treatment, not an observed programme result. At low coverage, Institution Strength and neutral shrinkage have a large influence, so coverage, route confidence, missing components, and warnings must be read alongside rank.", "!")}
          <h3>Strict validated publication gates</h3>
          <p>The following thresholds are retained for a future strict validated release. They do not block method 1.1 provisional inclusion:</p>
          <div class="table-wrap">
            <table class="data-table">
              <thead><tr><th>Coverage</th><th>Label</th><th>Public treatment</th></tr></thead>
              <tbody>
                <tr><td>At least 85%</td><td>High confidence</td><td>Eligible for a strict validated rank after all other gates pass</td></tr>
                <tr><td>70–84.9%</td><td>Medium confidence</td><td>Eligible for strict publication with a confidence label after all other gates pass</td></tr>
                <tr><td>55–69.9%</td><td>Provisional</td><td>Strict score may be shown without ordinal rank after all other gates pass</td></tr>
                <tr><td>Below 55%</td><td>Insufficient evidence</td><td>No strict public score</td></tr>
              </tbody>
            </table>
          </div>
          <p class="small muted">Where multiple records share a provisional rank group, the interface labels the rank as shared and retains the group size supplied by the approved scoring snapshot.</p>
          ${notice("info", "Strict release state", `Strict eligibility: ${metadata.scoring.strictEligible}/${metadata.scoring.programmes}. Strict final scores: ${metadata.scoring.finalScoresPublished}. Strict ordinal ranks: ${metadata.scoring.ordinalRanksPublished}.`, "i")}
        </section>

        <section class="panel" id="definitions">
          <h2>Data-state definitions</h2>
          <dl class="definition-list">
            <dt>Verified</dt><dd>A current official source directly supports the displayed value.</dd>
            <dt>Manual review required</dt><dd>Evidence exists, but the value, scope, or programme identity remains ambiguous.</dd>
            <dt>Unverified</dt><dd>Programme validity or graduate-programme eligibility has not been established.</dd>
            <dt>Not stated</dt><dd>The reviewed source did not state a usable value.</dd>
            <dt>Not applicable</dt><dd>The field does not apply to this record.</dd>
            <dt>Not ranked (NR)</dt><dd>The institution was absent from a collected complete official table.</dd>
            <dt>Ranking not published (N/P)</dt><dd>The edition did not exist and remains missing, not zero.</dd>
            <dt>Not collected</dt><dd>A usable source value was not captured, collection was blocked, or a quota was reached.</dd>
            <dt>Insufficient evidence</dt><dd>Coverage falls below the documented public-scoring threshold.</dd>
          </dl>
        </section>

        <section class="panel" id="thesis">
          <h2>Thesis availability rule</h2>
          <p>For this project, a thesis option is coded <strong>No</strong> unless an explicit thesis option was found in the reviewed source. The normalized sample contains ${metadata.thesisCounts.Yes} Yes and ${metadata.thesisCounts.No} No records.</p>
          <p class="small muted">Thesis Yes alone does not make a programme Research-oriented. An optional dissertation may exist inside a mainly taught degree.</p>
        </section>

        <section class="panel" id="community">
          <h2>Reddit and community methodology</h2>
          <p>Community evidence uses aggregate, de-identified outputs from institution-associated Reddit discussions. The observation window is ${esc(community.metadata.collectionStart)} to ${esc(community.metadata.collectionEnd)}; r/gradadmissions begins ${esc(community.metadata.gradAdmissionsStart)}.</p>
          <ul>
            <li>Headline tone uses VADER 3.3.2 on post titles.</li>
            <li>Primary topic, admissions outcome, and concern signals are separate classifications.</li>
            <li>Coverage Level is a sample-volume label, not statistical confidence.</li>
            <li>Manual sentiment calibration is not complete.</li>
            <li>Reddit never enters an academic-quality ranking.</li>
            <li>No usernames, author IDs, post IDs, raw titles, excerpts, or direct post URLs are published.</li>
          </ul>
          ${notice("warning", "Monthly source break", community.metadata.trendWarning, "!")}
        </section>

        <section class="panel" id="limitations">
          <h2>Known cautions and release blockers</h2>
          <ul>
            <li>University of Alberta, McMaster University, and Kyung Hee University are excluded from the provisional ranking for programme-eligibility reasons.</li>
            <li>Historical JSON files use an earlier 62-institution universe and cannot be joined by integer ID.</li>
            <li>${validation.normalizationReview.durationManualReview} duration fields and ${validation.normalizationReview.studyModeManualReview} study-mode fields show extraction spillover or require manual review.</li>
            <li>English-language requirement text was not captured for ${validation.normalizationReview.englishRequirementNotCollected} programmes.</li>
            <li>OpenAlex coverage is incomplete: collection gaps are not converted to zero output.</li>
            <li>Placement and class-size evidence are too sparse for a global filter.</li>
            <li>All 60 current routes are rule-based provisional; ${metadata.scoring.routeConfidenceCounts.low} carry low route confidence.</li>
            <li>Low evidence coverage does not block a method 1.1 provisional rank, so current order is sensitive to neutral shrinkage and Institution Strength.</li>
            <li>Strict validated final scores and ordinal ranks remain unpublished.</li>
            <li>Reddit is exploratory community evidence, not programme-quality evidence.</li>
          </ul>
        </section>

        <section class="panel" id="validation">
          <h2>Current data validation</h2>
          <div class="key-facts">
            <div class="key-fact"><span class="fact-label">Programmes</span><strong>${validation.recordCounts.programmes}</strong></div>
            <div class="key-fact"><span class="fact-label">Duplicate identifiers</span><strong>${validation.duplicateIdentifiers.length}</strong></div>
            <div class="key-fact"><span class="fact-label">Missing required fields</span><strong>${validation.missingRequiredFields.length}</strong></div>
            <div class="key-fact"><span class="fact-label">Unmatched Reddit rows</span><strong>${validation.redditAggregateReconciliation.unmatchedInstitutions.length}</strong></div>
            <div class="key-fact"><span class="fact-label">Scoring records matched</span><strong>${validation.scoringReconciliation.matchedProgrammes}</strong></div>
            <div class="key-fact"><span class="fact-label">Unmatched scoring rows</span><strong>${validation.scoringReconciliation.unmatchedScoreRecords.length}</strong></div>
            <div class="key-fact"><span class="fact-label">Provisional ranks</span><strong>${validation.scoringReconciliation.provisionalRanked}</strong></div>
            <div class="key-fact"><span class="fact-label">Eligibility exclusions</span><strong>${validation.scoringReconciliation.provisionalExcluded}</strong></div>
            <div class="key-fact"><span class="fact-label">Rank-group mismatches</span><strong>${validation.scoringReconciliation.rankGroupMismatches.length}</strong></div>
            <div class="key-fact"><span class="fact-label">Publication integrity issues</span><strong>${validation.scoringReconciliation.publicationIntegrityIssues.length}</strong></div>
          </div>
          <p class="small muted" style="margin-top:14px">Build status: ${validation.status === "passed-with-warnings" ? "Completed with review warnings" : esc(validation.status)}. Warnings remain visible because they require evidence review, not because the build failed.</p>
        </section>
      </div>

      <nav class="method-nav" aria-label="Methodology sections">
        <strong>On this page</strong>
        <a href="#purpose" data-section-link="purpose">Purpose and scope</a>
        <a href="#sources" data-section-link="sources">Source files</a>
        <a href="#identity" data-section-link="identity">Stable identity</a>
        <a href="#scoring-release" data-section-link="scoring-release">Scoring release</a>
        <a href="#rank-normalization" data-section-link="rank-normalization">Rank normalization</a>
        <a href="#tracks" data-section-link="tracks">Ranking tracks</a>
        <a href="#coverage" data-section-link="coverage">Provisional and strict coverage</a>
        <a href="#definitions" data-section-link="definitions">Data states</a>
        <a href="#thesis" data-section-link="thesis">Thesis rule</a>
        <a href="#community" data-section-link="community">Community method</a>
        <a href="#limitations" data-section-link="limitations">Known cautions</a>
        <a href="#validation" data-section-link="validation">Validation</a>
      </nav>
    </div>
    ${footer(metadata)}
  </div>`;
}

export function bindMethodology() {
  document.querySelectorAll("[data-section-link]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      document.getElementById(link.dataset.sectionLink)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}
