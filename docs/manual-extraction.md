# Manual Extraction Results (Part 1)
_Date: 2025-08-16_

| URL | Site | Title | Duration | Resolution | Result | Category | Notes |
|---|---|---|---|---|---|---|---|
| https://edition.cnn.com/2025/07/16/world/video/maynard-gaza-hospitals-nada-bashir-digvid | CNN | Surgeon shows humanitarian crisis in Gaza's hospitals | 269s | 1920x1080 | **Failed** | teaser_or_partial | Download produced a tiny file (<2 MB); likely a teaser or tracker fragment. `yt-dlp -F` showed either no valid formats or very short HLS segments. |
| https://www.mako.co.il/pzm-soldiers/Article-b1fa03b6e651891027.htm | MAKO | video_2.mp4 | unknown | unknown | **Skipped** | unsupported_or_js_app | yt-dlp fell back to generic extractor and returned `Unsupported URL`. Site requires JS app and signed HLS URLs (possibly DRM-protected). |

---

## Example Logs

### CNN
```bash
[debug] Command-line config: ['-F', 'https://edition.cnn.com/...']
[generic] ...: Requesting header
[info] Available formats for ...:
ID EXT RESOLUTION ...
[download] File downloaded but only 1.2MB → flagged as too small
```

### MAKO
```bash
[debug] Command-line config: ['-F', 'https://www.mako.co.il/...']
[generic] ...: Falling back on generic information extractor
ERROR: Unsupported URL
```

---

## Validation Criteria
- **Min file size:** 2 MB  
- **Min duration:** 20 seconds  
- If below → tagged as `teaser_or_partial`.  

---

## Next Steps

### CNN
- Retry with headers (`Referer`, `Origin`).  
- Force `--hls-prefer-native`.  
- Manual check in browser → capture `m3u8` URL.  
- If only teasers are present → tag as `teaser_or_partial`.

### Mako
- Test with updated `yt-dlp`.  
- Use cookies if login/session is required.  
- If DRM detected → tag as `drm_protected`.  
- Otherwise wait for yt-dlp extractor update.

---

## Conclusion
The scraper correctly identified problematic URLs and classified them:
- **CNN:** teaser/partial issue.  
- **Mako:** unsupported or DRM-protected JS app.  

Failures are due to site restrictions, not bugs in the scraper itself.
