# Approach & Constraints — Video Scraper
_Date: 2025-08-16_

## Overview
The scraper wraps **yt-dlp** via Node.js (`child_process`), saving videos to `/videos` and metadata to `/metadata` (JSON + CSV). It is optimized for **robustness and explainability**: extensive logs, an explicit **failure taxonomy**, and deterministic retries. Validation uses **ffprobe** to check duration/streams/bitrate.

---

## What I Built
- **CLI** (`src/cli.js`): reads a list of URLs and options.
- **Services** (`src/services/scraper.js`): orchestrates 2‑pass download (probe → download).
- **Utils** (`src/utils/*`): logging, file helpers, metadata formatting (JSON + CSV).
- **Config** (`src/config/index.js`): height cap, retries, HLS flags, validation thresholds.
- **Docs** (`/docs`): approach, runbooks, and manual extractions.

**Default yt-dlp flags used:**
```bash
yt-dlp -f "bv*[height<=1080]+ba/best" <URL>   --no-part --hls-use-mpegts   --retries 3 --fragment-retries 5   --write-info-json --print filename
```

**Validation thresholds:**
- `minFilesizeBytes = 2_000_000`  
- `minDurationSec = 20`

---

## Failure Analysis — Summary
The following categories explain _why_ a URL may not produce a valid video and how we react:

- `teaser_or_partial` — only a tiny asset or a short teaser is resolved (common on news sites).  
  **Signals:** filesize < 2 MB, duration < 20s, or HLS with 1–2 segments.  
- `unsupported_or_js_app` — site requires JS app/tokenized manifests not handled by extractor.  
  **Signals:** `Unsupported URL`, empty `-F` list, generic extractor fallback.
- `drm_protected` — Widevine/FairPlay/PlayReady. **Skipped by policy** (no DRM circumvention).  
  **Signals:** license endpoints in network log, errors mentioning DRM/keys.
- `geoblocked` — region-locked.  
  **Signals:** HTTP 403/451 or region messages.
- `auth_required` — paywall or login required.  
  **Signals:** HTTP 401/402, session-only manifests.
- `expired_signed_url` — signed query params (Policy/Signature/Key-Pair-Id/JWT) expired before/while downloading.  
  **Signals:** 403 mid‑download; works again after page refresh.

Each failure is persisted with `category`, `technical_reason`, and suggested next steps.

---

## Case Studies (This Batch)

### 1) CNN — “Surgeon shows humanitarian crisis in Gaza's hospitals”
**URL**: https://edition.cnn.com/2025/07/16/world/video/maynard-gaza-hospitals-nada-bashir-digvid  
**Observed**: tiny output file → failed validation.  
**Likely root cause**: the extractor / page resolved a **teaser or tracking fragment** instead of the full HLS/DASH stream (common on CNN, where a Brightcove/custom player selects the real stream at runtime).

**How to attempt a fix (playbook):**
```bash
# 1) Probe available formats (store output to logs)
yt-dlp -v -F "<CNN_URL>" --user-agent "Mozilla/5.0"   --add-header "Referer:https://edition.cnn.com"   --add-header "Origin:https://edition.cnn.com"

# 2) Retry with HLS‑native and conservative selection
yt-dlp -v -f "bv*[height<=1080]+ba/best/best" "<CNN_URL>"   --hls-prefer-native --hls-use-mpegts --no-part   --retries 3 --fragment-retries 5   --user-agent "Mozilla/5.0"   --add-header "Referer:https://edition.cnn.com"   --add-header "Origin:https://edition.cnn.com"

# 3) If -F returns nothing or still tiny:
#    open DevTools → Network, start playback, filter by m3u8/mpd and copy the manifest URL.
#    Then download the manifest directly:
yt-dlp -v "<M3U8_OR_MPD_URL>" --hls-prefer-native --no-part
```
**Decision**: if the only resolvable asset remains tiny → tag `teaser_or_partial` and skip.

---

### 2) MAKO — soldiers article
**URL**: https://www.mako.co.il/pzm-soldiers/Article-b1fa03b6e651891027.htm  
**Observed**: `WARNING: [generic] Falling back on generic information extractor` → `ERROR: Unsupported URL`.  
**Likely root cause**: **JS‑application flow** producing **signed HLS URLs** and/or **DRM** not supported by the current extractor.

**How to attempt a fix (playbook):**
```bash
# 1) Make sure yt-dlp is up to date (extractors change frequently)
yt-dlp -U

# 2) Probe with headers and (if policy allows) session cookies from the browser
yt-dlp -v -F "<MAKO_URL>"   --user-agent "Mozilla/5.0"   --add-header "Referer:https://www.mako.co.il"   --add-header "Origin:https://www.mako.co.il"   --cookies-from-browser chrome   # or 'firefox' if applicable

# 3) If formats appear, download with standard flags
yt-dlp -v -f "bv*[height<=1080]+ba/best/best" "<MAKO_URL>"   --hls-prefer-native --hls-use-mpegts --no-part

# 4) If you see license requests / DRM errors → mark drm_protected and skip by policy.
```
**Decision**: `unsupported_or_js_app` unless a future extractor adds support; `drm_protected` if license flow is evident.

---

## Remediation Playbooks (Generic)

### A) `teaser_or_partial`
- **Detect**: filesize < 2 MB or duration < 20s.  
- **Try**: `--hls-prefer-native`, different `-f` selector, verify with `-F`, fetch manifest from DevTools.  
- **If still tiny**: mark and skip.

### B) `unsupported_or_js_app`
- **Detect**: empty `-F`, `Unsupported URL`.  
- **Try**: upgrade yt-dlp; add headers; `--cookies-from-browser <name>`; check if a site-specific extractor exists.  
- **If still unsupported**: mark; optionally track upstream yt-dlp issue.

### C) `drm_protected`
- **Detect**: license endpoints, DRM errors.  
- **Policy**: do not download — mark and skip.

### D) `geoblocked`
- **Detect**: HTTP 403/451; region messages.  
- **Policy**: no bypass; record region constraint.

### E) `auth_required`
- **Detect**: HTTP 401/402.  
- **Try**: `--cookies-from-browser <name>` if permitted; otherwise skip.

### F) `expired_signed_url`
- **Detect**: 403 mid‑download with signed query params.  
- **Try**: refresh cookies and retry immediately; shorten time between probe and download.

---

## Proof & Logging
For each URL we persist:
- Raw `-F` output (or the fact it was empty).
- Final command line flags (minus secrets).
- File size, duration (`ffprobe`), stream presence.
- Chosen `category` with a short **technical root cause** and **next steps**.

---

## Non‑Goals & Policy
- **No DRM circumvention.** DRM content is always skipped and labeled.  
- **No brute‑force token guessing** for signed URLs.  
- **Respect ToS / robots** and only use cookies if policy permits.

---

## Appendix — Quick Commands
```bash
# List formats
yt-dlp -v -F "<URL>"

# Typical download
yt-dlp -v -f "bv*[height<=1080]+ba/best/best" "<URL>"   --no-part --hls-use-mpegts --hls-prefer-native   --retries 3 --fragment-retries 5

# Save cookies directly from a desktop browser profile (if allowed)
yt-dlp --cookies-from-browser chrome "<URL>"
```
