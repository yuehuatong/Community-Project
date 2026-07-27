# HTML Revision Request

Please use the new `program_scores.json` and `frontend_scoring_adapter.js`.

## What Changed

- Coverage no longer blocks a provisional programme rank.
- 57 eligible programmes now have a published provisional score and within-track rank.
- The provisional split is 9 Research and 48 Taught/Professional ranked programmes.
- IDs 61, 66, and 73 remain excluded for programme-eligibility reasons.
- Strict validated final scores/ranks remain separate and empty.

## Required HTML Changes

1. Replace the old JSON and adapter files.
2. Build the two ranking tabs from adapter field `track`.
3. Sort each tab by numeric adapter field `rank`.
4. Display adapter fields `rankText` and `scoreText`.
5. Display `coverageText`, `routeClassificationConfidence`, `statusLabel`, and warnings on every result.
6. Use `Data pending` for a missing component; never convert it to zero.
7. When `rank === null`, show `exclusionReasons` and do not display a score.
8. Add this label above both tables:

   `Provisional project ranking - not an official QS or THE ranking`

9. Add this note below the label:

   `Low evidence coverage does not prevent inclusion. Coverage, route confidence, and missing components are shown with every result.`

10. Keep Reddit outside the academic score.

## Minimal Rendering Example

```js
SusanScoring.load("./program_scores.json").then(({ programs }) => {
  const research = SusanScoring
    .forTrack(programs, "research")
    .filter((item) => item.rank !== null)
    .sort((a, b) => a.rank - b.rank || a.institution.localeCompare(b.institution));

  const taught = SusanScoring
    .forTrack(programs, "taught")
    .filter((item) => item.rank !== null)
    .sort((a, b) => a.rank - b.rank || a.institution.localeCompare(b.institution));

  console.table(research);
  console.table(taught);
});
```

Do not use `finalScore` or `strictRank` for the current page. Those fields are reserved for a future fully validated release.
