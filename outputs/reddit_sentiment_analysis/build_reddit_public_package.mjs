import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { FileBlob, SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const rawDir = process.argv[2];
if (!rawDir) throw new Error("Pass the Reddit raw-data folder as the first argument.");

const inputPath = "outputs/reddit_sentiment_analysis/reddit_sentiment_analysis_payload.json";
const packageDir = "outputs/reddit_sentiment_public_package";
const previewDir = path.join(packageDir, "previews");
const workbookPath = path.join(packageDir, "reddit_sentiment_analysis_top60_public.xlsx");
await fs.mkdir(previewDir, { recursive: true });

const payload = JSON.parse(await fs.readFile(inputPath, "utf8"));
const records = payload.analyzed_posts;
const uniquePosts = [...new Map(records.map((row) => [row.post_id, row])).values()];

const NAVY = "#17365D";
const TEAL = "#137C78";
const BLUE = "#245A86";
const GOLD = "#BF7A18";
const LIGHT_BLUE = "#DCEAF6";
const PALE_BLUE = "#EDF5FA";
const PALE_GREEN = "#EAF8EE";
const PALE_RED = "#FBE9E7";
const PALE_YELLOW = "#FFF4D6";
const BORDER = "#CBD7E3";
const TEXT = "#25364A";
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
    const compounds = group.map((row) => Number(row.compound));
    const labels = { Positive: 0, Neutral: 0, Negative: 0 };
    for (const row of group) labels[row.sentiment_label] += 1;
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
      positive_share: labels.Positive / group.length,
      negative_share: labels.Negative / group.length,
    };
  });
}

const subredditSummary = summarize(uniquePosts, "subreddit").map((row) => ({
  ...row,
  source_type: uniquePosts.find((post) => post.subreddit === row.subreddit)?.source_type || "",
})).sort((a, b) => b.unique_posts - a.unique_posts);
const monthlySummary = summarize(uniquePosts, "year_month").sort((a, b) => a.year_month.localeCompare(b.year_month));
const topicSummary = summarize(uniquePosts, "primary_topic").sort((a, b) => b.unique_posts - a.unique_posts);
const outcomeSummary = summarize(uniquePosts, "outcome_label").sort((a, b) => b.unique_posts - a.unique_posts);

const concernGroups = new Map();
for (const post of uniquePosts) {
  for (const concern of String(post.concern_flags || "").split(" | ").filter(Boolean)) {
    if (!concernGroups.has(concern)) concernGroups.set(concern, []);
    concernGroups.get(concern).push(post);
  }
}
const concernSummary = [...concernGroups.entries()].map(([concern, rows]) => ({
  concern,
  unique_posts: rows.length,
  share_of_unique_posts: rows.length / uniquePosts.length,
  mean_compound: mean(rows.map((row) => Number(row.compound))),
})).sort((a, b) => b.unique_posts - a.unique_posts);

const workbook = Workbook.create();
const names = ["Dashboard", "Institution Summary", "Subreddit Summary", "Monthly Trend", "Topic Summary", "Outcome Summary", "Concern Summary", "Data Quality", "Methodology"];
const sheets = new Map(names.map((name) => [name, workbook.worksheets.add(name)]));

function writeTitle(sheet, title, note, cols) {
  const last = columnLetter(cols - 1);
  sheet.mergeCells(`A1:${last}1`);
  sheet.mergeCells(`A2:${last}2`);
  sheet.getRange("A1").values = [[title]];
  sheet.getRange("A2").values = [[note]];
  sheet.getRange(`A1:${last}1`).format = { fill: NAVY, font: { bold: true, color: WHITE, size: 15 }, verticalAlignment: "center" };
  sheet.getRange(`A2:${last}2`).format = { fill: LIGHT_BLUE, font: { italic: true, color: "#34495E", size: 10 }, verticalAlignment: "center", wrapText: true };
  sheet.getRange("A1").format.rowHeight = 28;
  sheet.getRange("A2").format.rowHeight = 34;
  sheet.showGridLines = false;
}

const pretty = (key) => ({
  mean_compound: "Mean Headline Compound",
  median_compound: "Median Headline Compound",
  mean_ci95_low: "Mean CI 95% Low",
  mean_ci95_high: "Mean CI 95% High",
  mean_full_text_compound: "Mean Full-Text Compound",
}[key] || key.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()));

function setWidths(sheet, widths, rows) {
  widths.forEach((width, index) => sheet.getRangeByIndexes(0, index, rows, 1).format.columnWidth = width);
}

function writeTable({ name, title, note, rows, keys, widths, tableName, percentages = [], decimals = [] }) {
  const sheet = sheets.get(name);
  const last = columnLetter(keys.length - 1);
  const lastRow = rows.length + 4;
  writeTitle(sheet, title, note, keys.length);
  sheet.getRangeByIndexes(3, 0, 1, keys.length).values = [keys.map(pretty)];
  sheet.getRangeByIndexes(4, 0, rows.length, keys.length).values = rows.map((row) => keys.map((key) => row[key] ?? null));
  sheet.getRange(`A4:${last}4`).format = { fill: TEAL, font: { bold: true, color: WHITE, size: 9 }, horizontalAlignment: "center", verticalAlignment: "center", wrapText: true };
  sheet.getRange(`A5:${last}${lastRow}`).format = { font: { color: TEXT, size: 9 }, verticalAlignment: "top", borders: { insideHorizontal: { style: "thin", color: BORDER } } };
  const table = sheet.tables.add(`A4:${last}${lastRow}`, true, tableName);
  table.style = "TableStyleLight9";
  keys.forEach((key, index) => {
    const letter = columnLetter(index);
    if (percentages.includes(key)) sheet.getRange(`${letter}5:${letter}${lastRow}`).format.numberFormat = "0.0%";
    if (decimals.includes(key)) sheet.getRange(`${letter}5:${letter}${lastRow}`).format.numberFormat = "0.000";
  });
  setWidths(sheet, widths, lastRow);
  sheet.getRange(`A4:${last}4`).format.rowHeight = 38;
  sheet.freezePanes.freezeRows(4);
}

const institutionKeys = Object.keys(payload.institution_summary[0]);
writeTable({
  name: "Institution Summary",
  title: "Institution-Level Discussion Summary",
  note: "Aggregate discussion records only. This public workbook contains no Reddit author names, titles, post excerpts, post IDs, or post URLs. It is not a school or program quality ranking.",
  rows: payload.institution_summary,
  keys: institutionKeys,
  widths: [8, 12, 10, 30, 16, 46, 12, 12, 11, 11, 11, 11, 15, 15, 15, 14, 14, 10, 10, 10, 12, 12, 12, 10, 10, 12, 20, 22, 48],
  tableName: "PublicInstitutionSummary",
  percentages: ["positive_share", "negative_share"],
  decimals: ["mean_compound", "median_compound", "mean_full_text_compound", "mean_ci95_low", "mean_ci95_high"],
});

const summaryKeys = ["subreddit", "source_type", "unique_posts", "mean_compound", "median_compound", "mean_ci95_low", "mean_ci95_high", "positive", "neutral", "negative", "positive_share", "negative_share"];
writeTable({ name: "Subreddit Summary", title: "Subreddit Summary - Unique Posts", note: "Counts use each eligible post once. General and school forums have different purposes and observation windows.", rows: subredditSummary, keys: summaryKeys, widths: [24, 15, 13, 16, 16, 14, 14, 10, 10, 10, 12, 12], tableName: "PublicSubredditSummary", percentages: ["positive_share", "negative_share"], decimals: ["mean_compound", "median_compound", "mean_ci95_low", "mean_ci95_high"] });
const trendKeys = ["year_month", "unique_posts", "mean_compound", "median_compound", "mean_ci95_low", "mean_ci95_high", "positive", "neutral", "negative", "positive_share", "negative_share"];
writeTable({ name: "Monthly Trend", title: "Monthly Headline Sentiment Trend", note: "r/gradadmissions begins in July 2025; most other downloaded sources begin in July 2024.", rows: monthlySummary, keys: trendKeys, widths: [13, 13, 16, 16, 14, 14, 10, 10, 10, 12, 12], tableName: "PublicMonthlyTrend", percentages: ["positive_share", "negative_share"], decimals: ["mean_compound", "median_compound", "mean_ci95_low", "mean_ci95_high"] });
const categoryKeys = ["primary_topic", "unique_posts", "mean_compound", "median_compound", "mean_ci95_low", "mean_ci95_high", "positive", "neutral", "negative", "positive_share", "negative_share"];
writeTable({ name: "Topic Summary", title: "Primary Topic Summary", note: "Each eligible post receives one primary topic for counting.", rows: topicSummary, keys: categoryKeys, widths: [24, 13, 16, 16, 14, 14, 10, 10, 10, 12, 12], tableName: "PublicTopicSummary", percentages: ["positive_share", "negative_share"], decimals: ["mean_compound", "median_compound", "mean_ci95_low", "mean_ci95_high"] });
writeTable({ name: "Outcome Summary", title: "Admission Outcome Summary", note: "Admission outcome is classified separately from sentiment.", rows: outcomeSummary, keys: ["outcome_label", ...categoryKeys.slice(1)], widths: [28, 13, 16, 16, 14, 14, 10, 10, 10, 12, 12], tableName: "PublicOutcomeSummary", percentages: ["positive_share", "negative_share"], decimals: ["mean_compound", "median_compound", "mean_ci95_low", "mean_ci95_high"] });
writeTable({ name: "Concern Summary", title: "Flagged Concern Summary", note: "Concern flags are multi-label and do not sum to the total. They identify discussion signals, not verified program characteristics.", rows: concernSummary, keys: ["concern", "unique_posts", "share_of_unique_posts", "mean_compound"], widths: [30, 14, 20, 20], tableName: "PublicConcernSummary", percentages: ["share_of_unique_posts"], decimals: ["mean_compound"] });

const dataQualityKeys = Object.keys(payload.file_stats[0]);
writeTable({ name: "Data Quality", title: "Raw File Inventory and Filtering Audit", note: "File-level counts and windows only. Raw Reddit content is not redistributed in this public package.", rows: payload.file_stats, keys: dataQualityKeys, widths: [36, 24, 15, 13, 13, 20, 13, 18, 13, 15, 19, 16, 20, 13, 13], tableName: "PublicDataQuality" });

const methodology = sheets.get("Methodology");
writeTitle(methodology, "Methodology and Public-Data Guide", "This public workbook contains aggregate, de-identified outputs only. Full post-level validation data remains local to the research team.", 6);
const methodRows = [
  ["Research unit", "Unique Reddit post for overall results; institution-post match for institution summaries."],
  ["Sources", "19 JSONL files: four general forums and 15 school subreddits."],
  ["Observation window", "2024-07-01 to 2026-06-29 overall; r/gradadmissions begins 2025-07-01."],
  ["Program universe", "60 programs: 30 selected from QS and 30 nonduplicate additions from THE."],
  ["Primary sentiment", "VADER 3.3.2 on post titles. Positive >= 0.05; Negative <= -0.05; otherwise Neutral."],
  ["Secondary sentiment", "Full-text VADER is retained only as an aggregate diagnostic because long bodies can push scores toward extremes."],
  ["Outcome labels", "Accepted/Offer, Rejected, Waitlisted, Pending/Waiting, Mixed, or Not explicit."],
  ["Topics", "Admissions, Curriculum, Cost and Funding, Career and Placement, Research and Thesis, Student Experience, Sustainability Content, or Other."],
  ["Concern flags", "Anxiety/Uncertainty, Stress/Burnout, Cost Concern, and Dissatisfaction."],
  ["Language/exclusions", "English only; NSFW, empty, Low/context-only, and non-English records excluded."],
  ["Coverage", "High >= 100; Medium 30-99; Low 10-29; Insufficient 1-9; No analyzed posts = 0."],
  ["Privacy", "No usernames, author IDs, post IDs, titles, excerpts, or post URLs are included in this public workbook."],
  ["Interpretation", "Do not rank schools by Reddit sentiment. Samples are self-selected and forum cultures differ."],
  ["Raw-data access", "Raw files remain local. Recollect from the original source under applicable platform terms rather than redistributing user content."],
];
methodology.getRange("A4:B4").values = [["Method Element", "Definition / Rule"]];
methodology.getRange(`A5:B${4 + methodRows.length}`).values = methodRows;
methodology.getRange("A4:B4").format = { fill: TEAL, font: { bold: true, color: WHITE }, horizontalAlignment: "center" };
methodology.getRange(`A5:B${4 + methodRows.length}`).format = { font: { color: TEXT, size: 9 }, wrapText: true, verticalAlignment: "top", borders: { insideHorizontal: { style: "thin", color: BORDER } } };
methodology.getRange(`A5:A${4 + methodRows.length}`).format = { fill: PALE_YELLOW, font: { bold: true, color: TEXT, size: 9 } };
methodology.getRange("D4:E4").values = [["Count", "Value"]];
methodology.getRange("D5:E10").values = [
  ["Raw files", payload.summary.raw_files],
  ["Raw posts parsed", payload.summary.raw_posts],
  ["Unique analyzed posts", uniquePosts.length],
  ["Institution-post records", records.length],
  ["Institutions covered", payload.summary.institutions_covered],
  ["Programs in sample", payload.institution_summary.length],
];
methodology.getRange("D4:E4").format = { fill: GOLD, font: { bold: true, color: WHITE }, horizontalAlignment: "center" };
methodology.getRange("D5:D10").format = { fill: PALE_BLUE, font: { bold: true, color: TEXT } };
methodology.getRange("E5:E10").format.numberFormat = "#,##0";
setWidths(methodology, [26, 78, 4, 25, 16, 4], 18);
methodology.getRange("A5:B18").format.rowHeight = 36;
methodology.freezePanes.freezeRows(4);

const dashboard = sheets.get("Dashboard");
writeTitle(dashboard, "Public Reddit Sentiment and Discussion Analysis", "Aggregate analysis for the 60-program sample. No post-level content or Reddit user identifiers are included.", 12);
const counts = { Positive: 0, Neutral: 0, Negative: 0 };
for (const post of uniquePosts) counts[post.sentiment_label] += 1;
const metrics = [
  ["Raw posts parsed", payload.summary.raw_posts, "19 JSONL files"],
  ["Unique analyzed posts", uniquePosts.length, "After eligibility filters"],
  ["Institutions covered", payload.summary.institutions_covered, "Of 60 selected programs"],
  ["Positive headline share", counts.Positive / uniquePosts.length, "VADER title label"],
  ["Neutral headline share", counts.Neutral / uniquePosts.length, "VADER title label"],
  ["Negative headline share", counts.Negative / uniquePosts.length, "VADER title label"],
];
const anchors = [[0, 3], [4, 3], [8, 3], [0, 7], [4, 7], [8, 7]];
metrics.forEach(([label, value, note], index) => {
  const [col, row] = anchors[index];
  const labelRange = dashboard.getRangeByIndexes(row, col, 1, 3);
  const valueRange = dashboard.getRangeByIndexes(row + 1, col, 1, 3);
  const noteRange = dashboard.getRangeByIndexes(row + 2, col, 1, 3);
  labelRange.merge(); valueRange.merge(); noteRange.merge();
  labelRange.values = [[label]]; valueRange.values = [[value]]; noteRange.values = [[note]];
  labelRange.format = { fill: TEAL, font: { bold: true, color: WHITE, size: 9 }, horizontalAlignment: "center" };
  valueRange.format = { fill: PALE_BLUE, font: { bold: true, color: NAVY, size: 16 }, horizontalAlignment: "center" };
  valueRange.format.numberFormat = index >= 3 ? "0.0%" : "#,##0";
  noteRange.format = { fill: "#F7F9FB", font: { italic: true, color: TEXT, size: 8 }, horizontalAlignment: "center" };
});
dashboard.mergeCells("A11:L11");
dashboard.getRange("A11").values = [["Headline tone is mainly neutral. Admission outcomes, topics, and concern flags should be interpreted separately from sentiment."]];
dashboard.getRange("A11:L11").format = { fill: PALE_YELLOW, font: { bold: true, color: TEXT, size: 9 } };

const helperRow = 53;
dashboard.getRange(`A${helperRow}:B${helperRow + 3}`).values = [["Headline Sentiment", "Unique Posts"], ["Positive", counts.Positive], ["Neutral", counts.Neutral], ["Negative", counts.Negative]];
dashboard.getRange(`D${helperRow}:E${helperRow + monthlySummary.length}`).values = [["Month", "Mean Headline Compound"], ...monthlySummary.map((row) => [row.year_month, row.mean_compound])];
dashboard.getRange(`G${helperRow}:H${helperRow + topicSummary.length}`).values = [["Primary Topic", "Unique Posts"], ...topicSummary.map((row) => [row.primary_topic, row.unique_posts])];
dashboard.getRange(`J${helperRow}:K${helperRow + outcomeSummary.length}`).values = [["Admission Outcome", "Unique Posts"], ...outcomeSummary.map((row) => [row.outcome_label, row.unique_posts])];
for (const range of [`A${helperRow}:B${helperRow + 3}`, `D${helperRow}:E${helperRow + monthlySummary.length}`, `G${helperRow}:H${helperRow + topicSummary.length}`, `J${helperRow}:K${helperRow + outcomeSummary.length}`]) dashboard.getRange(range).format = { font: { color: TEXT, size: 8 }, borders: { preset: "all", style: "thin", color: BORDER } };
for (const range of [`A${helperRow}:B${helperRow}`, `D${helperRow}:E${helperRow}`, `G${helperRow}:H${helperRow}`, `J${helperRow}:K${helperRow}`]) dashboard.getRange(range).format = { fill: BLUE, font: { bold: true, color: WHITE, size: 8 }, borders: { preset: "all", style: "thin", color: BORDER } };

const sentimentChart = dashboard.charts.add("doughnut", dashboard.getRange(`A${helperRow}:B${helperRow + 3}`));
sentimentChart.title = "Headline Tone: Neutral Dominates"; sentimentChart.hasLegend = true; sentimentChart.setPosition("A13", "F29");
const trendChart = dashboard.charts.add("line", dashboard.getRange(`D${helperRow}:E${helperRow + monthlySummary.length}`));
trendChart.title = "Monthly Mean Headline Compound"; trendChart.hasLegend = false; trendChart.xAxis = { axisType: "textAxis", textStyle: { fontSize: 8 } }; trendChart.yAxis = { numberFormatCode: "0.00", min: -1, max: 1 }; trendChart.setPosition("G13", "L29");
const topicChart = dashboard.charts.add("bar", dashboard.getRange(`G${helperRow}:H${helperRow + topicSummary.length}`));
topicChart.title = "Discussion Volume by Primary Topic"; topicChart.hasLegend = false; topicChart.setPosition("A32", "F49");
const outcomeChart = dashboard.charts.add("bar", dashboard.getRange(`J${helperRow}:K${helperRow + outcomeSummary.length}`));
outcomeChart.title = "Admission Outcome Mentions"; outcomeChart.hasLegend = false; outcomeChart.setPosition("G32", "L49");
setWidths(dashboard, [14, 14, 14, 4, 14, 14, 14, 4, 14, 14, 14, 4], helperRow + monthlySummary.length);

const exported = await SpreadsheetFile.exportXlsx(workbook);
await exported.save(workbookPath);

const finalWorkbook = await SpreadsheetFile.importXlsx(await FileBlob.load(workbookPath));
const errors = await finalWorkbook.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A", options: { useRegex: true, maxResults: 100 }, summary: "public workbook formula error scan" });
await fs.writeFile(path.join(packageDir, "formula_error_scan.ndjson"), errors.ndjson, "utf8");
for (let index = 0; index < finalWorkbook.worksheets.items.length; index += 1) {
  const sheet = finalWorkbook.worksheets.getItemAt(index);
  const used = sheet.getUsedRange()?.values ?? [];
  const safe = sheet.name.replace(/[^a-z0-9]+/gi, "_");
  const preview = await finalWorkbook.render(sheet.name === "Dashboard" ? { sheetName: sheet.name, range: "A1:L80", scale: 0.8, format: "png" } : { sheetName: sheet.name, autoCrop: "all", scale: 0.8, format: "png" });
  await fs.writeFile(path.join(previewDir, `${String(index + 1).padStart(2, "0")}_${safe}.png`), new Uint8Array(await preview.arrayBuffer()));
  if (!used.length) throw new Error(`Rendered empty sheet: ${sheet.name}`);
}

function csvValue(value) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
async function writeCsv(name, rows) {
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(","), ...rows.map((row) => keys.map((key) => csvValue(row[key])).join(","))].join("\r\n") + "\r\n";
  await fs.writeFile(path.join(packageDir, name), csv, "utf8");
}
await writeCsv("reddit_institution_summary.csv", payload.institution_summary);
await writeCsv("reddit_subreddit_summary.csv", subredditSummary);
await writeCsv("reddit_monthly_summary.csv", monthlySummary);
await writeCsv("reddit_topic_summary.csv", topicSummary);
await writeCsv("reddit_outcome_summary.csv", outcomeSummary);
await writeCsv("reddit_concern_summary.csv", concernSummary);

async function sha256(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fsSync.createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
}
const manifest = [];
for (const statRow of payload.file_stats) {
  const filePath = path.join(rawDir, statRow.file_name);
  const stat = await fs.stat(filePath);
  manifest.push({
    file_name: statRow.file_name,
    subreddit: statRow.subreddit,
    source_type: statRow.source_type,
    size_bytes: stat.size,
    sha256: await sha256(filePath),
    raw_posts: statRow.raw_posts,
    earliest: statRow.earliest,
    latest: statRow.latest,
    analyzed_records: statRow.analyzed_records,
    public_distribution: "No - recollect from source under applicable platform terms",
  });
}
await writeCsv("reddit_raw_file_manifest.csv", manifest);

const readme = `# Reddit Sentiment Analysis Package\n\nThis package contains aggregate, de-identified outputs for the BUSA649 Community Project. It does not redistribute raw Reddit posts or user identifiers.\n\n## Included files\n\n- \`reddit_sentiment_analysis_top60_public.xlsx\`: public workbook with dashboard, institution summaries, trends, topics, outcomes, concerns, data quality, and methodology.\n- \`reddit_*_summary.csv\`: machine-readable aggregate tables.\n- \`reddit_raw_file_manifest.csv\`: filenames, counts, source windows, sizes, and SHA-256 checksums for the 19 local raw files.\n- \`analyze_reddit_sentiment.py\`, \`build_reddit_sentiment_report.mjs\`, and \`build_reddit_public_package.mjs\`: reproducibility scripts.\n\n## Data scope\n\n- 325,528 raw posts parsed from 19 JSONL files.\n- 4,713 unique eligible posts after relevance, language, NSFW, and empty-content filters.\n- 5,538 unique institution-post records across 52 of the 60 selected programs.\n- Overall window: 2024-07-01 to 2026-06-29. r/gradadmissions begins 2025-07-01.\n\n## Interpretation\n\nVADER headline sentiment is an exploratory tone measure, not a school ranking. Admission outcomes, topics, and concern flags are reported separately. Complete the local 120-row calibration sample before presenting automated sentiment as a final result.\n\n## Raw data\n\nThe raw JSONL files contain usernames, author IDs, post text, and removed/deleted content. They remain in the research team's local BUSA649 folder and are not committed to this public repository. The manifest supports integrity checks and reproducibility without republishing user content.\n\n## Source and platform notes\n\nReddit content remains subject to Reddit's current terms and the rights of individual content owners. Recollect data from the original source under applicable terms instead of redistributing this archive.\n\n- Reddit Data API Terms: https://redditinc.com/policies/data-api-terms\n- Reddit Developer Terms: https://redditinc.com/policies/developer-terms\n- Arctic Shift download tool used by the research team: https://arctic-shift.photon-reddit.com/download-tool\n`;
await fs.writeFile(path.join(packageDir, "README_REDDIT_ANALYSIS.md"), readme, "utf8");
await fs.copyFile("analyze_reddit_sentiment.py", path.join(packageDir, "analyze_reddit_sentiment.py"));
await fs.copyFile("build_reddit_sentiment_report.mjs", path.join(packageDir, "build_reddit_sentiment_report.mjs"));
await fs.copyFile("build_reddit_public_package.mjs", path.join(packageDir, "build_reddit_public_package.mjs"));

console.log(JSON.stringify({ packageDir: path.resolve(packageDir), workbook: path.resolve(workbookPath), files: (await fs.readdir(packageDir)).sort() }, null, 2));
