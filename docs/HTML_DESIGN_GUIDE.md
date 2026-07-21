# HTML Design Guide for the 60-Program Sustainability Dataset

**Handoff version:** 1.0  
**Date:** 2026-07-21  
**Intended reader:** Front-end teammate building the project website  
**Language:** English

## 1. Product goal

Build a credible, data-first academic program explorer for the current 60-program sample. The site should help users:

1. Find sustainability-related graduate programs.
2. Compare program structure, cost, delivery, rankings, and institutional sustainability signals.
3. Inspect five-year ranking histories without confusing university rankings with program rankings.
4. Follow every important claim back to an official source.
5. Understand when data are missing, unverified, scope-limited, or illustrative.
6. Review Reddit discussions as supplementary community context, not as an academic quality score.

The target audience overlaps with [SUSANhub](https://susanhub.com/), which describes itself as a professional network for sustainability scholars and organizes researchers, datasets, conferences, jobs, institutes, and discussions. The visual tone should therefore feel like a useful academic network and research tool, not a commercial university-ranking advertisement.

## 2. Source workbooks

Use these workbooks as the current source set:

- `outputs/program_source_data_top60_qs30_the30.xlsx`
- `outputs/qs_the_5_year_sustainability_and_school_rankings_60_programs.xlsx`
- `outputs/reddit_top60_program_matches.xlsx`

The canonical join key is `ID` / `Institution ID`. Do not join by university name because aliases and campus scopes vary.

The current sample is:

- 60 programs and institutions
- 30 selected from the QS Sustainability cohort
- 30 highest-ranked nonduplicate additions from THE Impact
- 21 countries

Historical 62-institution JSON files in `data/processed` are not the current website sample and must not be joined without filtering and ID rematching.

## 3. Recommended information architecture

### 3.1 Main routes

- `/` - Explore Programs
- `/program/:id` - Program Detail
- `/compare?ids=...` - Compare up to three programs
- `/rankings` - Separate Research-oriented and Taught/Professional rankings
- `/methodology` - Data definitions, ranking method, sources, and limitations
- `/community` - Optional Reddit/community explorer

### 3.2 First screen

The first screen should be the usable explorer, not a marketing landing page.

Recommended desktop structure:

- Compact top navigation with project name, Explore, Rankings, Compare, Methodology, and Data Sources.
- Search input for program, institution, and country.
- Left filter panel.
- Result count, active-filter chips, and sort control.
- Compact program cards or a table/card view toggle.
- Compare tray fixed near the bottom after the user selects a program.

On mobile, filters should open in a full-height drawer and active filters should remain visible as removable chips.

## 4. Program card design

Each card should show only normalized, high-value fields:

- Program name
- Institution
- Country
- Selection cohort: QS, THE, or Both
- Latest available QS Sustainability rank
- Latest available THE Impact rank
- Latest QS and THE overall university rank
- Duration
- Delivery mode
- Language
- Thesis option
- Tuition only when the fee basis, currency, academic year, and student type are clear
- Verification badge
- Compare checkbox/button
- Official program link

Use separate labels for:

- **Sustainability ranking**: institutional sustainability/impact ranking
- **University ranking**: overall institution ranking
- **Program details**: not a program ranking

Never present a university or subject proxy rank as the direct rank of an individual master's program.

Do not place long raw extraction text on a card. Any duration, delivery, tuition, or requirement field longer than a reasonable single sentence must be normalized or withheld.

## 5. Program detail page

### 5.1 Header

Show:

- Institution and program name
- Country
- Candidate source/cohort
- Verification state
- Last verified date
- Official program button
- Data-quality warning when required

### 5.2 Tabs or sections

**Overview**

- Tuition and fee basis
- Duration
- Full-time/part-time availability
- Study mode
- Entry requirements
- Teaching language
- Language tests and scores
- Curriculum focus
- Internship/fieldwork
- Capstone/project
- Thesis option
- Placement or class-size information when published

**Rankings**

Keep sustainability and overall university rankings in separate chart groups:

- QS Sustainability, 2022-2026
- THE Impact, 2022-2026
- QS World University Rankings, 2023-2027
- THE World University Rankings, 2022-2026

Every chart must also have an accessible data table. Tooltips must explain `NR`, `N/P`, and `200+`.

**Institutional signals**

- AASHE STARS
- UN PRME
- OpenAlex research indicators

These signals apply at an institution, campus, or school scope. Display the scope note next to the value. Do not promote a campus or business-school result to the entire university.

**Community**

Show the Reddit component described in Section 10.

**Sources and notes**

List official URLs, retrieval dates, audit status, source scope, and unresolved issues.

## 6. Filters

### 6.1 Required filters

| Filter | Source or derived field | Notes |
| --- | --- | --- |
| Search | Institution, program, country | Search aliases as well as canonical names |
| Country | Country | Multi-select |
| Selection cohort | QS / THE | Keep cohort separate from candidate source |
| Candidate source | QS Sustainability / THE Impact / Both | Useful for sample audit |
| Program type | Research-oriented / Taught-Professional / Mixed / Unclassified | Must be manually confirmed |
| Verification | Confirmed / Manual review / Unverified / Illustrative | "Verified only" should be easy to activate |
| Study mode | On campus / Online / Hybrid / Distance with residency / Not verified | Must be normalized before use |
| Duration | <=12, 13-18, 19-24, >24 months, Not verified | Derive from normalized month fields |
| Language | English / Japanese / Other | Current workbook mainly contains English and Japanese |
| Thesis option | Yes / No | Apply the project rule in Section 8 |
| Capstone/project | Yes / No / Unknown | Do not treat missing as No |
| Internship/fieldwork | Yes / No / Unknown | Add as a normalized field |
| Sustainability ranking source | QS / THE / Either | Year must be visible |
| Sustainability rank band | 1-25 / 26-50 / 51-100 / 101-200 / 200+ / NR / N/P | Do not turn NR into a numeric value |
| Overall university rank band | 1-25 / 26-50 / 51-100 / 101-200 / 200+ / NR | Follow the 200+ rule |
| AASHE | Current exact record / Campus-only / Scope review / No exact record | Avoid a binary interpretation |
| UN PRME | Communicating / Non-communicating / No verified match | Keep signatory scope visible |
| OpenAlex availability | Collected / No reliable match / API quota | Availability filter, not a quality rank |
| Community coverage | Reviewed posts / Awaiting review / No matched posts / Not collected | Keep blank-state types distinct |

### 6.2 Conditional filters

Add tuition filters only after normalizing amount, currency, academic year, domestic/international status, and per-year/total/per-credit basis. Until then, show the verified raw fee statement and do not provide a cross-currency range slider.

### 6.3 Filters to avoid initially

Do not use these as primary filters until coverage improves:

- Class size
- Placement rate
- AASHE numeric score
- Raw OpenAlex citation counts
- Reddit score, upvote ratio, or post count as a proxy for program quality
- Exact tuition comparison across currencies without a dated exchange-rate method

### 6.4 Sorting

Use transparent sorting only:

- Institution A-Z
- Program A-Z
- Project ranking score, with ranking track and confidence visible
- Latest QS Sustainability rank
- Latest THE Impact rank
- Latest QS university rank
- Latest THE university rank
- Duration after normalization
- Tuition after normalization

Do not create an unexplained composite "best program" score.

## 7. Required preprocessing layer

Do not make the browser parse the Excel workbooks. Convert the workbooks into canonical JSON or CSV during the build process.

Suggested program object:

```json
{
  "id": 17,
  "institution": "Australian National University (ANU)",
  "program": "Master of Climate Change",
  "country": "Australia",
  "cohort": "QS",
  "candidateSource": "QS Sustainability",
  "programType": "taught",
  "verification": {
    "state": "unverified",
    "lastReviewed": "2026-07-18",
    "warning": "Official page could not be fully verified.",
    "isIllustrative": true
  },
  "programDetails": {
    "tuition": {
      "amount": null,
      "currency": null,
      "basis": null,
      "academicYear": null,
      "studentType": null,
      "displayText": "Not verified"
    },
    "durationMonthsMin": 12,
    "durationMonthsMax": 24,
    "studyMode": ["on-campus"],
    "language": ["English"],
    "thesisOption": "No",
    "capstoneOption": "Unknown",
    "internshipFieldwork": "Unknown"
  },
  "rankings": {
    "qsSustainability": [],
    "theImpact": [],
    "qsUniversity": [],
    "theUniversity": []
  },
  "sources": [],
  "community": {
    "coverageState": "not-collected",
    "reviewedPostCount": null
  }
}
```

Keep both normalized values and the original source text for auditing, but expose only normalized fields to cards and filters.

## 8. Missing-data and accuracy rules

| Source value or condition | Website treatment |
| --- | --- |
| Blank field | Use a field-specific status; never assume zero |
| Thesis blank or "Not stated on reviewed official page" | Convert to **No**, according to the project rule |
| Contaminated thesis text | Convert to **No** after logging the cleanup |
| `NR` | Show "Not ranked in the collected official table" |
| `N/P` | Show "Ranking not published for this edition" |
| Rank beyond 200 | Display **200+**; do not show or infer the exact rank |
| Automated fetch blocked/failed | Show "Manual verification required" |
| Official page unavailable | Show an accuracy warning and source status |
| Synthetic value | Show "Illustrative data"; exclude from filters, charts, totals, and comparisons |
| AASHE no exact record | Show "No current exact institution-level record found"; not a zero score |
| PRME no verified match | Show "No verified signatory match"; not "not a member" |
| OpenAlex API quota | Show "Not collected due to API limit"; not zero publications |
| Reddit source not collected | Leave community metrics blank and show "Not collected" |
| Reddit source collected but no match | Show "No reviewed matching posts found in the collection window" |

### 8.1 Thesis rule

The current workbook contains 19 explicit `Yes`, 40 `Not stated on reviewed official page`, and one contaminated career-description value.

For the website, normalize this to:

- **Yes: 19**
- **No: 41**

The methodology page must state: "For this project, a thesis option is coded No unless an explicit thesis option was found in the reviewed source."

## 9. Current data-quality audit

### 9.1 Program details

- Tuition is unavailable for one program record: Stanford University.
- Curriculum focus is blank for one program record: Hanyang University.
- Language requirement text was not captured for 29 of 60 records. This does not mean no language requirement.
- Several duration and study-mode cells contain unrelated page text from automated extraction. These values must be manually normalized before filtering or display.
- One thesis cell contains placement/career copy and must be cleaned.
- Placement/class-size data are too sparse for a global filter.

For a missing language requirement, display: "See the official admissions requirements" and provide the source link.

### 9.2 Institutional datasets

- AASHE produced 12 institution/campus matches, but only 11 matched rating records. Preserve campus and scope limitations.
- UN PRME produced 31 verified matches. A school-level signatory must not be shown as a university-wide signatory.
- OpenAlex currently contains 28 collected institutions, 3 with no reliable match, and 29 not collected because the API quota was reached. Do not compare missing OpenAlex values with collected values.

### 9.3 Pages with user notes

The following records must show an inaccuracy warning. Synthetic values are allowed for layout/prototype completion only and must be labeled.

| ID | Institution | User note |
| --- | --- | --- |
| 17 | Australian National University (ANU) | Page not found |
| 20 | New York University (NYU) | Page not found |
| 21 | Pennsylvania State University | Main page not found |
| 54 | Queen's University | Main page not found |
| 61 | University of Alberta | It is not a program |
| 63 | Universitas Airlangga | Webpage not found |
| 64 | Pusan National University | No data on website |
| 67 | Chulalongkorn University | Webpage cannot open |
| 69 | Hong Kong University of Science and Technology | Webpage cannot open |
| 73 | Kyung Hee University | It is an undergraduate program |

Use this warning at the top of each affected page:

> **Data quality notice:** Some information on this page could not be verified from the current official graduate-program page. Fields marked "Illustrative" are prototype data and must not be used for application or comparison decisions. Please check the linked official source.

For IDs 61 and 73, use the stronger badge **Program eligibility unverified** and exclude illustrative fields from result totals and default comparisons.

### 9.4 Synthetic-data rules

Every synthetic field must include:

- `isIllustrative: true`
- A visible `Illustrative data` badge
- A short reason
- No effect on sorting, filters, charts, aggregates, or ranking
- A replacement path to a real source
- A visual treatment that remains readable without relying on color alone

Never mix synthetic and verified values in the same statistic.

## 10. Reddit/community design

### 10.1 Current coverage

The temporary Reddit workbook contains:

- 4,985 unique matched posts
- 5,940 institution-post match records
- 53 institutions with at least one match
- 7 institutions with no matched posts
- Loaded sources: `r/gradadmissions`, `r/GradSchool`, `r/sustainability`, and `r/sustainableFinance`
- `r/gradadmissions` begins in July 2025
- The other loaded sources begin in July 2024
- `r/EnvironmentalScience` should be excluded because no usable posts were available
- School-specific subreddits are a planned manual extension

The `Matched Posts` sheet is many-to-many. Use `Unique Posts` for the public post list so the same Reddit post does not appear repeatedly.

### 10.2 What to display

On a program page, show:

- Collection window
- Subreddits included
- Count of reviewed High- and Medium-relevance posts
- Post date
- Subreddit
- Title
- Short excerpt
- Score and comment count as context only
- Link to the original Reddit post
- Manual-review badge when needed

Do not display author names. Exclude NSFW posts. Hide Low-relevance posts by default.

Do not calculate a program sentiment score or use Reddit activity to rank academic quality.

### 10.3 Blank states

Use different messages for different causes:

**Not collected**

> Community discussion data have not yet been collected for this program.

**Collected, no match**

> No reviewed matching posts were found within the current collection window.

**Matches awaiting review**

> Potentially relevant discussions were found but are awaiting manual review.

**School subreddit planned**

> School-specific community data will be added after the manual subreddit archive is reviewed.

A blank community panel is better than a fake zero.

### 10.4 Adding future school-subreddit data

Append future archives to a normalized table with:

- `post_id`
- `institution_id`
- `subreddit`
- `collection_start`
- `collection_end`
- `post_date_utc`
- `title`
- `text_excerpt`
- `reddit_url`
- `score`
- `comment_count`
- `upvote_ratio`
- `relevance_tier`
- `match_basis`
- `manual_review_status`
- `source_file`
- `is_illustrative`

Processing order:

1. Load the new archive.
2. Remove malformed and NSFW records.
3. Deduplicate by `post_id`.
4. Match institution and program aliases.
5. Flag acronym-only and institution-only matches.
6. Manually review High-relevance and ambiguous matches.
7. Recalculate institution coverage.
8. Publish the new collection window and included subreddits.

Synthetic posts may be used only to test the component. Label the whole component **Prototype community content** and keep it out of published counts.

## 11. Custom project ranking

The website may publish two separate subjective rankings:

- **Research-oriented programs**
- **Taught/Professional programs**

Use [CUSTOM_RANKING_METHODOLOGY.md](./CUSTOM_RANKING_METHODOLOGY.md) as the implementation contract.

Important interface rules:

- Never mix the two tracks in one ordered list.
- Show score, component scores, data coverage, and confidence.
- Exclude illustrative data from scoring.
- Do not rank eligibility-unverified programs.
- Label the ranking "Project ranking - not an official QS or THE ranking."
- Provide a methodology link beside every ranking title.
- A user-adjusted weight view must be labeled "Personalized order," not the published project ranking.

## 12. Visual direction

Use SUSANhub as an audience and tone reference, not as a visual copy.

Recommended characteristics:

- Academic, contemporary, and restrained
- White or light neutral backgrounds
- Green/teal as a limited sustainability accent, combined with a neutral or blue accent
- High-contrast text
- Maximum card radius of 8 px
- No nested cards
- No decorative gradients or abstract environmental imagery
- Lucide or the project's existing icon set
- Dense, scannable tables for research-oriented users
- Clear source links and status badges
- Real institutional/program imagery only when correctly sourced and licensed

Suggested status colors:

- Verified: green with check icon
- Manual review: amber with alert icon
- Unverified: red with warning icon
- Illustrative: blue-gray with document icon
- Not collected: neutral gray with dash icon

Always include text and icons; do not rely on color alone.

## 13. Accessibility and responsive behavior

- Meet WCAG AA contrast.
- Support keyboard navigation for filters, cards, tabs, and compare controls.
- Every chart must have a table alternative.
- Use visible focus states.
- Do not encode rank series only by color; use line style and labels.
- Keep source URLs readable and keyboard accessible.
- On mobile, keep the program name, verification state, and primary source link above the fold.
- Prevent tables from clipping; use responsive columns or horizontal scroll with a visible cue.

## 14. Implementation guidance

### 14.1 Data pipeline

```text
Excel workbooks
  -> validation and normalization script
  -> canonical programs.json
  -> rankings.json
  -> community-posts.json
  -> static site or API
```

Validation should fail the build when:

- Program count is not 60.
- QS/THE cohort counts are not 30/30.
- IDs are duplicated or missing.
- A program has no official URL.
- A value marked verified has no source.
- A synthetic value lacks `isIllustrative: true`.
- A noted page has no warning state.
- A study-mode or duration field contains long raw extraction text.
- A precise university rank greater than 200 is displayed instead of `200+`.

### 14.2 Data quality state

```ts
type DataState =
  | "verified"
  | "manual-review"
  | "unverified"
  | "not-ranked"
  | "not-published"
  | "not-collected"
  | "not-applicable"
  | "illustrative";
```

Every displayed field should be able to provide:

- `value`
- `displayValue`
- `state`
- `sourceUrl`
- `lastReviewed`
- `scopeNote`
- `warning`
- `isIllustrative`

### 14.3 Performance

- Prebuild JSON; do not load full Excel files in the browser.
- Paginate or virtualize the Reddit list.
- Load charts and community posts only on the detail page or when their tab opens.
- Keep initial program data small enough for fast filtering.
- Use URL query parameters for filters and selected comparison programs.

## 15. Acceptance checklist

- [ ] Exactly 60 program records appear.
- [ ] QS and THE cohorts each contain 30 records.
- [ ] Sustainability and university rankings are visually separated.
- [ ] Research and taught project rankings are separate.
- [ ] `200+`, `NR`, and `N/P` have correct definitions.
- [ ] Thesis values are normalized to 19 Yes and 41 No.
- [ ] All 10 noted records show the inaccuracy warning.
- [ ] Synthetic fields are labeled and excluded from analytics and ranking.
- [ ] Raw malformed duration/study-mode text is not displayed.
- [ ] AASHE, PRME, and OpenAlex scope limitations are visible.
- [ ] Reddit uses unique posts, excludes `r/EnvironmentalScience`, and has correct blank states.
- [ ] The methodology page lists collection windows and official sources.
- [ ] Filters work on mobile and desktop.
- [ ] Charts have accessible table alternatives.
- [ ] Official program and ranking links open correctly.
- [ ] No unexplained composite "best program" score is presented.

## 16. Suggested delivery order

1. Build and validate the normalization script.
2. Confirm research/taught classification.
3. Build the Explore Programs page and required filters.
4. Build Program Detail and source/warning components.
5. Build Compare and the two ranking tables.
6. Add ranking charts.
7. Add AASHE, PRME, and OpenAlex sections.
8. Add Reddit blank states first.
9. Add reviewed Reddit posts after the ethics checks are stable.
10. Complete accessibility, mobile QA, and the methodology page.
