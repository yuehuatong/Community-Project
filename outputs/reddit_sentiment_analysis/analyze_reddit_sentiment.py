from __future__ import annotations

import csv
import json
import math
import random
import re
import statistics
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

import openpyxl


DEPS = Path.home() / "AppData/Local/Temp/codex_reddit_sentiment_deps"
sys.path.insert(0, str(DEPS))

from langdetect import DetectorFactory, LangDetectException, detect  # noqa: E402
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer  # noqa: E402


DetectorFactory.seed = 649

ACADEMIC_TERMS = [
    "application",
    "admission",
    "accepted",
    "acceptance",
    "offer",
    "rejection",
    "rejected",
    "waitlist",
    "master",
    "masters",
    "msc",
    "graduate",
    "grad school",
    "program",
    "programme",
    "degree",
    "curriculum",
    "course",
    "tuition",
    "fees",
    "scholarship",
    "internship",
    "placement",
    "career",
    "thesis",
    "capstone",
    "professor",
    "supervisor",
    "fieldwork",
]

GRADUATE_TERMS = [
    "application",
    "admission",
    "accepted",
    "offer",
    "rejection",
    "rejected",
    "waitlist",
    "master",
    "masters",
    "msc",
    "graduate",
    "postgraduate",
    "thesis",
    "dissertation",
    "capstone",
    "supervisor",
]

SUSTAINABILITY_TERMS = [
    "sustainability",
    "sustainable",
    "environment",
    "environmental",
    "climate",
    "esg",
    "renewable",
    "clean energy",
    "biodiversity",
    "conservation",
    "ecology",
    "carbon",
    "green finance",
    "sustainable finance",
    "sustainable development",
    "geospatial",
]

ALIAS_OVERRIDES = {
    1: ["Lund University"],
    2: ["University of Toronto", "U of T", "UofT"],
    3: ["UCL", "University College London"],
    4: ["University of Edinburgh", "Edinburgh University"],
    5: ["University of British Columbia", "UBC"],
    6: ["London School of Economics", "LSE"],
    7: ["Imperial College London", "Imperial College"],
    8: ["University of New South Wales", "UNSW Sydney", "UNSW"],
    9: ["McGill University", "McGill"],
    10: ["University of Manchester", "Manchester University"],
    11: ["ETH Zurich", "ETH Zuerich"],
    12: ["University of Melbourne", "UniMelb"],
    13: ["University of California Berkeley", "UC Berkeley"],
    14: ["Stanford University", "Stanford"],
    15: ["University of Oxford", "Oxford University"],
    16: ["University of Sydney", "Sydney University", "USYD"],
    17: ["Australian National University", "ANU"],
    18: ["King's College London", "Kings College London", "KCL"],
    19: ["University of Bristol", "Bristol University"],
    20: ["New York University", "NYU"],
    21: ["Pennsylvania State University", "Penn State"],
    22: ["KU Leuven"],
    23: ["University of Helsinki"],
    24: ["Durham University"],
    25: ["University of Leeds"],
    26: ["Western University", "University of Western Ontario", "Western Ontario"],
    27: ["University of Glasgow", "Glasgow University"],
    28: ["University of Auckland", "Auckland University"],
    29: ["Trinity College Dublin", "TCD"],
    30: ["University of Pennsylvania", "UPenn"],
    49: ["University of Exeter", "Exeter University"],
    52: ["Griffith University"],
    53: ["Western Sydney University"],
    54: ["Queen's University", "Queens University Canada"],
    55: ["Universiti Sains Malaysia", "USM Malaysia"],
    56: ["Hanyang University"],
    57: ["Hokkaido University"],
    58: ["Universiti Kebangsaan Malaysia", "National University of Malaysia", "UKM Malaysia"],
    59: ["Institut Agro Montpellier", "Institut Agro"],
    60: ["National Taiwan University", "NTU Taiwan"],
    61: ["University of Alberta", "UAlberta"],
    62: ["Korea University"],
    63: ["Universitas Airlangga", "Airlangga University"],
    64: ["Pusan National University", "Busan National University"],
    65: ["University of Tasmania", "UTAS"],
    66: ["McMaster University", "McMaster"],
    67: ["Chulalongkorn University"],
    68: ["Kyungpook National University"],
    69: ["Hong Kong University of Science and Technology", "HKUST"],
    70: ["Lovely Professional University"],
    71: ["University of Malaya", "UM Malaysia"],
    72: ["Aalborg University"],
    73: ["Kyung Hee University"],
    74: ["University of Victoria", "UVic"],
    76: ["Central Queensland University", "CQUniversity", "CQU Australia"],
    77: ["University of Newcastle Australia", "University of Newcastle", "UON Australia"],
    78: ["Northumbria University"],
    79: ["Universitas Indonesia", "University of Indonesia"],
    80: ["An-Najah National University", "An Najah University"],
    81: ["Arizona State University", "ASU"],
}

SCHOOL_FILE_TO_ID = {
    "r_LundUni_posts.jsonl": 1,
    "r_UofT_posts.jsonl": 2,
    "r_r_UCL_posts.jsonl": 3,
    "r_Edinburgh_University_posts.jsonl": 4,
    "r_r_UBC_posts.jsonl": 5,
    "r_r_LSE_posts.jsonl": 6,
    "r_Imperial_posts.jsonl": 7,
    "r_r_unsw_posts.jsonl": 8,
    "r_mcgill_posts.jsonl": 9,
    "r_r_manchester_uni_posts.jsonl": 10,
    "r_r_ethz_posts.jsonl": 11,
    "r_r_unimelb_posts.jsonl": 12,
    "r_r_berkeley_posts.jsonl": 13,
    "r_r_stanford_posts.jsonl": 14,
    "r_r_oxforduni_posts.jsonl": 15,
}

GENERAL_FILES = {
    "r_gradadmissions_posts.jsonl",
    "r_GradSchool_posts.jsonl",
    "r_sustainability_posts.jsonl",
    "r_sustainableFinance_posts.jsonl",
}

TOPIC_TERMS = {
    "Admissions": [
        "application",
        "admission",
        "accepted",
        "admitted",
        "offer",
        "rejected",
        "rejection",
        "waitlist",
        "decision",
        "gpa",
        "statement of purpose",
        "sop",
    ],
    "Curriculum": ["curriculum", "module", "course", "class", "elective", "specialization", "programme"],
    "Cost and Funding": ["tuition", "fee", "scholarship", "funding", "stipend", "loan", "expensive", "afford"],
    "Career and Placement": ["career", "job", "employment", "placement", "employer", "salary", "internship"],
    "Research and Thesis": ["research", "thesis", "dissertation", "supervisor", "professor", "lab", "fieldwork"],
    "Student Experience": ["campus", "housing", "community", "student life", "workload", "support", "experience"],
    "Sustainability Content": SUSTAINABILITY_TERMS,
}

CONCERN_TERMS = {
    "Anxiety or Uncertainty": ["anxious", "anxiety", "worried", "worry", "nervous", "panic", "uncertain", "confused"],
    "Stress or Burnout": ["stress", "stressed", "overwhelmed", "burnout", "exhausted", "depressed"],
    "Cost Concern": ["expensive", "afford", "debt", "loan", "tuition", "fee", "cost"],
    "Dissatisfaction": ["regret", "disappointed", "disappointing", "avoid", "terrible", "awful", "unfair"],
}


def normalize(value: object) -> str:
    text = str(value or "").replace("&", " and ").lower()
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def contains_phrase(haystack: str, phrase: str) -> bool:
    needle = normalize(phrase)
    return bool(needle) and f" {needle} " in f" {haystack} "


def find_terms(haystack: str, terms: list[str]) -> list[str]:
    return [term for term in terms if contains_phrase(haystack, term)]


def clean_body(value: object) -> str:
    text = str(value or "").strip()
    return "" if text.lower() in {"[deleted]", "[removed]"} else text


def clean_for_model(title: str, body: str) -> str:
    text = f"{title}. {title}. {body}"
    text = re.sub(r"https?://\S+", " ", text)
    text = re.sub(r"`+|\*+|#+|>+", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text[:12000]


def is_english(text: str) -> tuple[bool, str]:
    letters = [char for char in text if char.isalpha()]
    if not letters:
        return False, "unknown"
    ascii_share = sum(ord(char) < 128 for char in letters) / len(letters)
    if len(text) < 50:
        return ascii_share >= 0.85, "en-short" if ascii_share >= 0.85 else "unknown"
    try:
        language = detect(text[:2000])
    except LangDetectException:
        language = "unknown"
    return language == "en", language


def classify_outcome(haystack: str) -> str:
    patterns = {
        "Accepted or Offer": [r"\baccepted\b", r"\badmitted\b", r"\boffer letter\b", r"\breceived (?:an |the )?offer\b"],
        "Rejected": [r"\brejected\b", r"\brejection\b", r"\bdenied\b", r"\bunsuccessful\b"],
        "Waitlisted": [r"\bwaitlist(?:ed)?\b", r"\breserve list\b"],
        "Pending or Waiting": [r"\bpending\b", r"\bstill waiting\b", r"\bno decision\b", r"\bhaven t heard\b"],
    }
    hits = [label for label, expressions in patterns.items() if any(re.search(expression, haystack) for expression in expressions)]
    if not hits:
        return "Not an explicit outcome"
    if len(hits) > 1:
        return "Mixed or multiple outcomes"
    return hits[0]


def classify_topic(haystack: str) -> tuple[str, str]:
    hits = {topic: find_terms(haystack, terms) for topic, terms in TOPIC_TERMS.items()}
    active = [topic for topic, values in hits.items() if values]
    priority = [
        "Admissions",
        "Cost and Funding",
        "Career and Placement",
        "Research and Thesis",
        "Curriculum",
        "Student Experience",
        "Sustainability Content",
    ]
    primary = next((topic for topic in priority if topic in active), "Other")
    return primary, " | ".join(active)


def concern_flags(haystack: str) -> str:
    return " | ".join(topic for topic, terms in CONCERN_TERMS.items() if find_terms(haystack, terms))


def sentiment_label(compound: float) -> str:
    if compound >= 0.05:
        return "Positive"
    if compound <= -0.05:
        return "Negative"
    return "Neutral"


def iso_date(epoch: object) -> str:
    try:
        return datetime.fromtimestamp(float(epoch), timezone.utc).isoformat().replace("+00:00", "Z")
    except (TypeError, ValueError, OSError):
        return ""


def excerpt(value: str, limit: int = 600) -> str:
    text = re.sub(r"\s+", " ", value or "").strip()
    return text if len(text) <= limit else text[: limit - 3] + "..."


def mean_ci(values: list[float]) -> tuple[float | None, float | None, float | None]:
    if not values:
        return None, None, None
    mean = statistics.fmean(values)
    if len(values) == 1:
        return mean, None, None
    se = statistics.stdev(values) / math.sqrt(len(values))
    return mean, max(-1.0, mean - 1.96 * se), min(1.0, mean + 1.96 * se)


def sample_confidence(count: int) -> str:
    if count >= 100:
        return "High coverage"
    if count >= 30:
        return "Medium coverage"
    if count >= 10:
        return "Low coverage"
    if count > 0:
        return "Insufficient for comparison"
    return "No analyzed posts"


def load_institutions(selection_path: Path) -> list[dict]:
    workbook = openpyxl.load_workbook(selection_path, read_only=True, data_only=True)
    sheet = workbook["Selection Audit"]
    rows = []
    for row in sheet.iter_rows(min_row=5, values_only=True):
        if row[2] in (None, ""):
            continue
        institution_id = int(row[2])
        name = str(row[3])
        default_name = re.sub(r"\s*\([^)]*\)\s*", " ", re.sub(r"^The ", "", name)).strip()
        program = str(row[7] or "")
        aliases = ALIAS_OVERRIDES.get(institution_id, [default_name])
        program_aliases = [program]
        without_parenthetical = re.sub(r"\s*\([^)]*\)\s*", " ", program).strip()
        if without_parenthetical and without_parenthetical != program:
            program_aliases.append(without_parenthetical)
        program_aliases.extend(re.findall(r"\(([A-Z][A-Z0-9-]{2,})\)", program))
        rows.append(
            {
                "id": institution_id,
                "cohort": str(row[0]),
                "cohort_position": int(row[1]),
                "institution": name,
                "country": str(row[4]),
                "program": program,
                "institution_aliases": sorted(set(aliases)),
                "program_aliases": sorted({alias for alias in program_aliases if len(normalize(alias)) >= 4}),
            }
        )
    if len(rows) != 60 or len({row["id"] for row in rows}) != 60:
        raise RuntimeError("Expected 60 unique institutions in Selection Audit")
    return rows


def aggregate_rows(rows: list[dict], key_fields: list[str]) -> list[dict]:
    groups: dict[tuple, list[dict]] = defaultdict(list)
    for row in rows:
        groups[tuple(row[field] for field in key_fields)].append(row)
    output = []
    for key, group in sorted(groups.items(), key=lambda item: tuple(str(value) for value in item[0])):
        compounds = [float(row["compound"]) for row in group]
        mean, low, high = mean_ci(compounds)
        labels = Counter(row["sentiment_label"] for row in group)
        output.append(
            {
                **dict(zip(key_fields, key)),
                "post_records": len(group),
                "unique_posts": len({row["post_id"] for row in group}),
                "mean_compound": mean,
                "median_compound": statistics.median(compounds) if compounds else None,
                "mean_ci95_low": low,
                "mean_ci95_high": high,
                "positive": labels["Positive"],
                "neutral": labels["Neutral"],
                "negative": labels["Negative"],
                "positive_share": labels["Positive"] / len(group) if group else None,
                "negative_share": labels["Negative"] / len(group) if group else None,
            }
        )
    return output


def main() -> None:
    desktop = Path.home() / "Desktop"
    raw_dir = next(desktop.rglob("r_gradadmissions_posts.jsonl")).parent
    selection_path = next(desktop.rglob("program_source_data_top60_qs30_the30.xlsx"))
    output_dir = Path.cwd() / "outputs/reddit_sentiment_analysis"
    output_dir.mkdir(parents=True, exist_ok=True)

    institutions = load_institutions(selection_path)
    by_id = {row["id"]: row for row in institutions}
    analyzer = SentimentIntensityAnalyzer()
    analyzer.lexicon.update(
        {
            "accepted": 2.6,
            "admitted": 2.6,
            "offer": 1.8,
            "scholarship": 2.1,
            "rejected": -2.8,
            "rejection": -2.8,
            "denied": -2.5,
            "waitlisted": -1.2,
            "waitlist": -1.0,
            "anxious": -1.9,
            "worried": -1.8,
            "burnout": -2.6,
            "expensive": -1.6,
            "regret": -2.3,
            "disappointed": -2.4,
            "supportive": 2.0,
            "recommend": 2.0,
        }
    )

    file_stats = []
    analyzed_posts: dict[str, dict] = {}
    matched_rows = []
    global_ids = set()
    cross_file_duplicates = 0

    for file_path in sorted(raw_dir.glob("*.jsonl")):
        source_type = "General forum" if file_path.name in GENERAL_FILES else "School forum"
        fixed_id = SCHOOL_FILE_TO_ID.get(file_path.name)
        raw_count = malformed = deleted_removed = nsfw = low_relevance = non_english = 0
        high_count = medium_count = analyzed_count = duplicate_count = 0
        earliest = latest = None
        with file_path.open("r", encoding="utf-8", errors="replace") as handle:
            for line in handle:
                if not line.strip():
                    continue
                raw_count += 1
                try:
                    post = json.loads(line)
                except json.JSONDecodeError:
                    malformed += 1
                    continue
                post_id = str(post.get("id") or "")
                if post_id:
                    if post_id in global_ids:
                        cross_file_duplicates += 1
                        duplicate_count += 1
                    else:
                        global_ids.add(post_id)
                created_epoch = post.get("created_utc")
                try:
                    created_value = float(created_epoch)
                    earliest = created_value if earliest is None else min(earliest, created_value)
                    latest = created_value if latest is None else max(latest, created_value)
                except (TypeError, ValueError):
                    pass
                title = str(post.get("title") or "").strip()
                raw_body = str(post.get("selftext") or "").strip()
                body = clean_body(raw_body)
                if raw_body.lower() in {"[deleted]", "[removed]"}:
                    deleted_removed += 1
                if bool(post.get("over_18")):
                    nsfw += 1
                    continue
                haystack = normalize(f"{title} {body}")
                if not haystack:
                    continue
                academic_hits = find_terms(haystack, ACADEMIC_TERMS)
                graduate_hits = find_terms(haystack, GRADUATE_TERMS)
                sustainability_hits = find_terms(haystack, SUSTAINABILITY_TERMS)
                matches = []
                if source_type == "General forum":
                    for institution in institutions:
                        institution_hits = [alias for alias in institution["institution_aliases"] if contains_phrase(haystack, alias)]
                        program_hits = [alias for alias in institution["program_aliases"] if contains_phrase(haystack, alias)]
                        if not institution_hits and not program_hits:
                            continue
                        if program_hits or (institution_hits and academic_hits and sustainability_hits):
                            tier = "High"
                        elif institution_hits and (academic_hits or sustainability_hits):
                            tier = "Medium"
                        else:
                            tier = "Low"
                        review = []
                        if not institution_hits and program_hits:
                            review.append("Program-name-only match")
                        if institution_hits and all(len(normalize(alias).split()) == 1 and len(normalize(alias)) <= 5 for alias in institution_hits):
                            review.append("Acronym-only institution match")
                        if tier == "Low":
                            review.append("Institution-only context")
                        matches.append((institution, tier, institution_hits, program_hits, review))
                elif fixed_id in by_id:
                    institution = by_id[fixed_id]
                    program_hits = [alias for alias in institution["program_aliases"] if contains_phrase(haystack, alias)]
                    if program_hits:
                        matches.append((institution, "High", [], program_hits, []))
                    elif graduate_hits and sustainability_hits:
                        matches.append((institution, "Medium", [], [], ["School-forum contextual match"]))
                    elif sustainability_hits:
                        low_relevance += 1
                if not matches:
                    continue
                model_text = clean_for_model(title, body)
                english, language = is_english(model_text)
                if not english:
                    non_english += 1
                    continue
                # Use the post title as the primary tone signal. Full post bodies are
                # retained as a secondary score because long Reddit text pushes VADER
                # compounds toward extreme values and can obscure the author's headline.
                headline_scores = analyzer.polarity_scores(title)
                full_text_scores = analyzer.polarity_scores(model_text)
                label = sentiment_label(headline_scores["compound"])
                outcome = classify_outcome(haystack)
                primary_topic, topic_flags = classify_topic(haystack)
                concerns = concern_flags(haystack)
                created_iso = iso_date(created_epoch)
                subreddit = str(post.get("subreddit") or file_path.stem)
                permalink = str(post.get("permalink") or "")
                reddit_url = f"https://www.reddit.com{permalink if permalink.startswith('/') else '/' + permalink}" if permalink else f"https://www.reddit.com/r/{subreddit}/comments/{post_id}/"
                analyzed_posts.setdefault(
                    post_id,
                    {
                        "post_id": post_id,
                        "subreddit": subreddit,
                        "source_type": source_type,
                        "file_name": file_path.name,
                        "post_date_utc": created_iso,
                        "year_month": created_iso[:7],
                        "title": title,
                        "text_excerpt": excerpt(body),
                        "reddit_url": reddit_url,
                        "score": int(post.get("score") or 0),
                        "comments": int(post.get("num_comments") or 0),
                        "upvote_ratio": float(post.get("upvote_ratio")) if post.get("upvote_ratio") is not None else None,
                        "language": language,
                        "negative": headline_scores["neg"],
                        "neutral": headline_scores["neu"],
                        "positive": headline_scores["pos"],
                        "compound": headline_scores["compound"],
                        "sentiment_label": label,
                        "full_text_negative": full_text_scores["neg"],
                        "full_text_neutral": full_text_scores["neu"],
                        "full_text_positive": full_text_scores["pos"],
                        "full_text_compound": full_text_scores["compound"],
                        "full_text_sentiment_label": sentiment_label(full_text_scores["compound"]),
                        "outcome_label": outcome,
                        "primary_topic": primary_topic,
                        "topic_flags": topic_flags,
                        "concern_flags": concerns,
                    },
                )
                for institution, tier, institution_hits, program_hits, review in matches:
                    if tier == "Low":
                        low_relevance += 1
                        continue
                    if tier == "High":
                        high_count += 1
                    else:
                        medium_count += 1
                    analyzed_count += 1
                    matched_rows.append(
                        {
                            **analyzed_posts[post_id],
                            "institution_id": institution["id"],
                            "selection_cohort": institution["cohort"],
                            "cohort_position": institution["cohort_position"],
                            "institution": institution["institution"],
                            "country": institution["country"],
                            "program": institution["program"],
                            "relevance_tier": tier,
                            "match_basis": "Program name" if program_hits else ("School forum context" if source_type == "School forum" else "Institution name"),
                            "institution_aliases_matched": " | ".join(institution_hits),
                            "program_aliases_matched": " | ".join(program_hits),
                            "academic_keywords": " | ".join(academic_hits),
                            "sustainability_keywords": " | ".join(sustainability_hits),
                            "manual_review": "; ".join(review),
                        }
                    )
        file_stats.append(
            {
                "file_name": file_path.name,
                "subreddit": file_path.stem.removeprefix("r_").removesuffix("_posts"),
                "source_type": source_type,
                "raw_posts": raw_count,
                "malformed_lines": malformed,
                "deleted_removed_bodies": deleted_removed,
                "nsfw_excluded": nsfw,
                "non_english_excluded": non_english,
                "high_records": high_count,
                "medium_records": medium_count,
                "low_or_context_only": low_relevance,
                "analyzed_records": analyzed_count,
                "cross_file_duplicate_ids": duplicate_count,
                "earliest": iso_date(earliest)[:10] if earliest is not None else "",
                "latest": iso_date(latest)[:10] if latest is not None else "",
            }
        )

    # Deduplicate institution-post records while preserving the highest relevance tier.
    tier_order = {"High": 2, "Medium": 1}
    deduped: dict[tuple[str, int], dict] = {}
    for row in matched_rows:
        key = (row["post_id"], int(row["institution_id"]))
        prior = deduped.get(key)
        if prior is None or tier_order[row["relevance_tier"]] > tier_order[prior["relevance_tier"]]:
            deduped[key] = row
    matched_rows = list(deduped.values())
    matched_rows.sort(key=lambda row: (int(row["institution_id"]), row["post_date_utc"], row["post_id"]))

    institution_groups: dict[int, list[dict]] = defaultdict(list)
    for row in matched_rows:
        institution_groups[int(row["institution_id"])].append(row)
    institution_summary = []
    for institution in institutions:
        group = institution_groups[institution["id"]]
        compounds = [float(row["compound"]) for row in group]
        full_text_compounds = [float(row["full_text_compound"]) for row in group]
        mean, ci_low, ci_high = mean_ci(compounds)
        labels = Counter(row["sentiment_label"] for row in group)
        outcomes = Counter(row["outcome_label"] for row in group)
        topics = Counter(row["primary_topic"] for row in group)
        institution_summary.append(
            {
                "institution_id": institution["id"],
                "selection_cohort": institution["cohort"],
                "cohort_position": institution["cohort_position"],
                "institution": institution["institution"],
                "country": institution["country"],
                "program": institution["program"],
                "analyzed_records": len(group),
                "unique_posts": len({row["post_id"] for row in group}),
                "high_relevance": sum(row["relevance_tier"] == "High" for row in group),
                "medium_relevance": sum(row["relevance_tier"] == "Medium" for row in group),
                "general_forum": sum(row["source_type"] == "General forum" for row in group),
                "school_forum": sum(row["source_type"] == "School forum" for row in group),
                "mean_compound": mean,
                "median_compound": statistics.median(compounds) if compounds else None,
                "mean_full_text_compound": statistics.mean(full_text_compounds) if full_text_compounds else None,
                "mean_ci95_low": ci_low,
                "mean_ci95_high": ci_high,
                "positive": labels["Positive"],
                "neutral": labels["Neutral"],
                "negative": labels["Negative"],
                "positive_share": labels["Positive"] / len(group) if group else None,
                "negative_share": labels["Negative"] / len(group) if group else None,
                "accepted_or_offer": outcomes["Accepted or Offer"],
                "rejected": outcomes["Rejected"],
                "waitlisted": outcomes["Waitlisted"],
                "pending_or_waiting": outcomes["Pending or Waiting"],
                "top_topic": topics.most_common(1)[0][0] if topics else "",
                "sample_confidence": sample_confidence(len(group)),
                "interpretation_note": "Observational discussion sentiment; not a program-quality score." if group else "No eligible matched posts; sentiment intentionally left blank.",
            }
        )

    subreddit_summary = aggregate_rows(matched_rows, ["subreddit", "source_type"])
    monthly_summary = aggregate_rows(matched_rows, ["year_month", "source_type"])
    topic_summary = aggregate_rows(matched_rows, ["primary_topic"])
    outcome_summary = aggregate_rows(matched_rows, ["outcome_label"])

    all_compounds = [float(row["compound"]) for row in matched_rows]
    all_labels = Counter(row["sentiment_label"] for row in matched_rows)
    all_mean, all_ci_low, all_ci_high = mean_ci(all_compounds)
    summary = {
        "raw_files": len(file_stats),
        "raw_posts": sum(row["raw_posts"] for row in file_stats),
        "malformed_lines": sum(row["malformed_lines"] for row in file_stats),
        "deleted_removed_bodies": sum(row["deleted_removed_bodies"] for row in file_stats),
        "cross_file_duplicate_ids": cross_file_duplicates,
        "unique_analyzed_posts": len({row["post_id"] for row in matched_rows}),
        "institution_post_records": len(matched_rows),
        "institutions_covered": sum(row["analyzed_records"] > 0 for row in institution_summary),
        "positive": all_labels["Positive"],
        "neutral": all_labels["Neutral"],
        "negative": all_labels["Negative"],
        "positive_share": all_labels["Positive"] / len(matched_rows) if matched_rows else None,
        "negative_share": all_labels["Negative"] / len(matched_rows) if matched_rows else None,
        "mean_compound": all_mean,
        "mean_ci95_low": all_ci_low,
        "mean_ci95_high": all_ci_high,
        "median_compound": statistics.median(all_compounds) if all_compounds else None,
        "date_min": min((row["post_date_utc"] for row in matched_rows), default="")[:10],
        "date_max": max((row["post_date_utc"] for row in matched_rows), default="")[:10],
        "model": "VADER 3.3.2 with documented graduate-admissions lexicon extension",
        "primary_sentiment_unit": "Post title (headline tone); full-text sentiment retained as a secondary diagnostic",
        "language_rule": "English posts only; langdetect 1.0.9 with deterministic seed 649 and short-text ASCII fallback",
        "primary_scope": "High- and Medium-relevance records only; Low/context-only, NSFW, non-English, and empty records excluded",
    }

    randomizer = random.Random(649)
    calibration_sample = []
    for source_type in ["General forum", "School forum"]:
        for label in ["Positive", "Neutral", "Negative"]:
            candidates = [row for row in matched_rows if row["source_type"] == source_type and row["sentiment_label"] == label]
            for row in randomizer.sample(candidates, min(20, len(candidates))):
                calibration_sample.append(
                    {
                        "post_id": row["post_id"],
                        "institution": row["institution"],
                        "subreddit": row["subreddit"],
                        "source_type": row["source_type"],
                        "relevance_tier": row["relevance_tier"],
                        "model_label": row["sentiment_label"],
                        "compound": row["compound"],
                        "full_text_compound": row["full_text_compound"],
                        "outcome_label": row["outcome_label"],
                        "title": row["title"],
                        "text_excerpt": row["text_excerpt"],
                        "reddit_url": row["reddit_url"],
                        "human_label": "",
                        "review_note": "",
                    }
                )

    payload = {
        "summary": summary,
        "file_stats": file_stats,
        "institution_summary": institution_summary,
        "subreddit_summary": subreddit_summary,
        "monthly_summary": monthly_summary,
        "topic_summary": topic_summary,
        "outcome_summary": outcome_summary,
        "calibration_sample": calibration_sample,
        "analyzed_posts": matched_rows,
    }
    payload_path = output_dir / "reddit_sentiment_analysis_payload.json"
    payload_path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")

    csv_path = output_dir / "reddit_sentiment_analyzed_posts.csv"
    if matched_rows:
        with csv_path.open("w", newline="", encoding="utf-8-sig") as handle:
            writer = csv.DictWriter(handle, fieldnames=list(matched_rows[0].keys()))
            writer.writeheader()
            writer.writerows(matched_rows)

    print(json.dumps({"summary": summary, "payload": str(payload_path), "csv": str(csv_path)}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
