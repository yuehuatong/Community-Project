# Beyond University Rankings

Transparent, student-centered data collection for comparing global sustainability-related master's programs.

This repository supports the BUSA 649 community project described in [Project_Proposal.pdf](proposal/Project_Proposal.pdf). It brings together program links, institutional sustainability signals, research indicators, and five-year QS/THE ranking histories for 62 selected institutions.

## Project purpose

Traditional university rankings describe institutions, not the day-to-day student experience of a specific master's program. This project prepares a transparent evidence base for a later program-level comparison using curriculum relevance, affordability, experiential learning, institutional sustainability, research, careers, and student sentiment.

The repository contains collected source data and working Excel files. Program facts should be manually verified against official school websites before final analysis or publication.

## Repository contents

| Path | Description |
| --- | --- |
| `proposal/Project_Proposal.pdf` | Original project proposal and planned ranking framework |
| `data/processed/programs_62.json` | The 62 selected institutions, candidate programs, and official program URLs |
| `data/processed/aashe_stars_records.json` | AASHE STARS participant/report directory records |
| `data/processed/unprme_signatories.json` | UN Principles for Responsible Management Education signatory records |
| `data/processed/unprme_sip_reports.json` | UNPRME Sharing Information on Progress report records |
| `data/processed/unprme_sip_reports_for_selected_institutions.json` | SIP records matched to selected institutions |
| `data/processed/openalex_institution_signals.json` | OpenAlex institution matches and research indicators |
| `data/processed/qs_the_university_ranking_history.json` | Five-year institution-level QS and THE ranking history |
| `data/processed/qs_the_subject_ranking_proxies.json` | Five-year subject-ranking proxies linked to the selected programs |
| `outputs/program_source_data_collection_with_institutional_signals.xlsx` | Main source-data collection workbook with institutional signals |
| `outputs/qs_the_5_year_university_and_program_subject_rankings_62_programs.xlsx` | University and program-related subject ranking workbook |
| `data/README.md` | Data dictionary, provenance, and limitations |
| `docs/MANUAL_VERIFICATION_GUIDE.md` | Checklist for reviewing official program websites |

## Data coverage

- 62 sustainability-related master's programs at 62 institutions.
- QS World University Rankings editions 2023-2027: 310 of 310 institution-year cells matched.
- THE World University Rankings editions 2022-2026: 310 of 310 institution-year cells matched.
- QS subject proxies, 2022-2026: 288 ranked cells and 22 explicit non-rank/out-of-range cells.
- THE subject proxies, 2022-2026: 296 ranked cells and 14 explicit non-ranked cells.
- 414 AASHE STARS directory records.
- 858 UNPRME signatories and 3,830 SIP report records.
- OpenAlex research signals for all 62 selected institutions.

## Ranking interpretation

QS and THE generally do not publish rankings for individual sustainability master's programs. The repository therefore separates two concepts:

1. **University rankings** are the institution's published overall QS/THE rank.
2. **Program-related subject rankings** map a program to the closest available subject category. They are transparent proxies, not direct program rankings.

Published ties and rank bands are retained as text. `NR` means that an institution was not ranked in a complete subject table, or was not found within the QS collection range stated in the record's status field.

## Primary sources

- [AASHE STARS participants and reports](https://reports.aashe.org/institutions/participants-and-reports/)
- [UN Principles for Responsible Management Education](https://www.unprme.org/search/)
- [OpenAlex](https://openalex.org/)
- [QS World University Rankings](https://www.topuniversities.com/world-university-rankings)
- [QS World University Rankings by Subject](https://www.topuniversities.com/university-subject-rankings)
- [Times Higher Education World University Rankings](https://www.timeshighereducation.com/world-university-rankings/latest/world-ranking)
- [Times Higher Education World University Rankings by Subject](https://www.timeshighereducation.com/world-university-rankings/by-subject)

## Suggested workflow

1. Open the main source-data workbook and review one program at a time.
2. Visit the official program URL and confirm program name, curriculum, duration, delivery mode, tuition, experiential learning, and career information.
3. Record the verification date and source URL for every manually confirmed value.
4. Treat institutional and subject rankings as context rather than a substitute for program-level evidence.
5. Preserve missing values instead of estimating facts that are not published.

See [the manual verification guide](docs/MANUAL_VERIFICATION_GUIDE.md) for a field-by-field checklist.

## Data status and limitations

The data were collected in July 2026 and represent a research snapshot. University websites, tuition, curricula, rankings, signatory status, and report availability can change. Automated name matching was reviewed for the selected institutions, but final program facts still require manual verification.

The source organizations retain ownership of their published content. This repository provides transformed research records with source URLs for academic use; users should consult each source's current terms before redistribution or commercial use.

