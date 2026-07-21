# Custom Project Ranking Methodology

**Method version:** 1.0-draft  
**Date:** 2026-07-21  
**Purpose:** Define a transparent subjective ranking based on the current 60-program dataset  
**Public label:** Project ranking - not an official QS or THE ranking

## 1. Why there are two rankings

Research-oriented and taught/professional programs serve different goals. They must not be placed in one combined ordered list.

Publish two tables:

1. **Research-oriented Program Index**
2. **Taught/Professional Program Index**

A program must have a manually confirmed `program_type` before it can appear in either ranking.

## 2. Program-type classification

### 2.1 Research-oriented

Classify a program as Research-oriented only when an official source confirms at least one of these:

- A required thesis or substantial original research project
- A research-degree structure
- A supervisor or laboratory match
- A required research proposal
- A research-methods sequence leading to independent research

The current `Match Type = Research` is useful evidence but is not the only rule.

### 2.2 Taught/Professional

Classify a program as Taught/Professional when the official structure is mainly:

- Coursework
- Professional modules
- A taught capstone or consultancy project
- Practice-based training
- Career-oriented delivery without a required research thesis

### 2.3 Mixed pathways

If an official program has separate course-based and research-based pathways, create two pathway records only when the source clearly distinguishes them. Otherwise assign `Mixed - manual classification required` and do not rank it.

### 2.4 Important thesis rule

The website's thesis field is normalized to 19 `Yes` and 41 `No`, following the project rule that a thesis is No unless explicitly found.

However, `Thesis Option = Yes` alone does not automatically make a program Research-oriented. An optional dissertation can exist inside a mainly taught degree. Program type requires manual review of the structure.

### 2.5 Exclusions

Do not publish a rank when:

- The program is not confirmed as a current graduate program.
- The page is marked undergraduate or "not a program."
- The program identity is unresolved.
- Required scoring fields use illustrative data.
- The program type is unclassified.
- Data coverage is below the publication threshold in Section 10.

IDs 61 and 73 are excluded until graduate-program eligibility is corrected and verified. Other noted pages remain provisional until the requirements and program identity are manually confirmed.

## 3. Ranking data sources

### 3.1 Institutional rankings

- QS Sustainability Rankings
- THE Impact Rankings
- QS World University Rankings
- THE World University Rankings

### 3.2 Program evidence

- Entry requirements
- English-language requirements
- Curriculum focus
- Thesis/research structure
- Capstone/project
- Internship/fieldwork
- Delivery mode and duration
- Placement outcomes when published

### 3.3 Institutional sustainability and research signals

- AASHE STARS
- UN PRME
- OpenAlex

Reddit is not included in either quality ranking. Reddit activity measures discussion volume and matching coverage, not academic quality.

## 4. Rank normalization

### 4.1 Exact rank

For an exact rank from 1 to 200:

```text
RankScore = 100 * (201 - Rank) / 200
```

Examples:

- Rank 1 -> 100
- Rank 50 -> 75.5
- Rank 100 -> 50.5
- Rank 200 -> 0.5

### 4.2 Rank band

For a published band such as `101-200`, use the midpoint for calculation and keep the band as the public display value.

```text
BandMidpoint = (LowerBound + UpperBound) / 2
```

### 4.3 Values beyond 200

- Display `200+`.
- Use a RankScore of 0.
- Do not infer or publish the exact rank.

### 4.4 Other ranking states

- Explicit `NR` in a complete official table: RankScore = 0.
- `N/P` because the ranking did not exist: missing, not zero.
- Not collected or blocked: missing, not zero.
- Illustrative rank: excluded.

### 4.5 Five-year series score

Use recent performance without relying on only one edition:

```text
SeriesScore = 0.60 * LatestAvailableRankScore
            + 0.40 * MedianOfEarlierAvailableRankScores
```

If no earlier edition exists, the latest verified score receives the full series weight. The edition and number of available years must be displayed.

## 5. Common Institution Strength score

Institution Strength is 30% of both ranking tracks.

| Series | Final-program weight |
| --- | ---: |
| QS World University Rankings | 7.5% |
| THE World University Rankings | 7.5% |
| QS Sustainability Rankings | 7.5% |
| THE Impact Rankings | 7.5% |
| **Total** | **30%** |

This balances overall university standing and institutional sustainability standing.

The site must label this component **Institution Strength**, not **Program Rank**.

## 6. Research-oriented Program Index

| Component | Weight |
| --- | ---: |
| Institution Strength | 30% |
| Research Environment | 25% |
| Program Research Design | 15% |
| Entry Requirement Selectivity | 10% |
| English Requirement | 10% |
| Sustainability Engagement | 10% |
| **Total** | **100%** |

### 6.1 Research Environment - 25%

Use verified OpenAlex evidence only:

- Sustainability-related works, log-transformed and percentile-normalized: 10%
- Citation impact, using H-index and citations with percentile normalization: 10%
- Relevance of top matching research and institutional match confidence: 5%

Normalize metrics only among institutions with collected OpenAlex data. Missing values caused by the API quota are neutral-missing, not zero.

Do not use raw counts without log transformation because institution size heavily affects them.

### 6.2 Program Research Design - 15%

Score the component from verified official evidence:

| Criterion | Share of component |
| --- | ---: |
| Required thesis or substantial original research | 40% |
| Research methods or analytical training | 20% |
| Supervisor, laboratory, or research-group fit | 20% |
| Fieldwork, data collection, or research capstone | 20% |

An optional thesis receives less credit than a required thesis. Illustrative research features receive no credit.

## 7. Taught/Professional Program Index

| Component | Weight |
| --- | ---: |
| Institution Strength | 30% |
| Curriculum and Professional Relevance | 20% |
| Experiential Learning | 15% |
| Entry Requirement Selectivity | 10% |
| English Requirement | 10% |
| Delivery and Duration Flexibility | 5% |
| Career Outcome Evidence | 5% |
| Sustainability Engagement | 5% |
| **Total** | **100%** |

### 7.1 Curriculum and Professional Relevance - 20%

Score from verified curriculum evidence:

- Sustainability-specific core curriculum: 35%
- Interdisciplinary coverage: 20%
- Methods, analytics, policy, management, or technical depth: 25%
- Elective breadth and current applied topics: 20%

### 7.2 Experiential Learning - 15%

| Criterion | Share of component |
| --- | ---: |
| Required capstone/consultancy project | 35% |
| Internship or fieldwork | 35% |
| External client, industry, government, or community engagement | 20% |
| Portfolio or practice-based output | 10% |

A missing internship field is Unknown, not No, unless an official curriculum confirms no such component.

### 7.3 Delivery and Duration Flexibility - 5%

Use normalized fields only:

- Both full-time and part-time available
- Online or verified hybrid option
- Clearly published duration
- Multiple entry points where verified

This is a flexibility score, not a claim that online or shorter programs are academically better.

### 7.4 Career Outcome Evidence - 5%

Use only published, program-specific evidence:

- Placement rate or destination data
- Class profile or cohort outcomes
- Named employer sectors
- Verified professional accreditation or career pathway evidence

Generic marketing language does not count. Missing placement data are neutral-missing.

## 8. Entry Requirement Selectivity

Entry Requirement Selectivity is 10% in both tracks. It measures documented admissions rigor, not teaching quality.

### 8.1 Research-oriented rubric

| Criterion | Component points |
| --- | ---: |
| Academic grade/degree threshold | 35 |
| Relevant discipline or prerequisite methods | 20 |
| Research proposal or supervisor fit | 25 |
| References, CV, or statement requirements | 10 |
| Requirement clarity and source recency | 10 |
| **Total** | **100** |

### 8.2 Taught/Professional rubric

| Criterion | Component points |
| --- | ---: |
| Academic grade/degree threshold | 40 |
| Relevant discipline or prerequisite knowledge | 20 |
| Work experience, portfolio, or professional background | 20 |
| References, CV, or statement requirements | 10 |
| Requirement clarity and source recency | 10 |
| **Total** | **100** |

### 8.3 Academic threshold guide

Use a manual country-aware mapping:

- Standard bachelor's degree with no threshold: 50/100 for the threshold subcriterion
- Approximately UK 2:2 or GPA 2.7-2.99: 65/100
- Approximately UK 2:1 or GPA 3.0-3.29: 80/100
- First-class or GPA 3.3+: 95/100

Do not automatically compare raw international GPA values without a documented equivalence rule.

A program with unpublished requirements has a missing component, not a score of zero.

## 9. English Requirement score

English Requirement is 10% in both tracks. It combines clarity and admissions selectivity.

This score must be labeled **English Requirement**, not **English Teaching Quality**.

### 9.1 Component formula

```text
EnglishScore = ClarityPoints + ThresholdPoints
```

| Subcomponent | Maximum |
| --- | ---: |
| Clarity and source verification | 40 |
| Published test threshold | 60 |
| **Total** | **100** |

### 9.2 Clarity points

- Exact test, overall score, component scores, and current date/version: 40
- Exact overall score and current source: 30
- Generic proof-of-English statement: 15
- No captured requirement: missing

### 9.3 IELTS threshold scale

| IELTS overall | Threshold score before 60% weighting |
| --- | ---: |
| <=5.5 | 35 |
| 6.0 | 50 |
| 6.5 | 70 |
| 7.0 | 85 |
| >=7.5 | 100 |

### 9.4 TOEFL iBT legacy scale

| TOEFL iBT | Threshold score before 60% weighting |
| --- | ---: |
| <80 | 35 |
| 80-89 | 50 |
| 90-99 | 70 |
| 100-109 | 85 |
| >=110 | 100 |

Use IELTS when a verified IELTS threshold is available. Otherwise use a verified TOEFL or other test threshold with a documented mapping.

Do not use a regular expression to score raw text automatically. The current workbook includes component scores, changing TOEFL scales, waivers, and multiple test versions. Extract one canonical threshold manually.

A waiver does not reduce the English score. It should be displayed separately as an accessibility condition.

Higher English requirements are only a small selectivity signal and are not inherently better for every applicant. The website should also offer a separate eligibility filter where users enter their own IELTS or TOEFL result.

## 10. Sustainability Engagement

### 10.1 Research ranking - 10%

- AASHE evidence: 5%
- UN PRME evidence: 5%

### 10.2 Taught ranking - 5%

- AASHE evidence: 2.5%
- UN PRME evidence: 2.5%

Suggested evidence scores:

**AASHE**

- Verified current exact record with Platinum: 100
- Gold: 85
- Silver: 70
- Bronze: 55
- Campus-only or scope-review record: missing until scope is confirmed
- No exact current record: missing, not zero

**UN PRME**

- Communicating signatory with a recent SIP: 100
- Communicating signatory without a recent SIP in the selected window: 80
- Non-communicating signatory: 40
- No verified match: missing, not zero
- School-level record: use only when the program belongs to that school

These sources have geographic and organizational coverage limits, so their weights remain modest.

## 11. Missing data, coverage, and confidence

### 11.1 Neutral missing-value adjustment

Do not score missing data as zero. First calculate the observed score from available components:

```text
ObservedScore = Sum(AvailableWeight * ComponentScore)
                / Sum(AvailableWeight)
```

Then shrink the score toward a neutral value of 50:

```text
Coverage = Sum(AvailableWeight) / 100

FinalScore = Coverage * ObservedScore
           + (1 - Coverage) * 50
```

This prevents incomplete records from appearing artificially excellent while avoiding a zero penalty for data that were not collected.

### 11.2 Confidence labels

| Coverage | Confidence | Public treatment |
| --- | --- | --- |
| >=85% | High | Publish rank |
| 70-84.9% | Medium | Publish with confidence label |
| 55-69.9% | Low | Show provisional score, no ordinal rank |
| <55% | Insufficient | Do not score publicly |

A critical verification warning overrides coverage and prevents publication.

### 11.3 Synthetic and unverified values

- Synthetic values never count as available.
- Unverified values never count as available.
- A page may display illustrative content, but the ranking must use only verified fields.
- The ranking breakdown should link every scored component to its source.

## 12. Tie handling and precision

- Display scores to one decimal place.
- Programs within 0.5 points may share the same rank band.
- Tie-breaker 1: higher data coverage.
- Tie-breaker 2: higher track-specific program component.
- Tie-breaker 3: institution name alphabetically.
- Do not display false precision beyond one decimal place.

## 13. Website presentation

Each ranking page should include:

- Research-oriented / Taught-Professional tab control
- Method version and last updated date
- Short "not official QS/THE ranking" statement
- Score
- Confidence
- Data coverage
- Institution Strength
- Program component
- Entry Requirement
- English Requirement
- Sustainability Engagement
- "Why this score?" expandable breakdown
- Source links
- Filter for country, mode, duration, language, and verified-only
- Downloadable methodology

Never show only the ordinal rank. The component breakdown is part of the deliverable.

Optional personalization:

- User-entered IELTS/TOEFL score
- Budget
- Preferred mode
- Preferred duration
- Thesis preference

Once weights or eligibility preferences change, label the result **Personalized order**, not the published project ranking.

## 14. Current release blockers

The numerical ranking should remain a draft until these issues are resolved:

1. Program type is not yet manually confirmed for all 60 records.
2. `Thesis Option = Yes` does not distinguish required and optional theses.
3. Language requirements are missing for 29 programs.
4. Some language text contains new and legacy TOEFL scales in one field.
5. Several duration and study-mode cells contain unrelated page extraction text.
6. OpenAlex has 28 collected records, 3 no reliable matches, and 29 API-quota gaps.
7. Placement and class-size evidence are sparse.
8. Ten program pages have user notes and require warnings.
9. IDs 61 and 73 have critical program-eligibility issues.
10. Illustrative values must be separated from ranking inputs.

The website may implement the full ranking interface with placeholder score shapes during development, but all placeholder scores must be marked illustrative and removed before publication.

## 15. Ranking output schema

```json
{
  "programId": 9,
  "track": "research",
  "methodVersion": "1.0",
  "eligible": true,
  "finalScore": 78.4,
  "coverage": 0.86,
  "confidence": "high",
  "rank": 4,
  "components": {
    "institutionStrength": {"score": 82.0, "weight": 0.30},
    "researchEnvironment": {"score": 75.0, "weight": 0.25},
    "programResearchDesign": {"score": 90.0, "weight": 0.15},
    "entryRequirement": {"score": 75.0, "weight": 0.10},
    "englishRequirement": {"score": 72.0, "weight": 0.10},
    "sustainabilityEngagement": {"score": null, "weight": 0.10}
  },
  "warnings": [],
  "sources": []
}
```

The example numbers above are illustrative and must not be published as the program's actual score.

## 16. Validation checklist

- [ ] Research and taught programs use separate tables and weights.
- [ ] Program type is manually verified.
- [ ] School and sustainability rankings are not labeled as program rankings.
- [ ] Five-year series rules are applied consistently.
- [ ] Ranks beyond 200 display only as `200+`.
- [ ] `NR`, `N/P`, missing, and not-collected states remain distinct.
- [ ] Admissions thresholds use a country-aware manual mapping.
- [ ] English thresholds are manually normalized.
- [ ] Missing values use the neutral coverage formula.
- [ ] Confidence and coverage are visible.
- [ ] Synthetic and unverified values do not affect scores.
- [ ] Reddit does not affect academic ranking.
- [ ] AASHE and PRME scope notes are respected.
- [ ] OpenAlex values are size-normalized and log-transformed.
- [ ] Critical program-eligibility warnings prevent publication.
- [ ] Method version and update date appear on the site.
