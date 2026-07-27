import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const METHOD_VERSION = "1.1-provisional-ranking";
const METHOD_DATE = "2026-07-27";
const root = process.cwd();

async function firstExistingPath(candidates) {
  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // Try the next supported repository layout.
    }
  }
  throw new Error(`Required input workbook not found. Checked:\n${candidates.join("\n")}`);
}

const sourcePath = await firstExistingPath([
  path.join(root, "outputs", "top60_workbook", "program_source_data_top60_qs30_the30.xlsx"),
  path.join(root, "outputs", "program_source_data_top60_qs30_the30.xlsx"),
]);
const rankingPath = await firstExistingPath([
  path.join(root, "outputs", "top60_rankings", "qs_the_5_year_sustainability_and_school_rankings_60_programs.xlsx"),
  path.join(root, "outputs", "qs_the_5_year_sustainability_and_school_rankings_60_programs.xlsx"),
]);
const outputDir = path.join(root, "outputs", "program_scoring_pipeline");
const manualPath = path.join(outputDir, "program_scoring_manual_inputs.xlsx");
const resultPath = path.join(outputDir, "program_scoring_results.xlsx");
const previewDir = path.join(outputDir, "previews");

const COLORS = {
  navy: "#17365D",
  teal: "#137C78",
  blue: "#245A86",
  burgundy: "#9A1B43",
  green: "#2E7D32",
  amber: "#B26A00",
  red: "#B42318",
  text: "#25364A",
  border: "#CBD7E3",
  lightBlue: "#DCEAF6",
  paleBlue: "#EAF3FA",
  paleGreen: "#EAF7ED",
  paleAmber: "#FFF4D6",
  paleRed: "#FDE8E7",
  paleGray: "#F3F5F7",
  white: "#FFFFFF",
};

const MANUAL_COLUMNS = [
  "ID",
  "Institution",
  "Program",
  "Program Type",
  "Route Classification Verified",
  "Source Spillover Reviewed",
  "Eligibility Status",
  "Critical Warning",
  "Illustrative Scoring Values",
  "Critical Override Cleared",
  "Eligibility Evidence URL",
  "Reviewed By",
  "Reviewed Date",
  "Review Notes",
  "Research Thesis / Original Research Score",
  "Research Methods Score",
  "Supervisor / Lab Fit Score",
  "Research Fieldwork / Capstone Score",
  "Research Design Source URL",
  "Curriculum Core Score",
  "Curriculum Interdisciplinary Score",
  "Curriculum Depth Score",
  "Curriculum Breadth Score",
  "Curriculum Source URL",
  "Capstone / Consultancy Score",
  "Internship / Fieldwork Score",
  "External Engagement Score",
  "Practice Portfolio Score",
  "Experiential Source URL",
  "Entry Academic Threshold Score",
  "Entry Relevant Background Score",
  "Entry Route-Specific Requirement Score",
  "Entry Supporting Documents Score",
  "Entry Clarity / Recency Score",
  "Entry Source URL",
  "English Clarity Points (0-40)",
  "English Threshold Score (0-100)",
  "English Source URL",
  "Full-Time and Part-Time Score",
  "Online / Hybrid Score",
  "Published Duration Score",
  "Multiple Entry Points Score",
  "Delivery Source URL",
  "Placement / Destination Evidence Score",
  "Class / Cohort Outcome Score",
  "Employer / Sector Evidence Score",
  "Accreditation / Career Pathway Score",
  "Career Source URL",
  "AASHE Scope Applicable",
  "UN PRME Scope Applicable",
  "OpenAlex Top-Work Relevance Score",
  "OpenAlex Relevance Source URL",
];

const SCORE_COLUMNS = new Set([
  "Research Thesis / Original Research Score",
  "Research Methods Score",
  "Supervisor / Lab Fit Score",
  "Research Fieldwork / Capstone Score",
  "Curriculum Core Score",
  "Curriculum Interdisciplinary Score",
  "Curriculum Depth Score",
  "Curriculum Breadth Score",
  "Capstone / Consultancy Score",
  "Internship / Fieldwork Score",
  "External Engagement Score",
  "Practice Portfolio Score",
  "Entry Academic Threshold Score",
  "Entry Relevant Background Score",
  "Entry Route-Specific Requirement Score",
  "Entry Supporting Documents Score",
  "Entry Clarity / Recency Score",
  "English Threshold Score (0-100)",
  "Full-Time and Part-Time Score",
  "Online / Hybrid Score",
  "Published Duration Score",
  "Multiple Entry Points Score",
  "Placement / Destination Evidence Score",
  "Class / Cohort Outcome Score",
  "Employer / Sector Evidence Score",
  "Accreditation / Career Pathway Score",
  "OpenAlex Top-Work Relevance Score",
]);

const CRITICAL_OVERRIDES = new Map([
  [61, "University of Alberta: the retained page was manually identified as not an eligible graduate programme record."],
  [73, "Kyung Hee University: the retained evidence describes an undergraduate programme."],
]);

function columnLetter(index) {
  let n = index + 1;
  let result = "";
  while (n > 0) {
    n -= 1;
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26);
  }
  return result;
}

function isBlank(value) {
  return value === null || value === undefined || String(value).trim() === "";
}

function cleanText(value) {
  return isBlank(value) ? "" : String(value).trim();
}

function normalizeChoice(value) {
  return cleanText(value).toLowerCase();
}

function numeric(value, min = 0, max = 100) {
  if (isBlank(value)) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) return null;
  return parsed;
}

function round(value, digits = 1) {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function median(values) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function workbookValues(workbook) {
  const result = new Map();
  for (let i = 0; ; i += 1) {
    let sheet;
    try {
      sheet = workbook.worksheets.getItemAt(i);
    } catch {
      break;
    }
    if (!sheet) break;
    result.set(sheet.name, sheet.getUsedRange()?.values ?? []);
  }
  return result;
}

function objectsFromValues(values, headerIndex = 3) {
  const headers = (values[headerIndex] ?? []).map(cleanText);
  return values
    .slice(headerIndex + 1)
    .filter((row) => row.some((value) => !isBlank(value)))
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? null])));
}

function byId(rows, idHeader = "ID") {
  return new Map(rows.map((row) => [Number(row[idHeader]), row]).filter(([id]) => Number.isFinite(id)));
}

function parseRankScore(rankValue, statusValue) {
  const rank = cleanText(rankValue).replaceAll("−", "-").replaceAll("–", "-").replaceAll("—", "-");
  const status = normalizeChoice(statusValue);
  const unavailable =
    !rank ||
    rank.toUpperCase() === "N/P" ||
    status.includes("n/p") ||
    status.includes("not published") ||
    status.includes("not collected") ||
    status.includes("blocked");
  if (unavailable) return { score: null, state: "missing", display: rank || "Missing" };
  if (rank.toUpperCase() === "NR" || status === "nr") return { score: 0, state: "NR", display: "NR" };
  if (rank.includes("+")) return { score: 0, state: "200+", display: "200+" };
  const band = rank.match(/=?\s*(\d+)\s*-\s*(\d+)/);
  if (band) {
    const lower = Number(band[1]);
    const upper = Number(band[2]);
    if (lower > 200) return { score: 0, state: "200+", display: "200+" };
    const midpoint = (lower + upper) / 2;
    const score = midpoint > 200 ? 0 : 100 * (201 - midpoint) / 200;
    return { score: Math.max(0, score), state: "band", display: rank };
  }
  const exact = rank.match(/=?\s*(\d+)/);
  if (!exact) return { score: null, state: "missing", display: rank };
  const rankNumber = Number(exact[1]);
  if (rankNumber > 200) return { score: 0, state: "200+", display: "200+" };
  return { score: 100 * (201 - rankNumber) / 200, state: "ranked", display: rank };
}

function fiveYearSeries(rows, id, label) {
  const observations = rows
    .filter((row) => Number(row.ID) === id)
    .map((row) => {
      const editionMatch = cleanText(row.Edition).match(/\d{4}/);
      const edition = editionMatch ? Number(editionMatch[0]) : Number(row.Edition);
      const parsed = parseRankScore(row.Rank, row.Status);
      return {
        edition: Number.isFinite(edition) ? edition : null,
        rank: parsed.display,
        score: parsed.score,
        state: parsed.state,
        officialRankingPage: cleanText(row["Official Ranking Page"]),
        profileUrl: cleanText(row["Profile URL"]),
      };
    })
    .sort((a, b) => (a.edition ?? 0) - (b.edition ?? 0));
  const available = observations.filter((row) => row.score !== null && row.edition !== null);
  if (!available.length) {
    return { label, score: null, yearsAvailable: 0, latestEdition: null, latestRank: null, observations };
  }
  const latest = available.at(-1);
  const earlier = available.slice(0, -1).map((row) => row.score);
  const score = earlier.length ? 0.6 * latest.score + 0.4 * median(earlier) : latest.score;
  return {
    label,
    score,
    yearsAvailable: available.length,
    latestEdition: latest.edition,
    latestRank: latest.rank,
    observations,
  };
}

function percentileMap(rows, field) {
  const values = rows
    .map((row) => ({ id: Number(row.ID), value: numeric(row[field], 0, Number.MAX_SAFE_INTEGER) }))
    .filter((entry) => Number.isFinite(entry.id) && entry.value !== null)
    .map((entry) => ({ ...entry, transformed: Math.log1p(entry.value) }));
  const result = new Map();
  if (!values.length) return result;
  for (const entry of values) {
    if (values.length === 1) {
      result.set(entry.id, 50);
      continue;
    }
    const less = values.filter((candidate) => candidate.transformed < entry.transformed).length;
    const equal = values.filter((candidate) => candidate.transformed === entry.transformed).length;
    result.set(entry.id, 100 * (less + (equal - 1) / 2) / (values.length - 1));
  }
  return result;
}

function weightedSummary(items) {
  const available = items.filter((item) => item.score !== null);
  const fullWeight = items.reduce((sum, item) => sum + item.weight, 0);
  const availableWeight = available.reduce((sum, item) => sum + item.weight, 0);
  const weightedPoints = available.reduce((sum, item) => sum + item.weight * item.score / 100, 0);
  return {
    score: availableWeight ? 100 * weightedPoints / availableWeight : null,
    availableWeight,
    fullWeight,
    coverage: fullWeight ? availableWeight / fullWeight : 0,
    weightedPoints,
  };
}

function confidenceForCoverage(coverage) {
  if (coverage >= 0.85) return "High";
  if (coverage >= 0.70) return "Medium";
  if (coverage >= 0.55) return "Low";
  return "Insufficient";
}

function addItem(items, {
  code,
  component,
  weight,
  score,
  sourceUrl = "",
  sourceValue = "",
  missingReason = "Not verified or not collected",
}) {
  const normalized = numeric(score);
  items.push({
    code,
    component,
    weight,
    score: normalized,
    sourceUrl,
    sourceValue,
    availability: normalized === null ? "Missing" : "Available",
    missingReason: normalized === null ? missingReason : "",
  });
}

function manualScore(manual, field, sourceField) {
  if (normalizeChoice(manual["Illustrative Scoring Values"]) === "yes") {
    return { score: null, reason: "Illustrative scoring values are excluded" };
  }
  const score = numeric(manual[field]);
  if (score === null) return { score: null, reason: "Manual normalized score not completed" };
  if (sourceField && isBlank(manual[sourceField])) {
    return { score: null, reason: "Score has no verified source URL" };
  }
  return { score, reason: "" };
}

function addManualItem(items, manual, field, sourceField, code, component, weight) {
  const result = manualScore(manual, field, sourceField);
  addItem(items, {
    code,
    component,
    weight,
    score: result.score,
    sourceUrl: cleanText(manual[sourceField]),
    sourceValue: isBlank(manual[field]) ? "" : manual[field],
    missingReason: result.reason,
  });
}

function createBaseManualRow(selection, verification, existing = {}) {
  const id = Number(selection.ID);
  const override = CRITICAL_OVERRIDES.get(id);
  const base = Object.fromEntries(MANUAL_COLUMNS.map((column) => [column, ""]));
  Object.assign(base, {
    ID: id,
    Institution: selection.Institution,
    Program: selection.Program,
    "Program Type": "unclassified",
    "Route Classification Verified": "review",
    "Source Spillover Reviewed": "review",
    "Eligibility Status": override ? "blocked" : "review",
    "Critical Warning": override ? "yes" : "no",
    "Illustrative Scoring Values": "no",
    "Critical Override Cleared": "no",
    "Eligibility Evidence URL": verification?.["Official Program URL"] ?? selection["Program URL"] ?? "",
    "Review Notes": override ?? "",
    "AASHE Scope Applicable": "review",
    "UN PRME Scope Applicable": "review",
  });
  for (const column of MANUAL_COLUMNS) {
    if (Object.hasOwn(existing, column) && !isBlank(existing[column])) base[column] = existing[column];
  }
  base.ID = id;
  base.Institution = selection.Institution;
  base.Program = selection.Program;
  return base;
}

function hardGate(program, manual, verification) {
  const reasons = [];
  const id = Number(program.ID);
  const type = normalizeChoice(manual["Program Type"]);
  const override = CRITICAL_OVERRIDES.get(id);
  const overrideCleared =
    normalizeChoice(manual["Critical Override Cleared"]) === "yes" &&
    normalizeChoice(manual["Eligibility Status"]) === "eligible" &&
    !isBlank(manual["Eligibility Evidence URL"]);
  if (override && !overrideCleared) reasons.push(override);
  if (!["research", "taught"].includes(type)) reasons.push("Program type is not manually classified as research or taught.");
  if (normalizeChoice(manual["Route Classification Verified"]) !== "yes") reasons.push("Route classification has not been verified.");
  if (normalizeChoice(manual["Source Spillover Reviewed"]) !== "yes") reasons.push("Extraction spillover review is incomplete.");
  if (normalizeChoice(manual["Eligibility Status"]) !== "eligible") reasons.push("Graduate-program eligibility is not marked eligible.");
  if (normalizeChoice(manual["Critical Warning"]) === "yes" && !(override && overrideCleared)) reasons.push("A critical warning remains open.");
  if (normalizeChoice(manual["Illustrative Scoring Values"]) === "yes") reasons.push("Illustrative scoring values are present.");
  if (cleanText(verification?.["Verification Status"]) !== "Confirmed") reasons.push("Source workbook programme verification is not Confirmed.");
  if (isBlank(manual["Eligibility Evidence URL"])) reasons.push("No eligibility evidence URL is recorded.");
  return { eligible: reasons.length === 0, reasons, track: ["research", "taught"].includes(type) ? type : null };
}

function inferProvisionalRoute(manual, verification, detail) {
  const manualType = normalizeChoice(manual["Program Type"]);
  const manualVerified = normalizeChoice(manual["Route Classification Verified"]) === "yes";
  if (["research", "taught"].includes(manualType)) {
    return {
      track: manualType,
      status: manualVerified ? "manually-verified" : "manual-provisional",
      confidence: manualVerified ? "high" : "medium",
      basis: manualVerified
        ? "Manual route classification verified from the recorded official source."
        : "Manual route classification is present but not yet marked verified.",
    };
  }

  const matchType = normalizeChoice(verification?.["Match Type"]);
  if (matchType === "research") {
    return {
      track: "research",
      status: "rule-based-provisional",
      confidence: "high",
      basis: "Program Verification Match Type is Research.",
    };
  }

  const thesisEvidence = cleanText(detail?.["Thesis Evidence"]);
  const curriculum = cleanText(detail?.["Curriculum Focus"]);
  const capstone = cleanText(detail?.["Capstone/Project"]);
  const evidence = `${thesisEvidence} ${curriculum} ${capstone}`.toLowerCase();
  const optionalOnly = /\boptional\b.{0,80}\b(?:thesis|research stream)\b|\b(?:thesis|research stream)\b.{0,80}\boptional\b/i.test(evidence);
  const researchSignal =
    /\bcompulsory\b.{0,80}\bthesis\b|\bthesis\b.{0,80}\bcompulsory\b/i.test(evidence) ||
    /\brequired\b.{0,80}\bthesis\b|\bthesis\b.{0,80}\brequired\b/i.test(evidence) ||
    /\bresearch degree\b|\bindividual research project\b|\boriginal piece of research\b/i.test(evidence) ||
    /\bpresentation and defen[cs]e of a thesis\b|\bcomplete a dissertation\b/i.test(evidence) ||
    /\bmaster'?s thesis\b/i.test(evidence);
  if (researchSignal && !optionalOnly) {
    return {
      track: "research",
      status: "rule-based-provisional",
      confidence: "medium",
      basis: "Official extracted evidence contains a required/substantial thesis or original research signal.",
    };
  }

  return {
    track: "taught",
    status: "rule-based-provisional",
    confidence: "low",
    basis: "No verified research-route signal was found; temporarily classified as taught/professional.",
  };
}

function provisionalGate(program, manual, verification) {
  const reasons = [];
  const id = Number(program.ID);
  const override = CRITICAL_OVERRIDES.get(id);
  const overrideCleared =
    normalizeChoice(manual["Critical Override Cleared"]) === "yes" &&
    normalizeChoice(manual["Eligibility Status"]) === "eligible" &&
    !isBlank(manual["Eligibility Evidence URL"]);
  if (override && !overrideCleared) reasons.push(override);
  if (cleanText(verification?.["Verification Status"]) !== "Confirmed") {
    reasons.push("A qualifying current graduate programme is not confirmed.");
  }
  if (/^no directly qualifying/i.test(cleanText(program.Program))) {
    reasons.push("The retained record explicitly states that no directly qualifying programme was confirmed.");
  }
  if (normalizeChoice(manual["Illustrative Scoring Values"]) === "yes") {
    reasons.push("Illustrative scoring values are present.");
  }
  if (normalizeChoice(manual["Critical Warning"]) === "yes" && !(override && overrideCleared)) {
    reasons.push("A critical programme-eligibility warning remains open.");
  }
  if (isBlank(verification?.["Official Program URL"]) && isBlank(manual["Eligibility Evidence URL"])) {
    reasons.push("No official programme evidence URL is recorded.");
  }
  return { eligible: reasons.length === 0, reasons };
}

function prmeScore(row, manual) {
  if (!row || normalizeChoice(manual["UN PRME Scope Applicable"]) !== "yes") return null;
  if (!cleanText(row["PRME Match Status"]).startsWith("Verified")) return null;
  const status = normalizeChoice(row["PRME Status"]);
  const recent = numeric(row["Recent SIP Count (2022-2026)"], 0, Number.MAX_SAFE_INTEGER) ?? 0;
  if (status.includes("communicating") && !status.includes("non-communicating")) return recent > 0 ? 100 : 80;
  return 40;
}

function aasheScore(row, manual) {
  if (!row || normalizeChoice(manual["AASHE Scope Applicable"]) !== "yes") return null;
  const score = numeric(row.Score);
  if (score !== null) return score;
  const ratingMap = { reporter: 40, bronze: 55, silver: 70, gold: 85, platinum: 100 };
  return ratingMap[normalizeChoice(row.Rating)] ?? null;
}

function componentDefinitions(track) {
  if (track === "research") {
    return [
      ["Institution Strength", 30],
      ["Research Environment", 25],
      ["Program Research Design", 15],
      ["Entry Requirement Selectivity", 10],
      ["English Requirement", 10],
      ["Sustainability Engagement", 10],
    ];
  }
  return [
    ["Institution Strength", 30],
    ["Curriculum and Professional Relevance", 20],
    ["Experiential Learning", 15],
    ["Entry Requirement Selectivity", 10],
    ["English Requirement", 10],
    ["Delivery and Duration Flexibility", 5],
    ["Career Outcome Evidence", 5],
    ["Sustainability Engagement", 5],
  ];
}

function runModelSelfTests() {
  const manual = Object.fromEntries(MANUAL_COLUMNS.map((column) => [column, ""]));
  for (const column of SCORE_COLUMNS) manual[column] = 50;
  for (const column of MANUAL_COLUMNS.filter((column) => column.includes("URL"))) {
    manual[column] = "https://example.edu/verified-source";
  }
  Object.assign(manual, {
    "Illustrative Scoring Values": "no",
    "English Clarity Points (0-40)": 20,
    "AASHE Scope Applicable": "yes",
    "UN PRME Scope Applicable": "yes",
  });
  const seriesEntry = {
    score: 50,
    yearsAvailable: 5,
    latestEdition: 2026,
    latestRank: "101",
    observations: [{ score: 50, officialRankingPage: "https://example.edu/ranking" }],
  };
  const series = {
    qsWorld: seriesEntry,
    theWorld: seriesEntry,
    qsSustainability: seriesEntry,
    theImpact: seriesEntry,
  };
  const aashe = { Score: 85, "AASHE Profile URL": "https://example.edu/aashe" };
  const prme = {
    "PRME Match Status": "Verified - Exact",
    "PRME Status": "Communicating Signatory",
    "Recent SIP Count (2022-2026)": 1,
    "Signatory URL": "https://example.edu/prme",
  };
  const openAlex = {
    "Collection Status": "Collected",
    "Match Status": "Verified",
    "Match Score": 100,
    "Keyword Works 2021-2025": 10,
    "All-time H-index": 20,
    "Top-25 Citations": 30,
    "Works Query URL": "https://example.edu/openalex",
    "Institution Search URL": "https://example.edu/openalex-institution",
  };
  const openAlexPercentiles = {
    works: new Map([[1, 50]]),
    hIndex: new Map([[1, 50]]),
    citations: new Map([[1, 50]]),
  };
  const researchItems = buildItems({ id: 1, track: "research", manual, series, aashe, prme, openAlex, openAlexPercentiles });
  const taughtItems = buildItems({ id: 1, track: "taught", manual, series, aashe, prme, openAlex, openAlexPercentiles });
  const researchWeight = researchItems.reduce((sum, item) => sum + item.weight, 0);
  const taughtWeight = taughtItems.reduce((sum, item) => sum + item.weight, 0);
  const researchCoverage = weightedSummary(researchItems).availableWeight;
  const taughtCoverage = weightedSummary(taughtItems).availableWeight;
  const result = {
    researchWeightsSumTo100: Math.abs(researchWeight - 100) < 1e-9,
    taughtWeightsSumTo100: Math.abs(taughtWeight - 100) < 1e-9,
    completeResearchFixtureHas100Coverage: Math.abs(researchCoverage - 100) < 1e-9,
    completeTaughtFixtureHas100Coverage: Math.abs(taughtCoverage - 100) < 1e-9,
  };
  if (Object.values(result).some((value) => !value)) throw new Error(`Model self-test failed: ${JSON.stringify(result)}`);
  return result;
}

function buildItems({
  id,
  track,
  manual,
  series,
  aashe,
  prme,
  openAlex,
  openAlexPercentiles,
}) {
  const items = [];
  for (const [code, label] of [
    ["qsWorld", "QS World University Rankings"],
    ["theWorld", "THE World University Rankings"],
    ["qsSustainability", "QS Sustainability Rankings"],
    ["theImpact", "THE Impact Rankings"],
  ]) {
    const current = series[code];
    addItem(items, {
      code,
      component: "Institution Strength",
      weight: 7.5,
      score: current.score,
      sourceUrl: current.observations.findLast((row) => row.score !== null)?.officialRankingPage ?? "",
      sourceValue: current.latestEdition ? `${current.latestEdition}: ${current.latestRank}; ${current.yearsAvailable} available year(s)` : "",
      missingReason: "No available verified ranking edition",
    });
  }

  if (!track) return items;

  if (track === "research") {
    const oaVerified =
      cleanText(openAlex?.["Collection Status"]) === "Collected" &&
      cleanText(openAlex?.["Match Status"]) === "Verified";
    const oaSource = cleanText(openAlex?.["Works Query URL"]) || cleanText(openAlex?.["Institution Search URL"]);
    addItem(items, {
      code: "openalexWorks",
      component: "Research Environment",
      weight: 10,
      score: oaVerified ? openAlexPercentiles.works.get(id) ?? null : null,
      sourceUrl: oaSource,
      sourceValue: oaVerified ? openAlex?.["Keyword Works 2021-2025"] : "",
      missingReason: "OpenAlex collection or institutional match is incomplete",
    });
    addItem(items, {
      code: "openalexHIndex",
      component: "Research Environment",
      weight: 5,
      score: oaVerified ? openAlexPercentiles.hIndex.get(id) ?? null : null,
      sourceUrl: oaSource,
      sourceValue: oaVerified ? openAlex?.["All-time H-index"] : "",
      missingReason: "Verified OpenAlex H-index is unavailable",
    });
    addItem(items, {
      code: "openalexCitations",
      component: "Research Environment",
      weight: 5,
      score: oaVerified ? openAlexPercentiles.citations.get(id) ?? null : null,
      sourceUrl: oaSource,
      sourceValue: oaVerified ? openAlex?.["Top-25 Citations"] : "",
      missingReason: "Verified OpenAlex citation evidence is unavailable",
    });
    const relevance = manualScore(manual, "OpenAlex Top-Work Relevance Score", "OpenAlex Relevance Source URL");
    addItem(items, {
      code: "openalexRelevance",
      component: "Research Environment",
      weight: 4,
      score: oaVerified ? relevance.score : null,
      sourceUrl: cleanText(manual["OpenAlex Relevance Source URL"]),
      sourceValue: manual["OpenAlex Top-Work Relevance Score"],
      missingReason: oaVerified ? relevance.reason : "OpenAlex record is not verified and collected",
    });
    addItem(items, {
      code: "openalexMatchConfidence",
      component: "Research Environment",
      weight: 1,
      score: oaVerified ? numeric(openAlex?.["Match Score"]) : null,
      sourceUrl: cleanText(openAlex?.["Institution Search URL"]),
      sourceValue: oaVerified ? openAlex?.["Match Score"] : "",
      missingReason: "Verified OpenAlex match confidence is unavailable",
    });

    addManualItem(items, manual, "Research Thesis / Original Research Score", "Research Design Source URL", "researchThesis", "Program Research Design", 6);
    addManualItem(items, manual, "Research Methods Score", "Research Design Source URL", "researchMethods", "Program Research Design", 3);
    addManualItem(items, manual, "Supervisor / Lab Fit Score", "Research Design Source URL", "supervisorFit", "Program Research Design", 3);
    addManualItem(items, manual, "Research Fieldwork / Capstone Score", "Research Design Source URL", "researchFieldwork", "Program Research Design", 3);

    addManualItem(items, manual, "Entry Academic Threshold Score", "Entry Source URL", "entryAcademic", "Entry Requirement Selectivity", 3.5);
    addManualItem(items, manual, "Entry Relevant Background Score", "Entry Source URL", "entryBackground", "Entry Requirement Selectivity", 2);
    addManualItem(items, manual, "Entry Route-Specific Requirement Score", "Entry Source URL", "entryRoute", "Entry Requirement Selectivity", 2.5);
    addManualItem(items, manual, "Entry Supporting Documents Score", "Entry Source URL", "entryDocuments", "Entry Requirement Selectivity", 1);
    addManualItem(items, manual, "Entry Clarity / Recency Score", "Entry Source URL", "entryClarity", "Entry Requirement Selectivity", 1);
  } else {
    addManualItem(items, manual, "Curriculum Core Score", "Curriculum Source URL", "curriculumCore", "Curriculum and Professional Relevance", 7);
    addManualItem(items, manual, "Curriculum Interdisciplinary Score", "Curriculum Source URL", "curriculumInterdisciplinary", "Curriculum and Professional Relevance", 4);
    addManualItem(items, manual, "Curriculum Depth Score", "Curriculum Source URL", "curriculumDepth", "Curriculum and Professional Relevance", 5);
    addManualItem(items, manual, "Curriculum Breadth Score", "Curriculum Source URL", "curriculumBreadth", "Curriculum and Professional Relevance", 4);

    addManualItem(items, manual, "Capstone / Consultancy Score", "Experiential Source URL", "capstone", "Experiential Learning", 5.25);
    addManualItem(items, manual, "Internship / Fieldwork Score", "Experiential Source URL", "internship", "Experiential Learning", 5.25);
    addManualItem(items, manual, "External Engagement Score", "Experiential Source URL", "externalEngagement", "Experiential Learning", 3);
    addManualItem(items, manual, "Practice Portfolio Score", "Experiential Source URL", "portfolio", "Experiential Learning", 1.5);

    addManualItem(items, manual, "Entry Academic Threshold Score", "Entry Source URL", "entryAcademic", "Entry Requirement Selectivity", 4);
    addManualItem(items, manual, "Entry Relevant Background Score", "Entry Source URL", "entryBackground", "Entry Requirement Selectivity", 2);
    addManualItem(items, manual, "Entry Route-Specific Requirement Score", "Entry Source URL", "entryRoute", "Entry Requirement Selectivity", 2);
    addManualItem(items, manual, "Entry Supporting Documents Score", "Entry Source URL", "entryDocuments", "Entry Requirement Selectivity", 1);
    addManualItem(items, manual, "Entry Clarity / Recency Score", "Entry Source URL", "entryClarity", "Entry Requirement Selectivity", 1);

    addManualItem(items, manual, "Full-Time and Part-Time Score", "Delivery Source URL", "deliveryAttendance", "Delivery and Duration Flexibility", 1.25);
    addManualItem(items, manual, "Online / Hybrid Score", "Delivery Source URL", "deliveryMode", "Delivery and Duration Flexibility", 1.25);
    addManualItem(items, manual, "Published Duration Score", "Delivery Source URL", "deliveryDuration", "Delivery and Duration Flexibility", 1.25);
    addManualItem(items, manual, "Multiple Entry Points Score", "Delivery Source URL", "deliveryEntryPoints", "Delivery and Duration Flexibility", 1.25);

    addManualItem(items, manual, "Placement / Destination Evidence Score", "Career Source URL", "careerPlacement", "Career Outcome Evidence", 1.25);
    addManualItem(items, manual, "Class / Cohort Outcome Score", "Career Source URL", "careerCohort", "Career Outcome Evidence", 1.25);
    addManualItem(items, manual, "Employer / Sector Evidence Score", "Career Source URL", "careerEmployer", "Career Outcome Evidence", 1.25);
    addManualItem(items, manual, "Accreditation / Career Pathway Score", "Career Source URL", "careerPathway", "Career Outcome Evidence", 1.25);
  }

  const claritySource = cleanText(manual["English Source URL"]);
  const clarityValue = numeric(manual["English Clarity Points (0-40)"], 0, 40);
  const englishClarity = normalizeChoice(manual["Illustrative Scoring Values"]) === "yes"
    ? { score: null, reason: "Illustrative scoring values are excluded" }
    : isBlank(claritySource)
      ? { score: null, reason: "Score has no verified source URL" }
      : clarityValue === null
        ? { score: null, reason: "Manual clarity points not completed or outside 0-40" }
        : { score: clarityValue, reason: "" };
  addItem(items, {
    code: "englishClarity",
    component: "English Requirement",
    weight: 4,
    score: englishClarity.score === null ? null : 100 * englishClarity.score / 40,
    sourceUrl: cleanText(manual["English Source URL"]),
    sourceValue: manual["English Clarity Points (0-40)"],
    missingReason: englishClarity.reason,
  });
  addManualItem(items, manual, "English Threshold Score (0-100)", "English Source URL", "englishThreshold", "English Requirement", 6);

  const engagementWeight = track === "research" ? 5 : 2.5;
  addItem(items, {
    code: "aashe",
    component: "Sustainability Engagement",
    weight: engagementWeight,
    score: aasheScore(aashe, manual),
    sourceUrl: cleanText(aashe?.["AASHE Profile URL"]) || cleanText(aashe?.["Source URL"]),
    sourceValue: cleanText(aashe?.Rating),
    missingReason: "No verified applicable current AASHE scope and rating",
  });
  addItem(items, {
    code: "prme",
    component: "Sustainability Engagement",
    weight: engagementWeight,
    score: prmeScore(prme, manual),
    sourceUrl: cleanText(prme?.["Signatory URL"]) || cleanText(prme?.["Source URL"]),
    sourceValue: cleanText(prme?.["PRME Status"]),
    missingReason: "No verified applicable UN PRME record for the programme's school",
  });

  return items;
}

function styleTitle(sheet, title, note, columns) {
  const last = columnLetter(columns - 1);
  sheet.mergeCells(`A1:${last}1`);
  sheet.mergeCells(`A2:${last}2`);
  sheet.getRange("A1").values = [[title]];
  sheet.getRange("A2").values = [[note]];
  sheet.getRange(`A1:${last}1`).format = {
    fill: COLORS.navy,
    font: { bold: true, color: COLORS.white, size: 15 },
    verticalAlignment: "center",
  };
  sheet.getRange(`A2:${last}2`).format = {
    fill: COLORS.lightBlue,
    font: { italic: true, color: COLORS.text, size: 10 },
    verticalAlignment: "center",
    wrapText: true,
  };
  sheet.getRange("A1").format.rowHeight = 28;
  sheet.getRange("A2").format.rowHeight = 34;
  sheet.showGridLines = false;
}

function writeTableSheet(sheet, {
  title,
  note,
  headers,
  rows,
  widths,
  tableName,
  headerFill = COLORS.teal,
  rowHeight = 24,
}) {
  styleTitle(sheet, title, note, headers.length);
  sheet.getRangeByIndexes(3, 0, 1, headers.length).values = [headers];
  if (rows.length) sheet.getRangeByIndexes(4, 0, rows.length, headers.length).values = rows;
  const last = columnLetter(headers.length - 1);
  const lastRow = rows.length + 4;
  sheet.getRange(`A4:${last}4`).format = {
    fill: headerFill,
    font: { bold: true, color: COLORS.white, size: 9 },
    horizontalAlignment: "center",
    verticalAlignment: "center",
    wrapText: true,
  };
  if (rows.length) {
    sheet.getRange(`A5:${last}${lastRow}`).format = {
      font: { color: COLORS.text, size: 9 },
      verticalAlignment: "top",
      wrapText: true,
      borders: { insideHorizontal: { style: "thin", color: COLORS.border } },
    };
    for (let row = 5; row <= lastRow; row += 2) sheet.getRange(`A${row}:${last}${row}`).format.fill = COLORS.paleBlue;
    sheet.getRange(`A5:${last}${lastRow}`).format.rowHeight = rowHeight;
    const table = sheet.tables.add(`A4:${last}${lastRow}`, true, tableName);
    table.style = "TableStyleLight9";
  }
  sheet.getRange(`A4:${last}4`).format.rowHeight = 38;
  widths.forEach((width, index) => {
    sheet.getRangeByIndexes(0, index, Math.max(lastRow, 5), 1).format.columnWidth = width;
  });
  sheet.freezePanes.freezeRows(4);
}

async function loadExistingManual() {
  try {
    await fs.access(manualPath);
  } catch {
    return new Map();
  }
  const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(manualPath));
  const values = workbook.worksheets.getItem("Manual Inputs").getUsedRange()?.values ?? [];
  return byId(objectsFromValues(values));
}

async function buildManualWorkbook(manualRows) {
  const workbook = Workbook.create();
  const inputs = workbook.worksheets.add("Manual Inputs");
  const rows = manualRows.map((row) => MANUAL_COLUMNS.map((column) => row[column] ?? ""));
  writeTableSheet(inputs, {
    title: "Programme Scoring Manual Inputs",
    note: "Complete only from verified official sources. Blank scores remain missing. IDs 61 and 73 stay blocked unless corrected graduate-program evidence is recorded and the override is explicitly cleared.",
    headers: MANUAL_COLUMNS,
    rows,
    widths: MANUAL_COLUMNS.map((column) => {
      if (column === "ID") return 8;
      if (["Institution", "Program"].includes(column)) return column === "Program" ? 42 : 30;
      if (column.includes("URL")) return 46;
      if (column.includes("Notes")) return 48;
      return column.includes("Score") || column.includes("Points") ? 16 : 19;
    }),
    tableName: "ManualInputsTable",
    rowHeight: 42,
  });
  inputs.freezePanes.freezeColumns(3);

  const categorical = {
    "Program Type": ["unclassified", "research", "taught", "mixed"],
    "Route Classification Verified": ["review", "yes", "no"],
    "Source Spillover Reviewed": ["review", "yes", "no"],
    "Eligibility Status": ["review", "eligible", "blocked"],
    "Critical Warning": ["no", "yes"],
    "Illustrative Scoring Values": ["no", "yes"],
    "Critical Override Cleared": ["no", "yes"],
    "AASHE Scope Applicable": ["review", "yes", "no"],
    "UN PRME Scope Applicable": ["review", "yes", "no"],
  };
  for (const [column, values] of Object.entries(categorical)) {
    const index = MANUAL_COLUMNS.indexOf(column);
    inputs.getRangeByIndexes(4, index, manualRows.length, 1).dataValidation = { rule: { type: "list", values } };
  }
  for (const column of SCORE_COLUMNS) {
    const index = MANUAL_COLUMNS.indexOf(column);
    inputs.getRangeByIndexes(4, index, manualRows.length, 1).dataValidation = {
      rule: { type: "decimal", operator: "between", formula1: 0, formula2: 100 },
    };
    inputs.getRangeByIndexes(4, index, manualRows.length, 1).format.numberFormat = "0.0";
  }
  const clarityIndex = MANUAL_COLUMNS.indexOf("English Clarity Points (0-40)");
  inputs.getRangeByIndexes(4, clarityIndex, manualRows.length, 1).dataValidation = {
    rule: { type: "decimal", operator: "between", formula1: 0, formula2: 40 },
  };
  inputs.getRangeByIndexes(4, clarityIndex, manualRows.length, 1).format.numberFormat = "0.0";

  const guide = workbook.worksheets.add("Rubric Guide");
  const guideHeaders = ["Input Group", "Field / Rule", "Allowed Value or Scale", "How to Complete", "Publication Effect"];
  const guideRows = [
    ["Eligibility", "Program Type", "research / taught / mixed / unclassified", "Manually classify the route from the official programme structure. Mixed and unclassified routes are not ranked.", "Hard gate"],
    ["Eligibility", "Route Classification Verified", "yes / no / review", "Use yes only after checking whether the specific route is research-oriented or taught/professional.", "Hard gate"],
    ["Eligibility", "Source Spillover Reviewed", "yes / no / review", "Confirm duration, mode, requirements, and curriculum text belong to this programme rather than a neighbouring page section.", "Hard gate"],
    ["Eligibility", "Eligibility Status", "eligible / review / blocked", "Eligible means a current graduate programme is confirmed by an official source.", "Hard gate"],
    ["Eligibility", "Illustrative Scoring Values", "no / yes", "Any simulated or realistic-looking placeholder score must be marked yes and is excluded.", "Hard gate"],
    ["Research Design", "Four research criteria", "0-100 with official source URL", "Required thesis/original research has 40% of the component; methods, supervisor fit, and fieldwork/research capstone each have 20%.", "Research track only"],
    ["Curriculum", "Four curriculum criteria", "0-100 with official source URL", "Core 35%, interdisciplinary 20%, methods/depth 25%, breadth/applied topics 20%.", "Taught track only"],
    ["Experiential", "Four experiential criteria", "0-100 with official source URL", "Capstone 35%, internship/fieldwork 35%, external engagement 20%, portfolio 10%. Unknown remains blank.", "Taught track only"],
    ["Entry", "Academic threshold", "0-100 country-aware score", "Use 50 for standard bachelor's/no threshold, 65 for about UK 2:2, 80 for about UK 2:1, and 95 for first-class/GPA 3.3+ only after documented equivalence.", "Both tracks"],
    ["Entry", "Route-specific requirement", "0-100", "Research: proposal/supervisor fit. Taught: work experience/portfolio/professional background.", "Both tracks"],
    ["English", "Clarity Points", "0-40", "40 exact test/overall/components/current source; 30 exact overall/current source; 15 generic proof statement; blank if not captured.", "Both tracks"],
    ["English", "Threshold Score", "0-100", "Manually map one canonical verified IELTS/TOEFL threshold using the methodology; do not parse raw text automatically.", "Both tracks"],
    ["AASHE", "Scope Applicable", "yes / no / review", "Yes only when the current record applies to the ranked institution/campus.", "Missing unless yes"],
    ["UN PRME", "Scope Applicable", "yes / no / review", "Yes only when an institution-wide record applies or the programme belongs to the matched school.", "Missing unless yes"],
    ["OpenAlex", "Top-Work Relevance", "0-100 with evidence URL", "Review the top matching work and institutional match. API gaps remain missing.", "Research track only"],
    ["Publication", "Coverage treatment", "85 High; 70 Medium; 55 Low; below 55 Limited", "Coverage controls the evidence-confidence label but no longer blocks a provisional rank. Critical programme-eligibility warnings still exclude records.", "Provisional ranking"],
    ["Reddit", "Academic score", "Excluded", "Reddit sentiment and discussion volume stay outside programme quality rankings.", "No effect"],
  ];
  writeTableSheet(guide, {
    title: "Scoring Rubric and Publication Gates",
    note: `Method ${METHOD_VERSION}, ${METHOD_DATE}. Scores without a verified source URL do not count as available evidence.`,
    headers: guideHeaders,
    rows: guideRows,
    widths: [18, 32, 28, 72, 24],
    tableName: "RubricGuideTable",
    headerFill: COLORS.blue,
    rowHeight: 46,
  });

  const output = await SpreadsheetFile.exportXlsx(workbook);
  await output.save(manualPath);
  return workbook;
}

function publicStatus(gate, coverage) {
  if (!gate.track) return "Unclassified - no score or rank";
  if (!gate.eligible) return "Blocked - internal review only";
  if (coverage < 0.55) return "Insufficient - do not publish score";
  if (coverage < 0.70) return "Provisional - score only, no ordinal rank";
  if (coverage < 0.85) return "Publishable - medium confidence";
  return "Publishable - high confidence";
}

function provisionalPublicStatus(gate, coverage) {
  if (!gate.eligible) return "Excluded - programme eligibility issue";
  if (coverage >= 0.85) return "Published provisional ranking - high evidence coverage";
  if (coverage >= 0.70) return "Published provisional ranking - medium evidence coverage";
  if (coverage >= 0.55) return "Published provisional ranking - low evidence coverage";
  return "Published provisional ranking - limited evidence coverage";
}

function assignRanks(programs) {
  for (const track of ["research", "taught"]) {
    const eligible = programs
      .filter((row) => row.strictTrack === track && row.gateEligible && row.coverage >= 0.70 && row.finalScore !== null)
      .sort((a, b) =>
        b.finalScore - a.finalScore ||
        b.coverage - a.coverage ||
        (b.trackProgramScore ?? -1) - (a.trackProgramScore ?? -1) ||
        a.institution.localeCompare(b.institution),
      );
    let index = 0;
    while (index < eligible.length) {
      const leader = eligible[index];
      let end = index + 1;
      while (end < eligible.length && leader.finalScore - eligible[end].finalScore <= 0.5) end += 1;
      const rank = index + 1;
      for (let cursor = index; cursor < end; cursor += 1) {
        eligible[cursor].rank = rank;
        eligible[cursor].rankGroupSize = end - index;
      }
      index = end;
    }
  }
}

function assignProvisionalRanks(programs) {
  for (const track of ["research", "taught"]) {
    const eligible = programs
      .filter((row) =>
        row.track === track &&
        row.provisionalEligible &&
        row.provisionalScore !== null
      )
      .sort((a, b) =>
        b.provisionalScore - a.provisionalScore ||
        b.coverage - a.coverage ||
        (b.trackProgramScore ?? -1) - (a.trackProgramScore ?? -1) ||
        a.institution.localeCompare(b.institution),
      );
    let index = 0;
    while (index < eligible.length) {
      const leader = eligible[index];
      let end = index + 1;
      while (
        end < eligible.length &&
        leader.provisionalScore - eligible[end].provisionalScore <= 0.5
      ) {
        end += 1;
      }
      const rank = index + 1;
      for (let cursor = index; cursor < end; cursor += 1) {
        eligible[cursor].provisionalRank = rank;
        eligible[cursor].provisionalRankGroupSize = end - index;
      }
      index = end;
    }
  }
}

function scoreProgramme({
  selection,
  verification,
  detail,
  manual,
  seriesRows,
  aashe,
  prme,
  openAlex,
  openAlexPercentiles,
}) {
  const id = Number(selection.ID);
  const gate = hardGate(selection, manual, verification);
  const provisionalEligibility = provisionalGate(selection, manual, verification);
  const route = inferProvisionalRoute(manual, verification, detail);
  const series = {
    qsWorld: fiveYearSeries(seriesRows.qsWorld, id, "QS World University Rankings"),
    theWorld: fiveYearSeries(seriesRows.theWorld, id, "THE World University Rankings"),
    qsSustainability: fiveYearSeries(seriesRows.qsSustainability, id, "QS Sustainability Rankings"),
    theImpact: fiveYearSeries(seriesRows.theImpact, id, "THE Impact Rankings"),
  };
  const strictTrack = gate.track;
  const track = route.track;
  const items = buildItems({ id, track, manual, series, aashe, prme, openAlex, openAlexPercentiles });
  const total = weightedSummary(items);
  const coverage = total.availableWeight / 100;
  const observedScore = total.availableWeight ? 100 * total.weightedPoints / total.availableWeight : null;
  const draftScore = observedScore === null ? null : coverage * observedScore + (1 - coverage) * 50;
  const components = {};
  const definitions = track ? componentDefinitions(track) : [["Institution Strength", 30]];
  for (const [component, weight] of definitions) {
    const summary = weightedSummary(items.filter((item) => item.component === component));
    components[component] = {
      score: round(summary.score),
      weight: weight / 100,
      coverage: round(summary.coverage, 3),
      availableWeight: round(summary.availableWeight, 2),
    };
  }
  const trackComponents = track === "research"
    ? ["Research Environment", "Program Research Design"]
    : track === "taught"
      ? ["Curriculum and Professional Relevance", "Experiential Learning", "Delivery and Duration Flexibility", "Career Outcome Evidence"]
      : [];
  const trackProgram = weightedSummary(items.filter((item) => trackComponents.includes(item.component)));
  const finalScore = gate.eligible && coverage >= 0.55 ? round(draftScore) : null;
  const provisionalScore =
    provisionalEligibility.eligible && draftScore !== null ? round(draftScore) : null;
  const provisionalWarnings = [];
  if (route.status !== "manually-verified") {
    provisionalWarnings.push(`Programme route is ${route.status}: ${route.basis}`);
  }
  if (coverage < 0.55) {
    provisionalWarnings.push(
      "Evidence coverage is below 55%; the provisional order is strongly influenced by neutral shrinkage and Institution Strength.",
    );
  }
  if (normalizeChoice(manual["Source Spillover Reviewed"]) !== "yes") {
    provisionalWarnings.push("Extraction spillover review is incomplete.");
  }
  if (["best-fit", "restricted", "major"].includes(normalizeChoice(verification?.["Match Type"]))) {
    provisionalWarnings.push(`Programme Match Type is ${cleanText(verification?.["Match Type"])}.`);
  }
  const sources = [...new Set([
    cleanText(verification?.["Official Program URL"]),
    ...items.map((item) => item.sourceUrl),
  ].filter(Boolean))];
  return {
    programId: id,
    institution: cleanText(selection.Institution),
    country: cleanText(selection.Country),
    program: cleanText(selection.Program),
    track,
    strictTrack,
    routeClassificationStatus: route.status,
    routeClassificationConfidence: route.confidence,
    routeClassificationBasis: route.basis,
    methodVersion: METHOD_VERSION,
    gateEligible: gate.eligible,
    gateReasons: gate.reasons,
    publicStatus: publicStatus(gate, coverage),
    provisionalEligible: provisionalEligibility.eligible,
    provisionalExclusionReasons: provisionalEligibility.reasons,
    provisionalStatus: provisionalPublicStatus(provisionalEligibility, coverage),
    provisionalWarnings,
    observedScore: round(observedScore),
    draftScore: round(draftScore),
    finalScore,
    provisionalScore,
    coverage: round(coverage, 3),
    confidence: confidenceForCoverage(coverage),
    rank: null,
    rankGroupSize: null,
    provisionalRank: null,
    provisionalRankGroupSize: null,
    trackProgramScore: round(trackProgram.score),
    components,
    items,
    series,
    sources,
  };
}

function resultRows(programs) {
  return programs.map((row) => [
    row.programId,
    row.institution,
    row.country,
    row.program,
    row.track,
    row.routeClassificationStatus,
    row.routeClassificationConfidence,
    row.routeClassificationBasis,
    row.provisionalEligible ? "Yes" : "No",
    row.provisionalStatus,
    row.confidence,
    row.coverage,
    row.observedScore,
    row.provisionalScore,
    row.provisionalRank,
    row.provisionalRankGroupSize,
    row.strictTrack ?? "unclassified",
    row.gateEligible ? "Yes" : "No",
    row.finalScore,
    row.rank,
    row.components["Institution Strength"]?.score ?? null,
    row.components["Research Environment"]?.score ?? null,
    row.components["Program Research Design"]?.score ?? null,
    row.components["Curriculum and Professional Relevance"]?.score ?? null,
    row.components["Experiential Learning"]?.score ?? null,
    row.components["Entry Requirement Selectivity"]?.score ?? null,
    row.components["English Requirement"]?.score ?? null,
    row.components["Delivery and Duration Flexibility"]?.score ?? null,
    row.components["Career Outcome Evidence"]?.score ?? null,
    row.components["Sustainability Engagement"]?.score ?? null,
    row.provisionalWarnings.join(" | "),
    row.provisionalExclusionReasons.join(" | "),
    row.gateReasons.join(" | "),
  ]);
}

async function buildResultsWorkbook(programs, manualRows) {
  const workbook = Workbook.create();
  const release = workbook.worksheets.add("Release Status");
  const scoreSheet = workbook.worksheets.add("Program Scores");
  const componentSheet = workbook.worksheets.add("Component Results");
  const auditSheet = workbook.worksheets.add("Score Audit");
  const seriesSheet = workbook.worksheets.add("Institution Series");
  const inputSheet = workbook.worksheets.add("Manual Inputs Snapshot");
  const methodSheet = workbook.worksheets.add("Method and Gates");

  const counts = new Map();
  for (const program of programs) counts.set(program.publicStatus, (counts.get(program.publicStatus) ?? 0) + 1);
  const releaseHeaders = ["Metric", "Value", "Interpretation", "Required Next Action"];
  const releaseRows = [
    ["Method version", METHOD_VERSION, "Coverage-independent provisional ranking with strict final fields retained separately.", "Label every displayed rank as provisional."],
    ["Programmes loaded", programs.length, "The synchronized QS30 + THE30 sample.", "Must remain 60 unless the sample is intentionally revised."],
    ["Provisional research routes", programs.filter((row) => row.track === "research").length, "Manual classifications are used first; otherwise official-source research signals are applied.", "Manually verify route classifications over time."],
    ["Provisional taught routes", programs.filter((row) => row.track === "taught").length, "No verified research-route signal was found for these records.", "Manually verify route classifications over time."],
    ["Published provisional ranks", programs.filter((row) => row.provisionalRank !== null).length, "Coverage does not block a provisional ordinal rank.", "Always display evidence coverage and provisional label."],
    ["Limited coverage provisional ranks", programs.filter((row) => row.provisionalRank !== null && row.coverage < 0.55).length, "These rankings are driven mainly by currently available institution evidence.", "Complete programme, entry, and English scoring fields."],
    ["Excluded from provisional ranking", programs.filter((row) => !row.provisionalEligible).length, "Critical programme eligibility issues still override publication.", "Correct the programme record before ranking."],
    ["Strictly validated final ranks", programs.filter((row) => row.rank !== null).length, "Original strict gates remain available for a later validated release.", "Complete manual verification and coverage work."],
    ["Alberta and Kyung Hee", programs.filter((row) => [61, 73].includes(row.programId) && !row.provisionalEligible).length, "Critical overrides remain excluded unless corrected graduate-program evidence is recorded.", "Do not clear an override without a replacement official source."],
    ["Reddit in academic score", 0, "Reddit is excluded from programme quality scoring.", "Calibrate and present Reddit separately."],
  ];
  writeTableSheet(release, {
    title: "Programme Ranking Release Status",
    note: "Provisional rankings are published regardless of coverage, but coverage, route status, warnings, and exclusions remain visible. Strict final ranking fields are retained separately.",
    headers: releaseHeaders,
    rows: releaseRows,
    widths: [32, 18, 72, 62],
    tableName: "ReleaseStatusTable",
    headerFill: COLORS.navy,
    rowHeight: 42,
  });

  const scoreHeaders = [
    "ID", "Institution", "Country", "Programme", "Provisional Track", "Route Status",
    "Route Confidence", "Route Basis", "Provisional Eligible", "Provisional Status", "Evidence Confidence",
    "Coverage", "Observed Score", "Published Provisional Score", "Published Provisional Rank",
    "Provisional Rank Group Size", "Strict Track", "Strict Gate Eligible", "Strict Final Score",
    "Strict Final Rank",
    "Institution Strength", "Research Environment", "Program Research Design",
    "Curriculum / Professional Relevance", "Experiential Learning", "Entry Requirement",
    "English Requirement", "Delivery / Duration", "Career Outcome Evidence",
    "Sustainability Engagement", "Provisional Warnings", "Provisional Exclusion Reasons", "Strict Gate Reasons",
  ];
  writeTableSheet(scoreSheet, {
    title: "Programme Scoring Results",
    note: "Published Provisional Score and Rank are available regardless of coverage and remain separated by provisional route. Strict final fields retain the original validation gates.",
    headers: scoreHeaders,
    rows: resultRows(programs),
    widths: [8, 30, 16, 42, 16, 20, 16, 52, 16, 38, 16, 12, 14, 18, 18, 16, 14, 16, 16, 14, 16, 16, 16, 18, 16, 16, 16, 16, 16, 16, 62, 62, 72],
    tableName: "ProgramScoresTable",
    headerFill: COLORS.teal,
    rowHeight: 38,
  });
  scoreSheet.freezePanes.freezeColumns(4);
  scoreSheet.getRange(`L5:L${programs.length + 4}`).format.numberFormat = "0.0%";
  scoreSheet.getRange(`M5:AD${programs.length + 4}`).format.numberFormat = "0.0";

  const componentHeaders = ["ID", "Institution", "Track", "Component", "Full Weight", "Available Weight", "Component Coverage", "Component Score"];
  const componentRows = programs.flatMap((program) =>
    Object.entries(program.components).map(([component, value]) => [
      program.programId,
      program.institution,
      program.track,
      component,
      value.weight,
      value.availableWeight / 100,
      value.coverage,
      value.score,
    ]),
  );
  writeTableSheet(componentSheet, {
    title: "Component-Level Scoring Results",
    note: "Component scores use only available verified subcriteria. Coverage records the share of each component supported by evidence.",
    headers: componentHeaders,
    rows: componentRows,
    widths: [8, 30, 14, 42, 14, 16, 18, 16],
    tableName: "ComponentResultsTable",
    headerFill: COLORS.blue,
  });
  componentSheet.getRange(`E5:G${componentRows.length + 4}`).format.numberFormat = "0.0%";
  componentSheet.getRange(`H5:H${componentRows.length + 4}`).format.numberFormat = "0.0";

  const auditHeaders = ["ID", "Institution", "Track", "Component", "Criterion Code", "Full Weight", "Available Weight", "Score", "Weighted Points", "Availability", "Source Value", "Source URL", "Missing Reason"];
  const auditRows = programs.flatMap((program) =>
    program.items.map((item) => [
      program.programId,
      program.institution,
      program.track,
      item.component,
      item.code,
      item.weight / 100,
      item.score === null ? 0 : item.weight / 100,
      item.score,
      item.score === null ? 0 : item.weight * item.score / 10000,
      item.availability,
      item.sourceValue,
      item.sourceUrl,
      item.missingReason,
    ]),
  );
  writeTableSheet(auditSheet, {
    title: "Subcriterion Scoring Audit",
    note: "Every scored subcriterion shows its weight, source, availability, and missing reason. Available Weight and Weighted Points are zero only as calculation helpers; the Availability field preserves missingness.",
    headers: auditHeaders,
    rows: auditRows,
    widths: [8, 30, 14, 40, 26, 14, 16, 12, 16, 14, 26, 48, 52],
    tableName: "ScoreAuditTable",
    headerFill: COLORS.burgundy,
    rowHeight: 32,
  });
  auditSheet.getRange(`F5:G${auditRows.length + 4}`).format.numberFormat = "0.0%";
  auditSheet.getRange(`H5:H${auditRows.length + 4}`).format.numberFormat = "0.0";
  auditSheet.getRange(`I5:I${auditRows.length + 4}`).format.numberFormat = "0.000";
  auditSheet.freezePanes.freezeColumns(3);

  const seriesHeaders = ["ID", "Institution", "Series", "Series Score", "Years Available", "Latest Edition", "Latest Public Rank", "Observation Audit"];
  const seriesRows = programs.flatMap((program) =>
    Object.values(program.series).map((series) => [
      program.programId,
      program.institution,
      series.label,
      round(series.score),
      series.yearsAvailable,
      series.latestEdition,
      series.latestRank,
      series.observations.map((row) => `${row.edition ?? "?"}:${row.rank}(${row.state})`).join("; "),
    ]),
  );
  writeTableSheet(seriesSheet, {
    title: "Five-Year Institution Ranking Series",
    note: "Exact ranks 1-200 use the documented normalization; bands use midpoints; 200+ and explicit NR score zero; N/P and uncollected states remain missing.",
    headers: seriesHeaders,
    rows: seriesRows,
    widths: [8, 30, 38, 16, 16, 14, 18, 68],
    tableName: "InstitutionSeriesTable",
    headerFill: COLORS.blue,
    rowHeight: 30,
  });
  seriesSheet.getRange(`D5:D${seriesRows.length + 4}`).format.numberFormat = "0.0";

  writeTableSheet(inputSheet, {
    title: "Manual Inputs Snapshot Used in This Run",
    note: "This is a read-only audit snapshot. Edit program_scoring_manual_inputs.xlsx, then rerun the pipeline.",
    headers: MANUAL_COLUMNS,
    rows: manualRows.map((row) => MANUAL_COLUMNS.map((column) => row[column] ?? "")),
    widths: MANUAL_COLUMNS.map((column) => {
      if (column === "ID") return 8;
      if (column === "Program") return 42;
      if (column === "Institution") return 30;
      if (column.includes("URL")) return 46;
      if (column.includes("Notes")) return 48;
      return 18;
    }),
    tableName: "ManualInputsSnapshotTable",
    headerFill: COLORS.teal,
    rowHeight: 38,
  });
  inputSheet.freezePanes.freezeColumns(3);

  const methodHeaders = ["Rule", "Implementation", "Why It Matters"];
  const methodRows = [
    ["Separate tracks", "Research and taught/professional programmes use different weights and separate ordinal rankings.", "The routes serve different goals and are not directly interchangeable."],
    ["Institution Strength", "Four five-year series, each worth 7.5%: QS WUR, THE WUR, QS Sustainability, and THE Impact.", "Institution rank is not labelled as programme rank."],
    ["Rank states", "1-200 normalized; bands use midpoints; 200+ and explicit NR score 0; N/P and uncollected are missing.", "Prevents false exact ranks and false zeroes."],
    ["Neutral missingness", "Final = coverage x observed + (1-coverage) x 50.", "Incomplete records are shrunk toward neutral rather than rewarded or punished as zero."],
    ["Provisional publication", "Every eligible programme receives a coverage-adjusted provisional score and within-track rank regardless of coverage.", "Coverage and warnings must appear beside every provisional rank."],
    ["Strict final publication", "The original >=70% rank threshold and all manual verification gates remain available in separate strict fields.", "The site must not label provisional results as final or validated."],
    ["Hard gates", "Eligibility, route, spillover review, critical warnings, illustrative values, and source verification override coverage.", "A well-covered but invalid programme cannot be ranked."],
    ["AASHE and PRME", "Only applicable verified institutional/school scope counts.", "Campus and business-school evidence is not inherited automatically."],
    ["OpenAlex", "Verified collected records only; log-transformed metrics are percentile-normalized within the collected comparison set.", "Raw institution size does not dominate the research score."],
    ["English", "One manually normalized canonical threshold plus source clarity; raw text is never regex-scored.", "Avoids mixing legacy/new TOEFL scales and waivers."],
    ["Reddit", "Excluded from programme quality scoring.", "Sentiment is a separate community evidence module."],
    ["Tie handling", "Scores within 0.5 points may share a rank; then coverage, track-specific programme score, and institution name order the audit view.", "Avoids false precision."],
  ];
  writeTableSheet(methodSheet, {
    title: "Executable Method and Publication Gates",
    note: `Method ${METHOD_VERSION}, generated ${METHOD_DATE}. Project ranking - not an official QS or THE ranking.`,
    headers: methodHeaders,
    rows: methodRows,
    widths: [28, 76, 70],
    tableName: "MethodGatesTable",
    headerFill: COLORS.navy,
    rowHeight: 44,
  });

  const output = await SpreadsheetFile.exportXlsx(workbook);
  await output.save(resultPath);
  return workbook;
}

await fs.mkdir(previewDir, { recursive: true });
const [sourceWorkbook, rankingWorkbook] = await Promise.all([
  SpreadsheetFile.importXlsx(await FileBlob.load(sourcePath)),
  SpreadsheetFile.importXlsx(await FileBlob.load(rankingPath)),
]);
const source = workbookValues(sourceWorkbook);
const ranking = workbookValues(rankingWorkbook);

const selectionRows = objectsFromValues(source.get("Selection Audit") ?? []);
const verificationRows = objectsFromValues(source.get("Program Verification") ?? []);
const detailRows = objectsFromValues(source.get("Program Details") ?? []);
const aasheRows = objectsFromValues(source.get("AASHE STARS") ?? []);
const prmeRows = objectsFromValues(source.get("UN PRME") ?? []);
const openAlexRows = objectsFromValues(source.get("OpenAlex 2021-2025") ?? []);
const seriesRows = {
  qsSustainability: objectsFromValues(ranking.get("QS Sustainability Detail") ?? []),
  theImpact: objectsFromValues(ranking.get("THE Impact Detail") ?? []),
  qsWorld: objectsFromValues(ranking.get("QS School Detail") ?? []),
  theWorld: objectsFromValues(ranking.get("THE School Detail") ?? []),
};

if (selectionRows.length !== 60 || new Set(selectionRows.map((row) => Number(row.ID))).size !== 60) {
  throw new Error(`Expected 60 unique Selection Audit rows; found ${selectionRows.length}.`);
}
for (const [name, rows] of Object.entries(seriesRows)) {
  if (rows.length !== 300) throw new Error(`${name}: expected 300 detail rows, found ${rows.length}.`);
}

const verificationById = byId(verificationRows);
const detailById = byId(detailRows);
const aasheById = byId(aasheRows);
const prmeById = byId(prmeRows);
const openAlexById = byId(openAlexRows);
const existingManualById = await loadExistingManual();
const manualRows = selectionRows.map((selection) =>
  createBaseManualRow(selection, verificationById.get(Number(selection.ID)), existingManualById.get(Number(selection.ID))),
);
const manualWorkbook = await buildManualWorkbook(manualRows);
const manualById = byId(manualRows);

const verifiedOpenAlex = openAlexRows.filter((row) =>
  cleanText(row["Collection Status"]) === "Collected" &&
  cleanText(row["Match Status"]) === "Verified",
);
const openAlexPercentiles = {
  works: percentileMap(verifiedOpenAlex, "Keyword Works 2021-2025"),
  hIndex: percentileMap(verifiedOpenAlex, "All-time H-index"),
  citations: percentileMap(verifiedOpenAlex, "Top-25 Citations"),
};
const selfTests = runModelSelfTests();

const programmes = selectionRows.map((selection) => {
  const id = Number(selection.ID);
  return scoreProgramme({
    selection,
    verification: verificationById.get(id),
    detail: detailById.get(id),
    manual: manualById.get(id),
    seriesRows,
    aashe: aasheById.get(id),
    prme: prmeById.get(id),
    openAlex: openAlexById.get(id),
    openAlexPercentiles,
  });
});
assignRanks(programmes);
assignProvisionalRanks(programmes);

const resultWorkbook = await buildResultsWorkbook(programmes, manualRows);
const jsonPayload = {
  methodVersion: METHOD_VERSION,
  generatedAt: new Date().toISOString(),
  publicLabel: "Provisional project ranking - not an official QS or THE ranking",
  rankingType: "provisional-coverage-adjusted",
  redditIncludedInAcademicScore: false,
  programs: programmes.map((program) => ({
    programId: program.programId,
    institution: program.institution,
    country: program.country,
    program: program.program,
    track: program.track,
    routeClassificationStatus: program.routeClassificationStatus,
    routeClassificationConfidence: program.routeClassificationConfidence,
    routeClassificationBasis: program.routeClassificationBasis,
    methodVersion: program.methodVersion,
    eligible: program.provisionalEligible,
    strictEligible: program.gateEligible,
    publicStatus: program.provisionalStatus,
    strictPublicStatus: program.publicStatus,
    rankingType: "provisional-coverage-adjusted",
    publishedScore: program.provisionalScore,
    publishedRank: program.provisionalRank,
    publishedRankGroupSize: program.provisionalRankGroupSize,
    finalScore: program.finalScore,
    coverage: program.coverage,
    confidence: program.confidence.toLowerCase(),
    rank: program.rank,
    rankGroupSize: program.rankGroupSize,
    components: program.components,
    warnings: [...program.provisionalWarnings, ...program.gateReasons],
    exclusionReasons: program.provisionalExclusionReasons,
    sources: program.sources,
  })),
};
await fs.writeFile(path.join(outputDir, "program_scores.json"), `${JSON.stringify(jsonPayload, null, 2)}\n`, "utf8");

const statusHeaders = [
  "ID", "Institution", "Program", "Provisional Track", "Route Status", "Provisional Eligible",
  "Provisional Status", "Coverage", "Confidence", "Published Provisional Score",
  "Published Provisional Rank", "Provisional Warnings", "Exclusion Reasons",
];
const statusRows = programmes.map((program) => [
  program.programId,
  program.institution,
  program.program,
  program.track,
  program.routeClassificationStatus,
  program.provisionalEligible ? "Yes" : "No",
  program.provisionalStatus,
  program.coverage,
  program.confidence,
  program.provisionalScore,
  program.provisionalRank,
  program.provisionalWarnings.join(" | "),
  program.provisionalExclusionReasons.join(" | "),
]);
await fs.writeFile(
  path.join(outputDir, "program_scoring_status.csv"),
  [statusHeaders, ...statusRows].map((row) => row.map(csvEscape).join(",")).join("\r\n"),
  "utf8",
);

const auditReport = {
  methodVersion: METHOD_VERSION,
  generatedAt: new Date().toISOString(),
  inputs: { sourcePath, rankingPath, manualPath },
  counts: {
    programs: programmes.length,
    research: programmes.filter((row) => row.track === "research").length,
    taught: programmes.filter((row) => row.track === "taught").length,
    provisionalEligible: programmes.filter((row) => row.provisionalEligible).length,
    provisionalRanked: programmes.filter((row) => row.provisionalRank !== null).length,
    excludedFromProvisionalRanking: programmes.filter((row) => !row.provisionalEligible).length,
    gateEligible: programmes.filter((row) => row.gateEligible).length,
    strictFinalRanked: programmes.filter((row) => row.rank !== null).length,
    openAlexVerifiedCollected: verifiedOpenAlex.length,
    criticalOverridesOpen: programmes.filter((row) => CRITICAL_OVERRIDES.has(row.programId) && !row.gateEligible).length,
  },
  publicationStatusCounts: Object.fromEntries(
    [...new Set(programmes.map((row) => row.provisionalStatus))].map((status) => [
      status,
      programmes.filter((row) => row.provisionalStatus === status).length,
    ]),
  ),
  validation: {
    uniqueProgramIds: new Set(programmes.map((row) => row.programId)).size === programmes.length,
    weightsSumTo100ForClassified: programmes
      .filter((row) => row.track)
      .every((row) => Math.abs(row.items.reduce((sum, item) => sum + item.weight, 0) - 100) < 1e-9),
    provisionalRanksIgnoreCoverage: programmes
      .filter((row) => row.provisionalEligible)
      .every((row) => row.provisionalRank !== null),
    noProvisionalRankWhenEligibilityBlocked: programmes
      .every((row) => row.provisionalRank === null || row.provisionalEligible),
    strictRankStillRequires70Coverage: programmes.every((row) => row.rank === null || row.coverage >= 0.70),
    strictRankStillRequiresGate: programmes.every((row) => row.rank === null || row.gateEligible),
    redditExcluded: true,
    ...selfTests,
  },
};
await fs.writeFile(path.join(outputDir, "pipeline_audit_report.json"), `${JSON.stringify(auditReport, null, 2)}\n`, "utf8");

const inspection = await resultWorkbook.inspect({
  kind: "table",
  range: "Release Status!A1:D16",
  include: "values,formulas",
  tableMaxRows: 16,
  tableMaxCols: 4,
  maxChars: 7000,
});
await fs.writeFile(path.join(outputDir, "result_inspection.ndjson"), inspection.ndjson, "utf8");
const formulaErrors = await resultWorkbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 200 },
  summary: "program scoring result formula error scan",
});
await fs.writeFile(path.join(outputDir, "formula_error_scan.ndjson"), formulaErrors.ndjson, "utf8");

const resultPreviewRanges = new Map([
  ["Release Status", "A1:D14"],
  ["Program Scores", "A1:Q24"],
  ["Component Results", "A1:H30"],
  ["Score Audit", "A1:M30"],
  ["Institution Series", "A1:H30"],
  ["Manual Inputs Snapshot", "A1:N20"],
  ["Method and Gates", "A1:C18"],
]);
for (const [sheetName, range] of resultPreviewRanges) {
  const preview = await resultWorkbook.render({ sheetName, range, scale: 1, format: "png" });
  const fileName = `${sheetName.replaceAll(" ", "_")}.png`;
  await fs.writeFile(path.join(previewDir, fileName), new Uint8Array(await preview.arrayBuffer()));
}
const manualPreviewRanges = new Map([
  ["Manual Inputs", "A1:N20"],
  ["Rubric Guide", "A1:E22"],
]);
for (const [sheetName, range] of manualPreviewRanges) {
  const preview = await manualWorkbook.render({ sheetName, range, scale: 1, format: "png" });
  const fileName = `Manual_${sheetName.replaceAll(" ", "_")}.png`;
  await fs.writeFile(path.join(previewDir, fileName), new Uint8Array(await preview.arrayBuffer()));
}

console.log(JSON.stringify(auditReport, null, 2));
console.log(`Manual input workbook: ${manualPath}`);
console.log(`Results workbook: ${resultPath}`);
