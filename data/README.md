# Data Dictionary and Provenance

All files in `data/processed` are UTF-8 JSON research snapshots. Source URLs are retained wherever available so records can be audited and refreshed.

## File inventory

### `programs_62.json`

An array of 62 selected institutions and candidate programs.

Key fields:

- `id`: Stable project row number.
- `institution`, `country`: Institution identity and location.
- `candidate_source`: Whether the institution came from QS, THE, or their overlap.
- `current_qs_rank`, `current_the_rank`: Ranking value used when the original candidate list was assembled.
- `qs_url`, `the_url`: Official publisher profile URLs.
- `program_name`, `official_program_url`: Candidate program and its school website.

### `aashe_stars_records.json`

414 records collected from the public AASHE STARS participant/report directory.

Key fields include institution `name`, `location`, `rating`, `score`, `validThrough`, `profileUrl`, and `reportUrl`.

### `unprme_signatories.json`

858 UNPRME signatory records. Fields include signatory ID, title, organization URL, creation date, status, location, and country.

### `unprme_sip_reports.json`

3,830 UNPRME Sharing Information on Progress report records. Fields include report ID, owner institution, upload date, and report/file URLs.

### `unprme_sip_reports_for_selected_institutions.json`

The subset of SIP records matched to selected institutions. The top-level keys are project institution names; values contain matched reports and audit information.

### `openalex_institution_signals.json`

OpenAlex matches and research indicators for all 62 selected institutions.

Important fields include:

- `searchName`, `searchUrl`: Query provenance.
- `matched.id`, `displayName`, `ror`, `countryCode`: Matched institution identity.
- `worksCount`, `citedByCount`, `hIndex`: Institution-level OpenAlex indicators.
- `sustainabilityWorks`, `top25Citations`, `topWork1`: Project-specific sustainability search signals.
- `worksUrl`: Reproducible OpenAlex works query.

The sustainability works query used a five-year publication window ending in July 2026 and keywords related to sustainability, climate, environment, ESG, and sustainable development. It is a search signal, not a complete bibliometric evaluation.

### `qs_the_university_ranking_history.json`

Matched institution-level ranking histories for 62 institutions:

- QS World University Rankings: 2023-2027.
- THE World University Rankings: 2022-2026.

The `quality` object reports matching completeness. Each row retains publisher names, profile URLs, ranking-page URLs, ranks, and available scores.

### `qs_the_subject_ranking_proxies.json`

Program-related subject-ranking histories for 62 programs, using the closest available QS and THE subject category from 2022-2026.

Key fields:

- `qs_subject`, `the_subject`: Assigned proxy categories.
- `category_reason`: Human-readable mapping rationale.
- `qs`, `the`: Year-keyed rank, score, source, profile, and status records.
- `quality`: Counts and explicit unmatched/non-ranked records.

These are subject-level proxies and must not be presented as direct rankings of individual master's programs.

## Collection dates

- AASHE STARS, UNPRME, and OpenAlex snapshots: July 12, 2026.
- QS and THE ranking snapshots: July 17, 2026.

## Missing values

- `null` or an empty field means the source did not provide a usable value.
- `NR` in the Excel outputs means not ranked or not found within the stated collection coverage.
- Missing values were not imputed.

## Attribution and reuse

The files combine transformed records from third-party sources. AASHE, UNPRME, QS, and THE retain rights in their published materials. OpenAlex data are provided under its published reuse terms. Review the current terms and citation guidance of each source before redistribution.

