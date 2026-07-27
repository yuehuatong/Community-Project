# Coverage Panel Patch

## Problem

The current panel contains stale hard-coded claims:

- `passed-with-warnings`
- `16 records in the review queue`

The latest scoring JSON contains 60 records, 57 coverage-adjusted provisional ranks, and 3 programme-eligibility exclusions. The panel must derive its status from `program_scores.json`.

The long explanation of coverage thresholds should live on the Methodology page. This section should answer only:

1. What is available now?
2. What is still under review?
3. What can the user do?

## Replacement HTML

```html
<section class="ranking-status" aria-labelledby="ranking-status-title">
  <div class="ranking-status__copy">
    <p class="eyebrow">Provisional programme ranking</p>
    <h2 id="ranking-status-title">Provisional rankings are available</h2>
    <p id="ranking-status-summary">
      Loading the latest validation status...
    </p>
  </div>

  <dl class="ranking-status__metrics" aria-label="Current provisional ranking counts">
    <div>
      <dt>Provisional rankings</dt>
      <dd id="provisional-ranking-count">-</dd>
    </div>
    <div>
      <dt>Research routes</dt>
      <dd id="research-route-count">-</dd>
    </div>
    <div>
      <dt>Taught/professional routes</dt>
      <dd id="taught-route-count">-</dd>
    </div>
    <div>
      <dt>Eligibility exclusions</dt>
      <dd id="excluded-ranking-count">-</dd>
    </div>
  </dl>

  <div class="ranking-status__actions">
    <a class="button button--primary" href="./explore.html">
      Explore provisional rankings
    </a>
    <a class="button button--secondary" href="./methodology.html">
      Read methodology
    </a>
  </div>

  <p class="ranking-status__note">
    Coverage does not block a provisional rank. Evidence coverage, route confidence, and missing
    components must remain visible. Reddit remains a separate community evidence module.
  </p>
</section>
```

Adjust the two URLs to match the existing routes.

## Replacement JavaScript

Load `frontend_scoring_adapter.js` before this script:

```html
<script src="./frontend_scoring_adapter.js"></script>
<script>
  SusanScoring.load("./program_scores.json")
    .then(({ programs }) => {
      const total = programs.length;
      const ranked = programs.filter(
        (item) => item.rank !== null
      ).length;
      const research = programs.filter(
        (item) => item.track === "research" && item.rank !== null
      ).length;
      const taught = programs.filter(
        (item) => item.track === "taught" && item.rank !== null
      ).length;
      const excluded = total - ranked;

      document.getElementById("provisional-ranking-count").textContent =
        `${ranked}/${total}`;
      document.getElementById("research-route-count").textContent = research;
      document.getElementById("taught-route-count").textContent = taught;
      document.getElementById("excluded-ranking-count").textContent = excluded;

      const title = document.getElementById("ranking-status-title");
      const summary = document.getElementById("ranking-status-summary");

      if (ranked > 0) {
        title.textContent = "Provisional programme rankings are available";
        summary.textContent =
          `${ranked} programmes have coverage-adjusted provisional ranks. ` +
          "Coverage, route confidence, missing components, and warnings are shown with every result.";
      } else {
        title.textContent = "Programme rankings are being validated";
        summary.textContent =
          "No eligible provisional ranking records are currently available.";
      }
    })
    .catch(() => {
      document.getElementById("ranking-status-title").textContent =
        "Validation status is temporarily unavailable";
      document.getElementById("ranking-status-summary").textContent =
        "Verified programme data could not be loaded. Please try again later.";
    });
</script>
```

## Minimal CSS

```css
.ranking-status {
  max-width: 1180px;
  margin: 48px auto;
  padding: 32px;
  border: 1px solid #d7dde3;
  border-radius: 6px;
  background: #fff;
  color: #17212b;
}

.ranking-status__copy {
  max-width: 720px;
}

.ranking-status .eyebrow {
  margin: 0 0 8px;
  color: #53606c;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.ranking-status h2 {
  margin: 0 0 12px;
  font-size: clamp(1.75rem, 3vw, 2.4rem);
  line-height: 1.1;
}

.ranking-status__metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1px;
  margin: 28px 0;
  padding: 1px;
  background: #d7dde3;
}

.ranking-status__metrics div {
  padding: 18px;
  background: #fff;
}

.ranking-status__metrics dt {
  color: #53606c;
  font-size: 0.82rem;
}

.ranking-status__metrics dd {
  margin: 8px 0 0;
  font-size: 1.6rem;
  font-weight: 700;
}

.ranking-status__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.ranking-status__note {
  margin: 20px 0 0;
  color: #53606c;
  font-size: 0.88rem;
}

@media (max-width: 760px) {
  .ranking-status {
    margin: 28px 16px;
    padding: 24px;
  }

  .ranking-status__metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 460px) {
  .ranking-status__metrics {
    grid-template-columns: 1fr;
  }
}
```

## Acceptance Checks

- No status number is hard-coded.
- Current data displays `57/60` provisional rankings, `9` research rankings, `48` taught/professional rankings, and `3` exclusions.
- A null score or rank never displays as zero.
- The panel changes automatically after the JSON is replaced.
- Research and taught rankings remain separate.
- Every score and rank is visibly labelled provisional.
- Coverage, route confidence, warnings, and exclusions remain visible.
