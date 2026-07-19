# Beyond University Rankings

Transparent, student-centered data collection for comparing global sustainability-related master's programs.

This repository supports the BUSA 649 community project described in [Project_Proposal.pdf](proposal/Project_Proposal.pdf). The sustainability-specific ranking cutoffs produced 97 source candidates; 96 institutions remain after manual review excluded ID 75, Al-Ahliyya Amman University, because no relevant master's program was confirmed.

## Project purpose

University rankings describe institutions, not the day-to-day experience or outcomes of a specific master's program. This project links institutional sustainability evidence and overall school rankings to one sustainability-related master's route at each university, while preserving the official program URL for manual validation.

## Current corrected files

| Path | Description |
| --- | --- |
| `proposal/Project_Proposal.pdf` | Original project proposal and planned analysis framework |
| `outputs/program_source_data_corrected_96_with_aashe_prme_openalex_details.xlsx` | Current 96-program master workbook with QS/THE source rankings, program verification, AASHE, UN PRME, OpenAlex 2021-2025 signals, official program details, source URLs, and audit notes |
| `outputs/qs_the_5_year_sustainability_and_school_rankings_96_programs.xlsx` | Five-year institutional sustainability and overall school ranking histories linked to the 96 retained programs |
| `docs/MANUAL_VERIFICATION_GUIDE.md` | Checklist for reviewing official program websites |
| `data/README.md` | Provenance and limitations for collected source files |

Files that refer to 62 or 97 programs are earlier working snapshots. They should not be combined with the corrected 96-program workbooks without rematching institution IDs.

## Corrected ranking coverage

- 96 retained sustainability-related master's routes at 96 institutions; original IDs are preserved with ID 75 intentionally absent.
- QS Sustainability editions 2023-2026: 373 ranked institution-year cells and 15 explicit `NR` cells. The ranking did not exist in 2022, which is shown as `N/P`.
- THE Impact Rankings 2022-2025 plus THE Sustainability Impact Ratings 2026: 333 ranked institution-year cells and 152 explicit `NR` cells.
- QS World University Rankings editions 2023-2027: 330 cells retain an exact rank from 1-200; 155 are coded `200+`.
- THE World University Rankings editions 2022-2026: 274 cells retain an exact rank from 1-200; 205 are coded `200+`; 6 are `NR`.
- Current 2026 candidate ranks were cross-checked against the corrected source workbook with zero mismatches.

## Institutional and program evidence

- 48 verified UN PRME signatory matches and 87 SIP reports with report years 2022-2026.
- 45 OpenAlex institution/research-signal rows collected for 2021-2025. Another 47 rows are explicitly marked `API quota reached`, and four have `No reliable match`; missing values are not coded as zero.
- 96 English program-detail rows cover tuition/fees, duration, delivery, language, curriculum focus, internship/fieldwork, capstone/project, thesis, class size, placement, and official source URLs.
- AASHE STARS matches remain institution/campus scoped and are not inherited across related entities.

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

1. Start with the corrected 96-program source workbook.
2. Open each official program URL and verify curriculum, duration, delivery mode, tuition, experiential learning, career evidence, and the verification date.
3. Use the ranking history workbook only as institutional context.
4. Preserve `NR`, `N/P`, and missing program facts rather than estimating them.
5. Refresh time-sensitive values before final analysis or publication.

The data were collected in July 2026 and represent a point-in-time research snapshot. Source organizations retain ownership of their published content.
