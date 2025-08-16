# Approach & Constraints — Video Scraper
_Date: 2025-08-16_

## Overview
The scraper wraps **yt-dlp** via Node.js (`child_process`), saving videos to `/videos` and metadata to `/metadata` (JSON + CSV). It is optimized for **robustness and explainability**: extensive logs, explicit **failure categories**, and deterministic retries.

## What I Built
- CLI (`src/cli.js`)
- Scraper service (`src/services/scraper.js`)
- Utilities (logger, fileHelper, metadataParser)
- Config (`src/config/index.js`)
- Docs (`/docs`)

## Validation thresholds
- minFilesizeBytes = 2 MB
- minDurationSec = 20
