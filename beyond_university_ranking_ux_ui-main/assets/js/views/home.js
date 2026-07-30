import { esc, footer, routeHref } from "../utils.js";

export function renderHome(context) {
  const { metadata } = context.data;
  const scoring = metadata.scoring;
  return `<div class="page">
    <section class="home-hero">
      <div class="home-hero-copy">
        <p class="eyebrow">Programme evidence, not reputation alone</p>
        <h1>A university rank is not the same thing as programme quality.</h1>
        <p class="lede">
          Beyond University Rankings brings programme structure, admissions evidence,
          institutional sustainability context, and community coverage into one transparent
          explorer. Approved method 1.1 publishes coverage-adjusted provisional results while
          keeping strict final scores and ranks visibly separate.
        </p>
        <div class="hero-actions">
          <a class="button" href="${routeHref("/explore")}">Explore 60 programmes</a>
          <a class="button secondary" href="${routeHref("/compare")}">Compare programmes</a>
          <a class="button ghost" href="${routeHref("/rankings/research")}">View provisional rankings</a>
        </div>
      </div>
      <div class="hero-evidence" aria-label="Dataset summary">
        <div class="evidence-stat"><strong>${metadata.programmeCount}</strong><span>sustainability-related master’s programmes</span></div>
        <div class="evidence-stat"><strong>${metadata.countryCount}</strong><span>countries in a point-in-time global sample</span></div>
        <div class="evidence-stat"><strong>30 + 30</strong><span>QS-selected and nonduplicate THE-selected cohorts</span></div>
      </div>
    </section>

    <section class="trust-strip" aria-label="Evidence principles">
      <div class="trust-item"><strong>Context stays in context</strong><span class="small muted">QS and THE histories describe institutions, not individual master’s programmes.</span></div>
      <div class="trust-item"><strong>Missing is not observed performance</strong><span class="small muted">Pending components remain explicit; neutral shrinkage supports the provisional model without turning missing evidence into an observed score.</span></div>
      <div class="trust-item"><strong>Sources remain visible</strong><span class="small muted">Programme pages link back to official evidence and preserve review warnings.</span></div>
    </section>

    <section class="section panel scoring-panel ranking-status" aria-labelledby="ranking-development-title">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Approved provisional method · ${esc(scoring.methodVersion)}</p>
          <h2 id="ranking-development-title">Provisional programme rankings are available</h2>
          <p class="muted">${esc(scoring.publicLabel)}. Coverage, route confidence, missing components, and eligibility exclusions remain visible with every result.</p>
        </div>
        <div class="ranking-status-actions">
          <a href="${routeHref("/rankings/research")}" class="button">Explore provisional rankings</a>
          <a href="${routeHref("/methodology")}" class="button ghost">Read methodology</a>
        </div>
      </div>
      <div class="key-facts">
        <div class="key-fact"><span class="fact-label">Provisional rankings</span><strong>${scoring.provisionalRanked}/${scoring.programmes}</strong><span class="small muted">Coverage-adjusted method 1.1</span></div>
        <div class="key-fact"><span class="fact-label">Research route</span><strong>${scoring.researchProvisionalRanked}</strong><span class="small muted">Separate within-track order</span></div>
        <div class="key-fact"><span class="fact-label">Taught / Professional</span><strong>${scoring.taughtProvisionalRanked}</strong><span class="small muted">Separate within-track order</span></div>
        <div class="key-fact"><span class="fact-label">Eligibility exclusions</span><strong>${scoring.provisionalExcluded}</strong><span class="small muted">No score or rank displayed</span></div>
      </div>
      <p class="ranking-status-note">Low evidence coverage does not block inclusion in the approved provisional model. Strict final programme scores and strict ordinal ranks remain unpublished.</p>
    </section>

    <section class="section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Two different study goals</p>
          <h2>Research and professional routes should not share one league table.</h2>
          <p class="muted">Method 1.1 keeps separate component weights and separate within-track rankings. Current routes are rule-based provisional classifications, with confidence and basis shown in the interface.</p>
        </div>
      </div>
      <div class="route-grid">
        <article class="route-card">
          <p class="eyebrow">Research-oriented route</p>
          <h3>For independent research and doctoral preparation</h3>
          <ul>
            <li>Research environment and verified OpenAlex evidence</li>
            <li>Required thesis or substantial original research design</li>
            <li>Supervisor, laboratory, methods, and fieldwork evidence</li>
          </ul>
          <a class="button secondary" href="${routeHref("/rankings/research")}">Research provisional ranking</a>
        </article>
        <article class="route-card">
          <p class="eyebrow">Taught / Professional route</p>
          <h3>For applied learning and professional practice</h3>
          <ul>
            <li>Curriculum and professional relevance</li>
            <li>Capstones, internships, consulting, and fieldwork</li>
            <li>Delivery flexibility and programme-specific career evidence</li>
          </ul>
          <a class="button secondary" href="${routeHref("/rankings/taught")}">Professional provisional ranking</a>
        </article>
      </div>
    </section>

    ${footer(metadata)}
  </div>`;
}
