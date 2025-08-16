# Video Scraper

_Date: 2025-08-16_

## Requirements
- Node.js 18+
- Python 3.8+ (for yt-dlp)
- ffmpeg in PATH

## Setup
```bash
git clone <repo-url> video-scraper
cd video-scraper
npm install
pip install -U yt-dlp
# install ffmpeg via package manager or from https://ffmpeg.org
```

## Run
```bash
node src/cli.js urls.txt
```

- `urls.txt` = list of URLs, one per line
- Videos saved to `./videos/`
- Metadata saved to `./metadata/videos.json` and `./metadata/videos.csv`
- Failed downloads saved to `./metadata/failed.json`

## Docs
- `approach.md` — implementation details and constraints
- `manual-extraction.md` — why videos failed or succeeded
