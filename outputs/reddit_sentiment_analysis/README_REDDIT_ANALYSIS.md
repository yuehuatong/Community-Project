# Reddit Sentiment Analysis Package

This package contains aggregate, de-identified outputs for the BUSA649 Community Project. It does not redistribute raw Reddit posts or user identifiers.

## Included files

- `reddit_sentiment_analysis_top60_public.xlsx`: public workbook with dashboard, institution summaries, trends, topics, outcomes, concerns, data quality, and methodology.
- `reddit_*_summary.csv`: machine-readable aggregate tables.
- `reddit_raw_file_manifest.csv`: filenames, counts, source windows, sizes, and SHA-256 checksums for the 19 local raw files.
- `analyze_reddit_sentiment.py`, `build_reddit_sentiment_report.mjs`, and `build_reddit_public_package.mjs`: reproducibility scripts.

## Data scope

- 325,528 raw posts parsed from 19 JSONL files.
- 4,713 unique eligible posts after relevance, language, NSFW, and empty-content filters.
- 5,538 unique institution-post records across 52 of the 60 selected programs.
- Overall window: 2024-07-01 to 2026-06-29. r/gradadmissions begins 2025-07-01.

## Interpretation

VADER headline sentiment is an exploratory tone measure, not a school ranking. Admission outcomes, topics, and concern flags are reported separately. Complete the local 120-row calibration sample before presenting automated sentiment as a final result.

## Raw data

The raw JSONL files contain usernames, author IDs, post text, and removed/deleted content. They remain in the research team's local BUSA649 folder and are not committed to this public repository. The manifest supports integrity checks and reproducibility without republishing user content.

## Source and platform notes

Reddit content remains subject to Reddit's current terms and the rights of individual content owners. Recollect data from the original source under applicable terms instead of redistributing this archive.

- Reddit Data API Terms: https://redditinc.com/policies/data-api-terms
- Reddit Developer Terms: https://redditinc.com/policies/developer-terms
- Arctic Shift download tool used by the research team: https://arctic-shift.photon-reddit.com/download-tool
