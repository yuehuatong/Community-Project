# Programme Scoring Pipeline

**Method version:** `1.1-provisional-ranking`  
**Status:** Provisional rankings may be published at any coverage when prominently labelled; strict final rankings remain validation-gated.

## Purpose

This pipeline converts the documented custom-ranking methodology into a repeatable process:

1. Read the synchronized 60-program source workbook.
2. Read the five-year QS/THE ranking workbook.
3. Preserve and validate manually normalized programme inputs.
4. Calculate institution, AASHE, UN PRME, and OpenAlex evidence where the source and scope are valid.
5. Apply neutral missing-data adjustment and evidence-confidence labels.
6. Infer a provisional route when a manual route has not yet been verified.
7. Publish coverage-independent provisional rankings while retaining strict final fields separately.

Reddit is excluded from the academic score and remains a separate community evidence module.

## Run

Use the bundled Node.js runtime and dependency directory already configured for this workspace:

```powershell
& "C:\Users\gzh_l\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" ".\build_program_scoring_pipeline.mjs"
```

The first run creates:

- `outputs/program_scoring_pipeline/program_scoring_manual_inputs.xlsx`
- `outputs/program_scoring_pipeline/program_scoring_results.xlsx`
- `outputs/program_scoring_pipeline/program_scores.json`
- `outputs/program_scoring_pipeline/program_scoring_status.csv`
- `outputs/program_scoring_pipeline/pipeline_audit_report.json`

Edit only `program_scoring_manual_inputs.xlsx`, then rerun the script. Existing manual values are preserved by programme ID.

The pipeline calculates and audits `Institution Strength` from the four five-year ranking series. Eligible records receive a `publishedScore` and `publishedRank` regardless of coverage. Low coverage is displayed as limited evidence, not used to suppress the provisional ranking.

## Required Manual Workflow

Complete the 60 rows in this order:

1. Confirm that the record is a current graduate programme.
2. Classify the route as `research` or `taught`.
3. Set `Route Classification Verified` to `yes`.
4. Check that duration, mode, requirements, and curriculum text are not extraction spillover from another section.
5. Set `Source Spillover Reviewed` to `yes`.
6. Record official source URLs.
7. Enter only normalized 0-100 rubric scores supported by those sources.
8. Mark AASHE and UN PRME scope as applicable only after campus or school scope is confirmed.
9. Keep simulated values marked as illustrative; they never count.

IDs 61 and 73 begin as blocked. Clear a critical override only after replacing the invalid evidence with an official current graduate-program source.

## Provisional Publication

| Evidence coverage | Label | Public treatment |
| --- | --- | --- |
| At least 85% | High | Publish provisional score and rank |
| 70-84.9% | Medium | Publish provisional score and rank |
| 55-69.9% | Low | Publish provisional score and rank with warning |
| Below 55% | Limited | Publish provisional score and rank with prominent limited-evidence warning |

Coverage does not block the provisional order. Critical programme-eligibility issues still exclude a record. IDs 61 and 73 remain excluded, and ID 66 remains excluded because no qualifying programme is confirmed.

The pipeline keeps the original strict `finalScore` and `rank` fields for a later validated release. Those strict fields still require the manual route, spillover review, source confirmation, and coverage threshold.

## Missing Data

Missing, blocked, uncollected, and not-published values remain missing. Explicit `NR` and verified `200+` ranking states score zero because they describe an observed ranking outcome.

For available scoring evidence:

```text
ObservedScore = Sum(AvailableWeight * Score) / Sum(AvailableWeight)
Coverage = Sum(AvailableWeight) / 100
FinalScore = Coverage * ObservedScore + (1 - Coverage) * 50
```

This shrinks incomplete records toward a neutral score of 50 without converting unknown evidence into a negative claim.

## Website Contract

Use these fields from `program_scores.json`:

- Display `publishedScore` and `publishedRank` for the current provisional ranking.
- Use `track` for the provisional Research and Taught/Professional tabs.
- Display `routeClassificationStatus` and `routeClassificationConfidence`.
- Keep the Research-oriented and Taught/Professional tables separate.
- Display coverage, confidence, component breakdown, warnings, and source links.
- Label every result `Provisional project ranking - not an official QS or THE ranking`.
- When `publishedRank` is null, display the `exclusionReasons` instead of a score.
- Do not label `finalScore` or `rank` as available; these are reserved for the future strict release.

## Remaining Work

The pipeline solves the missing implementation layer, but it does not manufacture evidence. Publication still depends on:

- Manual route classification for all programmes.
- Corrected Alberta and Kyung Hee graduate-program records, or continued exclusion.
- Review of extraction spillover.
- Manual normalization of English thresholds.
- Completion of OpenAlex collection and relevance review.
- Programme-specific entry, curriculum, experiential, and career evidence.
- Separate calibration of Reddit sentiment before the community module is released.
