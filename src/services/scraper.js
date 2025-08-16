import { logger } from "../utils/logger.js";
import { ensureDir, getSafeFilePath } from "../utils/fileHelper.js";
import { config } from "../config/index.js";
import { spawn } from "child_process";
import fs from "fs";

const MIN_FILE_SIZE = 50 * 1024;
const PY = process.env.PYTHON_BIN || "py";
const ERR_RE = /unsupported|drm|not available|extractor|geoblock/i;

const safeParseJSON = (s) => { try { return JSON.parse(s); } catch { return null; } };

async function fetchMetadata(url, fallback) {
  return new Promise((resolve) => {
    const p = spawn(PY, ["-m","yt_dlp","--skip-download","--no-playlist","--print-json",url]);
    let out = "";
    p.stdout.on("data", (d) => (out += d.toString()));
    p.on("close", () => {
      const md = safeParseJSON(out.split("\n").filter(Boolean).pop()) || {};
      resolve({
        title: md.title || fallback || "unknown",
        duration: md.duration ? `${md.duration}s` : "unknown",
        resolution: md.resolution || "unknown",
      });
    });
  });
}

export async function downloadVideo(url, index, attempt = 1, maxAttempts = 3) {
  ensureDir(config.videosDir);
  const fileName = `video_${index + 1}.mp4`;
  const filePath = getSafeFilePath(config.videosDir, fileName);
  logger.info(`[Attempt ${attempt}] Downloading: ${url}`);

  return new Promise((resolve) => {
    const ytdlp = spawn(PY, ["-m","yt_dlp","-o",filePath,"--no-playlist","--print-json",url]);
    let out = "", err = "";
    ytdlp.stdout.on("data", (d) => (out += d.toString()));
    ytdlp.stderr.on("data", (d) => (err += d.toString()));

    ytdlp.on("close", async (code) => {
      const errLower = err.toLowerCase();

      if (ERR_RE.test(errLower)) {
        const meta = await fetchMetadata(url, fileName);
        return resolve({ url, status:"skipped", reason:err.trim(), ...meta });
      }

      if (code === 0) {
        const md = safeParseJSON(out.split("\n").filter(Boolean).pop());
        if (!md) {
          const meta = await fetchMetadata(url, fileName);
          return resolve({ url, status:"failed", error:"Metadata parse error", ...meta });
        }

        let tooSmall;
        try { tooSmall = fs.statSync(filePath).size < MIN_FILE_SIZE; }
        catch { tooSmall = true; }

        if (tooSmall) {
          if (attempt < maxAttempts) {
            logger.warn(`Retrying ${url} (${attempt+1}/${maxAttempts})...`);
            return resolve(await downloadVideo(url,index,attempt+1,maxAttempts));
          }
          const meta = await fetchMetadata(url, md.title || fileName);
          return resolve({ url, status:"failed", error:"File too small", ...meta });
        }

        return resolve({
          url, status:"success",
          title: md.title || fileName,
          duration: md.duration ? `${md.duration}s` : "unknown",
          resolution: md.resolution || "unknown"
        });
      }

      if (attempt < maxAttempts) {
        logger.warn(`Retrying ${url} (${attempt+1}/${maxAttempts})...`);
        return resolve(await downloadVideo(url,index,attempt+1,maxAttempts));
      }
      const meta = await fetchMetadata(url, fileName);
      resolve({ url, status:"failed", error:err.trim(), ...meta });
    });
  });
}
