# Frontend Scoring Handoff

This package is the stable interface between the programme-scoring work and the HTML website.

## Files

- `program_scores.json`: latest generated data; replace this file after every scoring-pipeline update.
- `frontend_scoring_adapter.js`: small framework-free helper for loading and presenting the JSON safely.

Do not use the Excel workbooks directly in the website.

## Add to the Existing HTML

```html
<script src="./frontend_scoring_adapter.js"></script>
<script>
  SusanScoring.load("./program_scores.json").then(({ meta, programs }) => {
    console.log(meta);
    console.table(programs);
    // Connect `programs` to the existing cards/table.
  });
</script>
```

Each item returned in `programs` has display-ready fields:

```js
{
  id,
  institution,
  country,
  program,
  track,                    // provisional research or taught route
  routeClassificationStatus,
  routeClassificationConfidence,
  statusLabel,
  statusTone,               // success, warning, danger, or neutral
  scoreText,                // provisional score or "Not ranked"
  rankText,                 // "#4" or "-"
  coverageText,             // e.g. "30%"
  confidence,
  institutionStrengthText,
  components,
  warnings,
  sources
}
```

## Required Display Rules

1. Treat `publicStatus` from the JSON as authoritative.
2. Use adapter fields `score`, `rank`, `scoreText`, and `rankText` for the current provisional ranking.
3. Label every displayed result `Provisional project ranking`.
4. Display a missing component as `Data pending`, never `0`.
5. Keep Research-oriented and Taught/Professional rankings in separate tabs.
6. Show route classification status/confidence because most current routes are rule-based provisional.
7. Show `coverage`, evidence confidence, warnings, and source links with every score.
8. Label the page `Provisional project ranking - not an official QS or THE ranking`.
9. Do not include Reddit sentiment in the academic score.
10. Never publish illustrative or realistic-looking placeholder scores.
11. Records with `rank === null` are excluded for programme-eligibility reasons; show `exclusionReasons`.
12. Do not display the strict `finalScore` or `strictRank` fields until the validated release is completed.

## Current Snapshot

The current file contains 60 programmes:

- 57 programmes have coverage-adjusted provisional scores and within-track ranks.
- 9 records are provisionally classified as research; 48 ranked records are taught/professional.
- IDs 61, 66, and 73 are excluded because programme eligibility is unresolved or invalid.
- Strict validated final scores and ranks remain empty.

Coverage no longer blocks a provisional rank. Most current records have limited evidence coverage, so the coverage and warning labels must remain visible.

## Required Page Note

> These are coverage-adjusted provisional rankings based on currently verified evidence. Low coverage does not prevent inclusion, but coverage, route confidence, and missing components are shown with every result. These are not official QS or THE programme rankings.
