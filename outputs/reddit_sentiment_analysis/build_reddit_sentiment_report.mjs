import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const inputPath = "outputs/reddit_sentiment_analysis/reddit_sentiment_analysis_payload.json";
const outputDir = "outputs/reddit_sentiment_analysis";
const previewDir = path.join(outputDir, "previews");
const outputPath = path.join(outputDir, "reddit_sentiment_analysis_top60_programs.xlsx");

await fs.mkdir(previewDir, { recursive: true });
const payload = JSON.parse(await fs.readFile(inputPath, "utf8"));

const NAVY = "#17365D";
const TEAL = "#137C78";
const BLUE = "#245A86";
const BURGUNDY = "#9A1B43";
const GOLD = "#BF7A18";
const LIGHT_BLUE = "#DCEAF6";
const PALE_BLUE = "#EDF5FA";
const PALE_GREEN = "#EAF8EE";
const PALE_RED = "#FBE9E7";
const PALE_YELLOW = "#FFF4D6";
const BORDER = "#CBD7E3";
const TEXT = "#25364A";
const LINK = "#0563C1";
const WHITE = "#FFFFFF";

const columnLetter = (index) => {
  let n = index + 1;
  let result = "";
  while (n > 0) {
    n -= 1;
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26);
  }
  return result;
};

const number = (value) => (value === null || value === undefined || value === "" ? null : Number(value));
const mean = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
const median = (values) => {
  if (!values.length) return null;
  const ordered = [...values].sort((a, b) => a - b);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 ? ordered[middle] : (ordered[middle - 1] + ordered[middle]) / 2;
};
const ci95 = (values) => {
  if (values.length < 2) return [null, null];
  const average = mean(values);
  const variance = values.reduce((sum, value) => sum + ((value - average) ** 2), 0) / (values.length - 1);
  const margin = 1.96 * Math.sqrt(variance / values.length);
  return [Math.max(-1, average - margin), Math.min(1, average + margin)];
};

function summarize(rows, keyName) {
  const groups = new Map();
  for (const row of rows) {
    const key = row[keyName] || "Unclassified";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return [...groups.entries()].map(([key, group]) => {
    const compounds = group.map((row) => number(row.compound)).filter((value) => value !== null);
    const labels = { Positive: 0, Neutral: 0, Negative: 0 };
    for (const row of group) labels[row.sentiment_label] = (labels[row.sentiment_label] || 0) + 1;
    const [low, high] = ci95(compounds);
    return {
      [keyName]: key,
      unique_posts: group.length,
      mean_compound: mean(compounds),
      median_compound: median(compounds),
      mean_ci95_low: low,
      mean_ci95_high: high,
      positive: labels.Positive,
      neutral: labels.Neutral,
      negative: labels.Negative,
      positive_share: group.length ? labels.Positive / group.length : null,
      negative_share: group.length ? labels.Negative / group.length : null,
    };
  });
}

const institutionRecords = payload.analyzed_posts;
const postGroups = new Map();
for (const row of institutionRecords) {
  if (!postGroups.has(row.post_id)) postGroups.set(row.post_id, []);
  postGroups.get(row.post_id).push(row);
}

const uniquePosts = [...postGroups.values()].map((rows) => {
  const first = rows[0];
  const tier = rows.some((row) => row.relevance_tier === "High") ? "High" : "Medium";
  return {
    post_id: first.post_id,
    subreddit: first.subreddit,
    source_type: first.source_type,
    file_name: first.file_name,
    post_date_utc: new Date(first.post_date_utc),
    year_month: first.year_month,
    title: first.title,
    text_excerpt: first.text_excerpt,
    reddit_url: first.reddit_url,
    score: first.score,
    comments: first.comments,
    upvote_ratio: first.upvote_ratio,
    language: first.language,
    negative: first.negative,
    neutral: first.neutral,
    positive: first.positive,
    compound: first.compound,
    sentiment_label: first.sentiment_label,
    full_text_compound: first.full_text_compound,
    full_text_sentiment_label: first.full_text_sentiment_label,
    outcome_label: first.outcome_label,
    primary_topic: first.primary_topic,
    topic_flags: first.topic_flags,
    concern_flags: first.concern_flags,
    matched_institution_count: rows.length,
    matched_institution_ids: [...new Set(rows.map((row) => row.institution_id))].join(" | "),
    matched_institutions: [...new Set(rows.map((row) => row.institution))].join(" | "),
    matched_programs: [...new Set(rows.map((row) => row.program))].join(" | "),
    best_relevance_tier: tier,
  };
}).sort((a, b) => a.post_date_utc - b.post_date_utc || a.post_id.localeCompare(b.post_id));

const subredditSummary = summarize(uniquePosts, "subreddit").map((row) => ({
  ...row,
  source_type: uniquePosts.find((post) => post.subreddit === row.subreddit)?.source_type || "",
})).sort((a, b) => b.unique_posts - a.unique_posts || a.subreddit.localeCompare(b.subreddit));

const monthlySummary = summarize(uniquePosts, "year_month").sort((a, b) => a.year_month.localeCompare(b.year_month));
const topicSummary = summarize(uniquePosts, "primary_topic").sort((a, b) => b.unique_posts - a.unique_posts);
const outcomeSummary = summarize(uniquePosts, "outcome_label").sort((a, b) => b.unique_posts - a.unique_posts);

const concernMap = new Map();
for (const post of uniquePosts) {
  const flags = post.concern_flags ? post.concern_flags.split(" | ").filter(Boolean) : [];
  for (const flag of flags) {
    if (!concernMap.has(flag)) concernMap.set(flag, []);
    concernMap.get(flag).push(post);
  }
}
const concernSummary = [...concernMap.entries()].map(([concern, rows]) => ({
  concern,
  unique_posts: rows.length,
  share_of_unique_posts: rows.length / uniquePosts.length,
  mean_compound: mean(rows.map((row) => row.compound)),
})).sort((a, b) => b.unique_posts - a.unique_posts);

const workbook = Workbook.create();
const sheetNames = [
  "Dashboard",
  "Institution Summary",
  "Subreddit Summary",
  "Monthly Trend",
  "Topic Summary",
  "Outcome Summary",
  "Concern Summary",
  "Unique Posts",
  "Institution Records",
  "Calibration Sample",
  "Data Quality",
  "Methodology",
];
const sheets = new Map(sheetNames.map((name) => [name, workbook.worksheets.add(name)]));

function writeTitle(sheet, title, note, cols) {
  const last = columnLetter(cols - 1);
  sheet.mergeCells(`A1:${last}1`);
  sheet.mergeCells(`A2:${last}2`);
  sheet.getRange("A1").values = [[title]];
  sheet.getRange("A2").values = [[note]];
  sheet.getRange(`A1:${last}1`).format = {
    fill: NAVY,
    font: { bold: true, color: WHITE, size: 15 },
    verticalAlignment: "center",
  };
  sheet.getRange(`A2:${last}2`).format = {
    fill: LIGHT_BLUE,
    font: { italic: true, color: "#34495E", size: 10 },
    verticalAlignment: "center",
    wrapText: true,
  };
  sheet.getRange("A1").format.rowHeight = 28;
  sheet.getRange("A2").format.rowHeight = 34;
  sheet.showGridLines = false;
}

function setWidths(sheet, widths, rows) {
  widths.forEach((width, index) => {
    sheet.getRangeByIndexes(0, index, rows, 1).format.columnWidth = width;
  });
}

function prettyHeader(key) {
  const special = {
    post_id: "Post ID",
    post_date_utc: "Post Date UTC",
    reddit_url: "Reddit URL",
    mean_ci95_low: "Mean CI 95% Low",
    mean_ci95_high: "Mean CI 95% High",
    mean_compound: "Mean Headline Compound",
    median_compound: "Median Headline Compound",
    mean_full_text_compound: "Mean Full-Text Compound",
    upvote_ratio: "Upvote Ratio",
    selection_cohort: "Selection Cohort",
    cohort_position: "Cohort Position",
  };
  return special[key] || key.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function styleSentiment(sheet, range) {
  range.conditionalFormats.add("containsText", { text: "Positive", format: { fill: PALE_GREEN, font: { color: "#1B5E20" } } });
  range.conditionalFormats.add("containsText", { text: "Neutral", format: { fill: PALE_YELLOW, font: { color: "#7A5B00" } } });
  range.conditionalFormats.add("containsText", { text: "Negative", format: { fill: PALE_RED, font: { color: "#8A1C1C" } } });
}

function writeFlatSheet({ sheetName, title, note, rows, keys, widths, tableName, percentageKeys = [], decimalKeys = [], dateKeys = [], linkKeys = [] }) {
  const sheet = sheets.get(sheetName);
  const cols = keys.length;
  const last = columnLetter(cols - 1);
  const lastRow = 4 + rows.length;
  writeTitle(sheet, title, note, cols);
  sheet.getRangeByIndexes(3, 0, 1, cols).values = [keys.map(prettyHeader)];
  if (rows.length) {
    const values = rows.map((row) => keys.map((key) => row[key] ?? null));
    sheet.getRangeByIndexes(4, 0, rows.length, cols).values = values;
  }
  sheet.getRange(`A4:${last}4`).format = {
    fill: TEAL,
    font: { bold: true, color: WHITE, size: 9 },
    horizontalAlignment: "center",
    verticalAlignment: "center",
    wrapText: true,
  };
  if (rows.length) {
    sheet.getRange(`A5:${last}${lastRow}`).format = {
      font: { color: TEXT, size: 9 },
      verticalAlignment: "top",
      borders: { insideHorizontal: { style: "thin", color: BORDER } },
    };
    const table = sheet.tables.add(`A4:${last}${lastRow}`, true, tableName);
    table.style = "TableStyleLight9";
  }
  keys.forEach((key, index) => {
    const letter = columnLetter(index);
    if (percentageKeys.includes(key) && rows.length) sheet.getRange(`${letter}5:${letter}${lastRow}`).format.numberFormat = "0.0%";
    if (decimalKeys.includes(key) && rows.length) sheet.getRange(`${letter}5:${letter}${lastRow}`).format.numberFormat = "0.000";
    if (dateKeys.includes(key) && rows.length) sheet.getRange(`${letter}5:${letter}${lastRow}`).format.numberFormat = "yyyy-mm-dd hh:mm";
    if (linkKeys.includes(key) && rows.length) sheet.getRange(`${letter}5:${letter}${lastRow}`).format.font = { color: LINK, size: 9 };
    if (key === "sentiment_label" || key === "model_label" || key === "full_text_sentiment_label") {
      styleSentiment(sheet, sheet.getRange(`${letter}5:${letter}${lastRow}`));
    }
  });
  setWidths(sheet, widths, Math.max(lastRow, 5));
  sheet.getRange(`A4:${last}4`).format.rowHeight = 38;
  sheet.freezePanes.freezeRows(4);
  return { sheet, lastRow };
}

const institutionKeys = Object.keys(payload.institution_summary[0]);
writeFlatSheet({
  sheetName: "Institution Summary",
  title: "Institution-Level Discussion Summary",
  note: "One row per selected program/institution. Values summarize matched discussion records and are not a school or program quality ranking. Interpret only with the sample confidence column.",
  rows: payload.institution_summary,
  keys: institutionKeys,
  widths: [8, 12, 10, 30, 16, 46, 12, 12, 11, 11, 11, 11, 15, 15, 15, 14, 14, 10, 10, 10, 12, 12, 12, 10, 10, 12, 20, 22, 48],
  tableName: "InstitutionSummaryTable",
  percentageKeys: ["positive_share", "negative_share"],
  decimalKeys: ["mean_compound", "median_compound", "mean_full_text_compound", "mean_ci95_low", "mean_ci95_high"],
});
const confidenceIndex = institutionKeys.indexOf("sample_confidence");
const confidenceRange = sheets.get("Institution Summary").getRange(`${columnLetter(confidenceIndex)}5:${columnLetter(confidenceIndex)}64`);
confidenceRange.conditionalFormats.add("containsText", { text: "High coverage", format: { fill: PALE_GREEN } });
confidenceRange.conditionalFormats.add("containsText", { text: "Insufficient", format: { fill: PALE_RED } });
confidenceRange.conditionalFormats.add("containsText", { text: "No analyzed", format: { fill: "#E8EDF2" } });

const summaryKeys = ["subreddit", "source_type", "unique_posts", "mean_compound", "median_compound", "mean_ci95_low", "mean_ci95_high", "positive", "neutral", "negative", "positive_share", "negative_share"];
writeFlatSheet({
  sheetName: "Subreddit Summary",
  title: "Subreddit Summary - Unique Posts",
  note: "Counts use each Reddit post once. General and school forums have different purposes and observation windows, so comparisons should remain descriptive.",
  rows: subredditSummary,
  keys: summaryKeys,
  widths: [24, 15, 13, 16, 16, 14, 14, 10, 10, 10, 12, 12],
  tableName: "SubredditSummaryTable",
  percentageKeys: ["positive_share", "negative_share"],
  decimalKeys: ["mean_compound", "median_compound", "mean_ci95_low", "mean_ci95_high"],
});

const trendKeys = ["year_month", "unique_posts", "mean_compound", "median_compound", "mean_ci95_low", "mean_ci95_high", "positive", "neutral", "negative", "positive_share", "negative_share"];
writeFlatSheet({
  sheetName: "Monthly Trend",
  title: "Monthly Headline Sentiment Trend - Unique Posts",
  note: "Monthly counts and sentiment are descriptive. r/gradadmissions begins in July 2025, while the other downloaded sources generally begin in July 2024.",
  rows: monthlySummary,
  keys: trendKeys,
  widths: [13, 13, 16, 16, 14, 14, 10, 10, 10, 12, 12],
  tableName: "MonthlyTrendTable",
  percentageKeys: ["positive_share", "negative_share"],
  decimalKeys: ["mean_compound", "median_compound", "mean_ci95_low", "mean_ci95_high"],
});

const categoryKeys = ["primary_topic", "unique_posts", "mean_compound", "median_compound", "mean_ci95_low", "mean_ci95_high", "positive", "neutral", "negative", "positive_share", "negative_share"];
writeFlatSheet({
  sheetName: "Topic Summary",
  title: "Primary Topic Summary - Unique Posts",
  note: "Each post receives one primary topic for counting. The Unique Posts sheet also retains multi-label topic flags for qualitative review.",
  rows: topicSummary,
  keys: categoryKeys,
  widths: [24, 13, 16, 16, 14, 14, 10, 10, 10, 12, 12],
  tableName: "TopicSummaryTable",
  percentageKeys: ["positive_share", "negative_share"],
  decimalKeys: ["mean_compound", "median_compound", "mean_ci95_low", "mean_ci95_high"],
});

writeFlatSheet({
  sheetName: "Outcome Summary",
  title: "Admission Outcome Summary - Unique Posts",
  note: "Admission outcome is classified separately from sentiment. A rejected post may still have positive language, and a positive post is not necessarily an acceptance.",
  rows: outcomeSummary,
  keys: ["outcome_label", ...categoryKeys.slice(1)],
  widths: [28, 13, 16, 16, 14, 14, 10, 10, 10, 12, 12],
  tableName: "OutcomeSummaryTable",
  percentageKeys: ["positive_share", "negative_share"],
  decimalKeys: ["mean_compound", "median_compound", "mean_ci95_low", "mean_ci95_high"],
});

writeFlatSheet({
  sheetName: "Concern Summary",
  title: "Flagged Concern Summary - Unique Posts",
  note: "Concern flags are multi-label and therefore do not sum to the total number of posts. They identify discussion signals, not verified program characteristics.",
  rows: concernSummary,
  keys: ["concern", "unique_posts", "share_of_unique_posts", "mean_compound"],
  widths: [30, 14, 20, 20],
  tableName: "ConcernSummaryTable",
  percentageKeys: ["share_of_unique_posts"],
  decimalKeys: ["mean_compound"],
});

const uniquePostKeys = Object.keys(uniquePosts[0]);
writeFlatSheet({
  sheetName: "Unique Posts",
  title: "Analyzed Unique Reddit Posts",
  note: "One row per eligible Reddit post. Author fields are intentionally excluded. Use Reddit URL and excerpt for manual validation; matched institutions are consolidated in the final columns.",
  rows: uniquePosts,
  keys: uniquePostKeys,
  widths: [14, 22, 15, 30, 18, 11, 50, 70, 55, 10, 10, 12, 10, 11, 11, 11, 13, 14, 15, 17, 24, 22, 48, 40, 12, 28, 55, 55, 14],
  tableName: "UniquePostsTable",
  percentageKeys: ["upvote_ratio", "negative", "neutral", "positive"],
  decimalKeys: ["compound", "full_text_compound"],
  dateKeys: ["post_date_utc"],
  linkKeys: ["reddit_url"],
});

const institutionRecordKeys = Object.keys(institutionRecords[0]);
const institutionRecordRows = institutionRecords.map((row) => ({ ...row, post_date_utc: new Date(row.post_date_utc) }));
writeFlatSheet({
  sheetName: "Institution Records",
  title: "Institution-Post Analysis Records",
  note: "One row per institution-post match after deduplication. The same Reddit post can appear more than once when it validly mentions multiple selected institutions.",
  rows: institutionRecordRows,
  keys: institutionRecordKeys,
  widths: institutionRecordKeys.map((key) => ["title", "program"].includes(key) ? 48 : ["text_excerpt"].includes(key) ? 70 : ["reddit_url"].includes(key) ? 55 : ["topic_flags", "concern_flags", "institution_aliases_matched", "program_aliases_matched"].includes(key) ? 38 : ["institution"].includes(key) ? 30 : 14),
  tableName: "InstitutionRecordsTable",
  percentageKeys: ["upvote_ratio", "negative", "neutral", "positive", "full_text_negative", "full_text_neutral", "full_text_positive"],
  decimalKeys: ["compound", "full_text_compound"],
  dateKeys: ["post_date_utc"],
  linkKeys: ["reddit_url"],
});

const calibrationKeys = Object.keys(payload.calibration_sample[0]);
writeFlatSheet({
  sheetName: "Calibration Sample",
  title: "Stratified Manual Calibration Sample",
  note: "Review the title, excerpt, relevance, outcome, and Reddit URL. Enter Positive, Neutral, Negative, or Exclude in Human Label; use Review Note for disagreements or relevance concerns.",
  rows: payload.calibration_sample,
  keys: calibrationKeys,
  widths: [14, 30, 22, 15, 12, 13, 13, 16, 24, 52, 72, 55, 16, 45],
  tableName: "CalibrationSampleTable",
  decimalKeys: ["compound", "full_text_compound"],
  linkKeys: ["reddit_url"],
});
const humanLabelColumn = columnLetter(calibrationKeys.indexOf("human_label"));
sheets.get("Calibration Sample").getRange(`${humanLabelColumn}5:${humanLabelColumn}${4 + payload.calibration_sample.length}`).dataValidation = {
  rule: { type: "list", values: ["Positive", "Neutral", "Negative", "Exclude"] },
};
styleSentiment(sheets.get("Calibration Sample"), sheets.get("Calibration Sample").getRange(`${humanLabelColumn}5:${humanLabelColumn}${4 + payload.calibration_sample.length}`));

const dataQualityKeys = Object.keys(payload.file_stats[0]);
writeFlatSheet({
  sheetName: "Data Quality",
  title: "Raw File Inventory and Filtering Audit",
  note: "All 19 downloaded JSONL files were parsed without malformed lines. Counts show the actual source windows and filtering results for reproducibility.",
  rows: payload.file_stats,
  keys: dataQualityKeys,
  widths: [36, 24, 15, 13, 13, 20, 13, 18, 13, 15, 19, 16, 20, 13, 13],
  tableName: "DataQualityTable",
});

const methodology = sheets.get("Methodology");
writeTitle(methodology, "Methodology and Interpretation Guide", "The analysis is designed for exploratory group-project use. It measures discussion tone and themes; it does not establish causality, placement outcomes, or program quality.", 6);
const methodRows = [
  ["Research unit", "Unique Reddit post for overall results; institution-post match for institution summaries."],
  ["Raw sources", "19 JSONL post files: r/gradadmissions, r/GradSchool, r/sustainability, r/sustainableFinance, and 15 school subreddits."],
  ["Observation window", "2024-07-01 to 2026-06-29 overall. r/gradadmissions begins 2025-07-01; most other files begin 2024-07-01."],
  ["Program universe", "The synchronized 60-program sample: 30 selected from QS and 30 nonduplicate additions from THE."],
  ["Relevance filter", "General forums: target program match, or institution plus graduate/academic context. School forums: target program match, or graduate context plus sustainability/environment context."],
  ["Primary sentiment", "VADER 3.3.2 applied to the post title. Positive >= 0.05, Negative <= -0.05, otherwise Neutral."],
  ["Why headline tone", "Long Reddit bodies can push VADER compound scores toward extremes. The title is used as the primary, reproducible attitude signal."],
  ["Secondary sentiment", "Full-text VADER score is retained for diagnostics and qualitative review, but it is not used for primary labels or institution comparisons."],
  ["Domain lexicon", "Graduate-admission terms were added with documented valence weights; see the table below."],
  ["Admission outcome", "Accepted/Offer, Rejected, Waitlisted, Pending/Waiting, Mixed, or Not explicit. Outcome is not treated as sentiment."],
  ["Topics", "Admissions, Curriculum, Cost and Funding, Career and Placement, Research and Thesis, Student Experience, Sustainability Content, or Other."],
  ["Concern flags", "Anxiety/Uncertainty, Stress/Burnout, Cost Concern, and Dissatisfaction. Multi-label flags can overlap."],
  ["Language and exclusions", "English only; NSFW, empty, Low/context-only, and non-English records excluded. Deleted/removed bodies may remain analyzable from titles."],
  ["Deduplication", "Overall analyses use one row per Reddit post. Institution summaries use one row per unique institution-post match."],
  ["Coverage labels", "High >= 100 records; Medium 30-99; Low 10-29; Insufficient 1-9; No analyzed posts = 0."],
  ["Privacy", "No Reddit author names are retained. URLs, titles, and excerpts remain for reproducibility and manual review."],
  ["Interpretation limit", "Do not rank schools by Reddit sentiment. Samples are self-selected, source coverage is uneven, and subreddit culture differs."],
  ["Validation step", "Complete the 120-row Calibration Sample and report agreement before using automated labels in a final presentation."],
];
methodology.getRange("A4:B4").values = [["Method Element", "Definition / Rule"]];
methodology.getRange(`A5:B${4 + methodRows.length}`).values = methodRows;
methodology.getRange("A4:B4").format = { fill: TEAL, font: { bold: true, color: WHITE }, horizontalAlignment: "center" };
methodology.getRange(`A5:B${4 + methodRows.length}`).format = { font: { color: TEXT, size: 9 }, wrapText: true, verticalAlignment: "top", borders: { insideHorizontal: { style: "thin", color: BORDER } } };
methodology.getRange(`A5:A${4 + methodRows.length}`).format = { fill: PALE_YELLOW, font: { bold: true, color: TEXT, size: 9 } };
const lexiconRows = [
  ["accepted", 2.6], ["admitted", 2.6], ["offer", 1.8], ["scholarship", 2.1],
  ["rejected", -2.8], ["rejection", -2.8], ["denied", -2.5], ["waitlisted", -1.2],
  ["waitlist", -1.0], ["anxious", -1.9], ["worried", -1.8], ["burnout", -2.6],
  ["expensive", -1.6], ["regret", -2.3], ["disappointed", -2.4], ["supportive", 2.0], ["recommend", 2.0],
];
methodology.getRange("D4:E4").values = [["Lexicon Term", "Valence"]];
methodology.getRange(`D5:E${4 + lexiconRows.length}`).values = lexiconRows;
methodology.getRange("D4:E4").format = { fill: GOLD, font: { bold: true, color: WHITE }, horizontalAlignment: "center" };
methodology.getRange(`D5:E${4 + lexiconRows.length}`).format = { font: { color: TEXT, size: 9 }, borders: { insideHorizontal: { style: "thin", color: BORDER } } };
methodology.getRange(`E5:E${4 + lexiconRows.length}`).format.numberFormat = "0.0";
methodology.getRange("A24:F24").merge();
methodology.getRange("A24").values = [["Key Analysis Counts"]];
methodology.getRange("A24:F24").format = { fill: BLUE, font: { bold: true, color: WHITE } };
const countRows = [
  ["Raw JSONL files", payload.summary.raw_files],
  ["Raw posts parsed", payload.summary.raw_posts],
  ["Unique analyzed posts", uniquePosts.length],
  ["Institution-post records", institutionRecords.length],
  ["Institutions with analyzed records", payload.summary.institutions_covered],
  ["Calibration rows", payload.calibration_sample.length],
];
methodology.getRange("A25:B30").values = countRows;
methodology.getRange("A25:A30").format = { fill: PALE_BLUE, font: { bold: true, color: TEXT } };
methodology.getRange("B25:B30").format.numberFormat = "#,##0";
setWidths(methodology, [26, 78, 4, 22, 14, 4], 30);
methodology.getRange("A5:B22").format.rowHeight = 36;
methodology.freezePanes.freezeRows(4);

const dashboard = sheets.get("Dashboard");
writeTitle(dashboard, "Reddit Sentiment and Discussion Analysis", "Exploratory analysis of posts associated with the 60-program sample. Overall charts use unique posts; institution-level outputs are descriptive and never a quality ranking.", 12);
const uniqueLastRow = 4 + uniquePosts.length;
const institutionLastRow = 4 + payload.institution_summary.length;
const dashboardMetrics = [
  ["Raw posts parsed", `=SUM('Data Quality'!D5:D23)`, "19 JSONL files"],
  ["Unique analyzed posts", `=COUNTA('Unique Posts'!A5:A${uniqueLastRow})`, "After relevance, language, and safety filters"],
  ["Institutions covered", `=COUNTIF('Institution Summary'!G5:G${institutionLastRow},\">0\")`, "Of 60 selected programs"],
  ["Positive headline share", `=COUNTIF('Unique Posts'!R5:R${uniqueLastRow},\"Positive\")/COUNTA('Unique Posts'!A5:A${uniqueLastRow})`, "VADER title label"],
  ["Neutral headline share", `=COUNTIF('Unique Posts'!R5:R${uniqueLastRow},\"Neutral\")/COUNTA('Unique Posts'!A5:A${uniqueLastRow})`, "VADER title label"],
  ["Negative headline share", `=COUNTIF('Unique Posts'!R5:R${uniqueLastRow},\"Negative\")/COUNTA('Unique Posts'!A5:A${uniqueLastRow})`, "VADER title label"],
];
const metricAnchors = [[0, 3], [4, 3], [8, 3], [0, 7], [4, 7], [8, 7]];
dashboardMetrics.forEach(([label, formula, note], index) => {
  const [col, row] = metricAnchors[index];
  const labelRange = dashboard.getRangeByIndexes(row, col, 1, 3);
  const valueRange = dashboard.getRangeByIndexes(row + 1, col, 1, 3);
  const noteRange = dashboard.getRangeByIndexes(row + 2, col, 1, 3);
  labelRange.merge(); valueRange.merge(); noteRange.merge();
  labelRange.values = [[label]];
  valueRange.formulas = [[formula]];
  noteRange.values = [[note]];
  labelRange.format = { fill: TEAL, font: { bold: true, color: WHITE, size: 9 }, horizontalAlignment: "center" };
  valueRange.format = { fill: PALE_BLUE, font: { bold: true, color: NAVY, size: 16 }, horizontalAlignment: "center", verticalAlignment: "center" };
  noteRange.format = { fill: "#F7F9FB", font: { italic: true, color: TEXT, size: 8 }, horizontalAlignment: "center", wrapText: true };
  valueRange.format.numberFormat = index >= 3 ? "0.0%" : "#,##0";
});
dashboard.mergeCells("A11:L11");
dashboard.getRange("A11").values = [["Primary result: headline tone is mostly neutral. Keep admission outcomes, discussion topics, and concern flags separate from sentiment when presenting findings."]];
dashboard.getRange("A11:L11").format = { fill: PALE_YELLOW, font: { bold: true, color: TEXT, size: 9 }, wrapText: true, verticalAlignment: "center" };
dashboard.getRange("A11:L11").format.rowHeight = 28;

const helperStart = 53;
dashboard.getRange(`A${helperStart}:B${helperStart}`).values = [["Headline Sentiment", "Unique Posts"]];
dashboard.getRange(`A${helperStart + 1}:A${helperStart + 3}`).values = [["Positive"], ["Neutral"], ["Negative"]];
dashboard.getRange(`B${helperStart + 1}:B${helperStart + 3}`).formulas = [
  [`=COUNTIF('Unique Posts'!R5:R${uniqueLastRow},\"Positive\")`],
  [`=COUNTIF('Unique Posts'!R5:R${uniqueLastRow},\"Neutral\")`],
  [`=COUNTIF('Unique Posts'!R5:R${uniqueLastRow},\"Negative\")`],
];
dashboard.getRange(`D${helperStart}:E${helperStart + monthlySummary.length}`).values = [["Month", "Mean Headline Compound"], ...monthlySummary.map((row) => [null, null])];
dashboard.getRange(`D${helperStart + 1}:E${helperStart + monthlySummary.length}`).formulas = monthlySummary.map((_, index) => [[`='Monthly Trend'!A${5 + index}`, `='Monthly Trend'!C${5 + index}`][0], [`='Monthly Trend'!A${5 + index}`, `='Monthly Trend'!C${5 + index}`][1]]);
dashboard.getRange(`G${helperStart}:H${helperStart + topicSummary.length}`).values = [["Primary Topic", "Unique Posts"], ...topicSummary.map(() => [null, null])];
dashboard.getRange(`G${helperStart + 1}:H${helperStart + topicSummary.length}`).formulas = topicSummary.map((_, index) => [`='Topic Summary'!A${5 + index}`, `='Topic Summary'!B${5 + index}`]);
dashboard.getRange(`J${helperStart}:K${helperStart + outcomeSummary.length}`).values = [["Admission Outcome", "Unique Posts"], ...outcomeSummary.map(() => [null, null])];
dashboard.getRange(`J${helperStart + 1}:K${helperStart + outcomeSummary.length}`).formulas = outcomeSummary.map((_, index) => [`='Outcome Summary'!A${5 + index}`, `='Outcome Summary'!B${5 + index}`]);
for (const range of [`A${helperStart}:B${helperStart + 3}`, `D${helperStart}:E${helperStart + monthlySummary.length}`, `G${helperStart}:H${helperStart + topicSummary.length}`, `J${helperStart}:K${helperStart + outcomeSummary.length}`]) {
  dashboard.getRange(range).format = { font: { color: TEXT, size: 8 }, borders: { preset: "all", style: "thin", color: BORDER } };
}
for (const range of [`A${helperStart}:B${helperStart}`, `D${helperStart}:E${helperStart}`, `G${helperStart}:H${helperStart}`, `J${helperStart}:K${helperStart}`]) {
  dashboard.getRange(range).format = { fill: BLUE, font: { bold: true, color: WHITE, size: 8 }, borders: { preset: "all", style: "thin", color: BORDER } };
}

const sentimentChart = dashboard.charts.add("doughnut", dashboard.getRange(`A${helperStart}:B${helperStart + 3}`));
sentimentChart.title = "Headline Tone: Neutral Dominates";
sentimentChart.hasLegend = true;
sentimentChart.setPosition("A13", "F29");

const trendChart = dashboard.charts.add("line", dashboard.getRange(`D${helperStart}:E${helperStart + monthlySummary.length}`));
trendChart.title = "Monthly Mean Headline Compound";
trendChart.hasLegend = false;
trendChart.xAxis = { axisType: "textAxis", textStyle: { fontSize: 8 } };
trendChart.yAxis = { numberFormatCode: "0.00", min: -1, max: 1 };
trendChart.setPosition("G13", "L29");

const topicChart = dashboard.charts.add("bar", dashboard.getRange(`G${helperStart}:H${helperStart + topicSummary.length}`));
topicChart.title = "Discussion Volume by Primary Topic";
topicChart.hasLegend = false;
topicChart.yAxis = { numberFormatCode: "#,##0" };
topicChart.setPosition("A32", "F49");

const outcomeChart = dashboard.charts.add("bar", dashboard.getRange(`J${helperStart}:K${helperStart + outcomeSummary.length}`));
outcomeChart.title = "Admission Outcome Mentions";
outcomeChart.hasLegend = false;
outcomeChart.yAxis = { numberFormatCode: "#,##0" };
outcomeChart.setPosition("G32", "L49");

setWidths(dashboard, [14, 14, 14, 4, 14, 14, 14, 4, 14, 14, 14, 4], helperStart + monthlySummary.length);
dashboard.freezePanes.freezeRows(2);

const exported = await SpreadsheetFile.exportXlsx(workbook);
await exported.save(outputPath);

const finalWorkbook = await SpreadsheetFile.importXlsx(await FileBlob.load(outputPath));
const inspection = await finalWorkbook.inspect({
  kind: "workbook,sheet,table,drawing",
  maxChars: 18000,
  tableMaxRows: 5,
  tableMaxCols: 12,
  tableMaxCellChars: 80,
});
await fs.writeFile(path.join(outputDir, "inspection.ndjson"), inspection.ndjson, "utf8");
const dashboardCheck = await finalWorkbook.inspect({ kind: "region", sheetId: "Dashboard", range: "A1:L80", maxChars: 9000 });
await fs.writeFile(path.join(outputDir, "dashboard_check.ndjson"), dashboardCheck.ndjson, "utf8");
const errors = await finalWorkbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "formula error scan",
});
await fs.writeFile(path.join(outputDir, "formula_error_scan.ndjson"), errors.ndjson, "utf8");

const rowCounts = {};
for (let index = 0; index < finalWorkbook.worksheets.items.length; index += 1) {
  const sheet = finalWorkbook.worksheets.getItemAt(index);
  const used = sheet.getUsedRange()?.values ?? [];
  rowCounts[sheet.name] = used.length;
  const safe = sheet.name.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "");
  const options = sheet.name === "Dashboard"
    ? { sheetName: sheet.name, range: "A1:L80", scale: 0.8, format: "png" }
    : used.length > 150
      ? { sheetName: sheet.name, range: `A1:${columnLetter(Math.min((used[0]?.length || 1) - 1, 15))}35`, scale: 0.8, format: "png" }
      : { sheetName: sheet.name, autoCrop: "all", scale: 0.8, format: "png" };
  const preview = await finalWorkbook.render(options);
  await fs.writeFile(path.join(previewDir, `${String(index + 1).padStart(2, "0")}_${safe}.png`), new Uint8Array(await preview.arrayBuffer()));
}

console.log(JSON.stringify({
  output: path.resolve(outputPath),
  uniquePosts: uniquePosts.length,
  institutionRecords: institutionRecords.length,
  institutionRows: payload.institution_summary.length,
  calibrationRows: payload.calibration_sample.length,
  rowCounts,
}, null, 2));
