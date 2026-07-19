# Beyond University Rankings

Transparent, student-centered data collection for comparing global sustainability-related master's programs.

This repository supports the BUSA 649 community project described in [Project_Proposal.pdf](proposal/Project_Proposal.pdf). The current corrected candidate universe contains 97 institutions selected from the QS Sustainability Rankings 2026 and THE Sustainability Impact Ratings 2026.

## Project purpose

University rankings describe institutions, not the day-to-day experience or outcomes of a specific master's program. This project links institutional sustainability evidence and overall school rankings to one sustainability-related master's route at each university, while preserving the official program URL for manual validation.

## Current corrected files

| Path | Description |
| --- | --- |
| `proposal/Project_Proposal.pdf` | Original project proposal and planned analysis framework |
| `outputs/program_source_data_corrected_sustainability_impact_aashe.xlsx` | Corrected 97-institution candidate universe, verified program links, 2026 QS/THE sustainability results, overlap analysis, AASHE matches, and URL audit |
| `outputs/qs_the_5_year_sustainability_and_school_rankings_97_programs.xlsx` | Five-year institutional sustainability and overall school ranking histories linked to all 97 selected programs |
| `docs/MANUAL_VERIFICATION_GUIDE.md` | Checklist for reviewing official program websites |
| `data/README.md` | Provenance and limitations for collected source files |

Files that refer to 62 institutions are earlier working snapshots. They should not be combined with the corrected 97-institution workbooks without rematching institution IDs.

## Corrected ranking coverage

- 97 sustainability-related master's routes at 97 institutions.
- QS Sustainability editions 2023-2026: 372 ranked institution-year cells and 16 explicit `NR` cells. The ranking did not exist in 2022, which is shown as `N/P`.
- THE Impact Rankings 2022-2025 plus THE Sustainability Impact Ratings 2026: 333 ranked institution-year cells and 152 explicit `NR` cells.
- QS World University Rankings editions 2023-2027: 325 cells retain an exact rank from 1-200; 160 are coded `200+`.
- THE World University Rankings editions 2022-2026: 269 cells retain an exact rank from 1-200; 210 are coded `200+`; 6 are `NR`.
- Current 2026 candidate ranks were cross-checked against the corrected source workbook with zero mismatches.

## Ranking interpretation

The ranking workbook separates two concepts:

1. **Sustainability rankings** are QS Sustainability and THE Impact / Sustainability Impact results for the institution.
2. **School rankings** are the institution's overall QS and THE World University Rankings.

Neither is a direct ranking of the selected master's program. Overall school ranks 1-200 retain the published value, including ties. Published ranks after 200 are intentionally reported as `200+`. `NR` means not ranked in a complete official table; `N/P` means that the edition was not published.

## Primary sources

- [QS Sustainability Rankings](https://www.topuniversities.com/sustainability-rankings)
- [THE Sustainability Impact Ratings](https://www.timeshighereducation.com/impactrankings)
- [QS World University Rankings](https://www.topuniversities.com/world-university-rankings)
- [THE World University Rankings](https://www.timeshighereducation.com/world-university-rankings/latest/world-ranking)
- [AASHE STARS participants and reports](https://reports.aashe.org/institutions/participants-and-reports/)
- [UN Principles for Responsible Management Education](https://www.unprme.org/search/)
- [OpenAlex](https://openalex.org/)

## Suggested workflow

1. Start with the corrected 97-institution source workbook.
2. Open each official program URL and verify curriculum, duration, delivery mode, tuition, experiential learning, career evidence, and the verification date.
3. Use the ranking history workbook only as institutional context.
4. Preserve `NR`, `N/P`, and missing program facts rather than estimating them.
5. Refresh time-sensitive values before final analysis or publication.

The data were collected in July 2026 and represent a point-in-time research snapshot. Source organizations retain ownership of their published content.
