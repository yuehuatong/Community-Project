# Beyond University Rankings

Transparent, student-centered data collection for comparing global sustainability-related master's programs.

This repository supports the BUSA 649 community project described in [Project_Proposal.pdf](proposal/Project_Proposal.pdf). The sustainability ranking cutoffs originally produced 97 source candidates. Manual review excluded ID 75, Al-Ahliyya Amman University, and the current analysis sample retains 60 programs: 30 selected from the QS ranking and 30 highest-ranked nonduplicate additions from the THE ranking.

## Project purpose

University rankings describe institutions, not the day-to-day experience or outcomes of a specific master's program. This project links institutional sustainability evidence and overall school rankings to one sustainability-related master's route at each selected university, while preserving official source URLs for manual validation.

## Current files

| Path | Description | Status |
| --- | --- | --- |
| `proposal/Project_Proposal.pdf` | Original project proposal and planned analysis framework | Reference |
| `outputs/program_source_data_top60_qs30_the30.xlsx` | Synchronized 60-program source workbook with QS/THE selection, program details, AASHE, UN PRME, OpenAlex, source URLs, and audit fields | Current |
| `outputs/qs_the_5_year_sustainability_and_school_rankings_60_programs.xlsx` | Five-year sustainability and overall school ranking histories aligned to the same 60 programs | Current |
| `outputs/reddit_top60_program_matches.xlsx` | Candidate Reddit post matches for the 60 programs, with authors excluded and relevance tiers retained for manual review | Temporary working version |
| `docs/HTML_DESIGN_GUIDE.md` | Website structure, filters, missing-data rules, warning states, and Reddit component handoff | Current design handoff |
| `docs/CUSTOM_RANKING_METHODOLOGY.md` | Separate Research-oriented and Taught/Professional project ranking methods | Draft methodology |
| `docs/MANUAL_VERIFICATION_GUIDE.md` | Checklist for reviewing official program websites | Reference |
| `data/README.md` | Provenance and limitations for collected source files | Reference |

Workbooks referring to 62, 96, or 97 programs are superseded working snapshots and should not be combined with the current 60-program files without rematching institution IDs.

## Ranking coverage

- The 60-program sample uses one synchronized program universe across the source and ranking workbooks.
- Sustainability rankings cover QS Sustainability and THE Impact / Sustainability Impact editions available in the five-year collection window.
- School rankings cover the corresponding QS and THE World University Rankings.
- Published overall school ranks after 200 are intentionally reported as `200+`.
- `NR` means not ranked in a complete published table; `N/P` means the edition was not published.

## Institutional and program evidence

The source workbook preserves program-level fields for tuition and fees, duration, delivery mode, language requirements, curriculum focus, internship or fieldwork, capstone or project, thesis options, class size, placement evidence, and official URLs. It also contains institution-level AASHE STARS, UN PRME, and OpenAlex evidence where a reliable match was available.

Missing information is normally retained as missing or explicitly audited rather than estimated. One project-specific exception is the website thesis field: a thesis option is coded `No` unless an explicit thesis option was found. Pages with user notes may use clearly labeled illustrative values for prototype layout only; those values must be excluded from filters, charts, aggregates, comparisons, and project ranking scores.

## Reddit working data

The temporary Reddit workbook was generated from user-downloaded Arctic Shift post archives. It scanned 84,246 posts and retained 4,985 unique candidate posts, producing 5,940 institution-post match records across 53 of the 60 selected institutions.

- `r/gradadmissions` covers 2025-07-01 through 2026-06-29.
- `r/GradSchool`, `r/sustainability`, and `r/sustainableFinance` cover 2024-07-01 through 2026-06-29.
- `r/EnvironmentalScience` is intentionally excluded from the current collection because no usable posts were available; it is not treated as a zero-observation source.
- School-specific subreddit archives for the first 15 institutions are a planned manual extension and are not included in this temporary workbook.
- Reddit usernames and author IDs are excluded.
- High, Medium, and Low relevance tiers are retained for manual screening; matches are candidate evidence, not confirmed program reviews.

## Ranking interpretation

The ranking workbook separates two concepts:

1. **Sustainability rankings** describe the institution's sustainability performance.
2. **School rankings** describe the institution's overall QS and THE position.

Neither is a direct ranking of the selected master's program.

The proposed project ranking adds a transparent, subjective comparison layer and must be labeled as a project method rather than an official QS or THE ranking. Research-oriented and Taught/Professional programs are evaluated separately. Scores must display component weights, data coverage, confidence, and source links. Illustrative or eligibility-unverified records do not participate.

## Primary sources

- [QS Sustainability Rankings](https://www.topuniversities.com/sustainability-rankings)
- [THE Impact Rankings](https://www.timeshighereducation.com/impactrankings)
- [QS World University Rankings](https://www.topuniversities.com/world-university-rankings)
- [THE World University Rankings](https://www.timeshighereducation.com/world-university-rankings/latest/world-ranking)
- [AASHE STARS participants and reports](https://reports.aashe.org/institutions/participants-and-reports/)
- [UN Principles for Responsible Management Education](https://www.unprme.org/search/)
- [OpenAlex](https://openalex.org/)
- [Arctic Shift Reddit download tool](https://arctic-shift.photon-reddit.com/download-tool)
- [SUSANhub](https://susanhub.com/)

## Suggested workflow

1. Start with the synchronized 60-program source workbook.
2. Open each official program URL and verify curriculum, duration, delivery mode, tuition, experiential learning, career evidence, and the verification date.
3. Normalize program type, admissions requirements, and English thresholds before calculating the project ranking.
4. Use the ranking history workbook as institutional context and follow the documented project methodology for subjective scores.
5. Manually screen Reddit matches, beginning with the High relevance tier.
6. Preserve `NR`, `N/P`, missing, not-collected, and illustrative states as distinct values.
7. Refresh time-sensitive values before final analysis or publication.

The data were collected in July 2026 and represent a point-in-time research snapshot. Source organizations retain ownership of their published content.
