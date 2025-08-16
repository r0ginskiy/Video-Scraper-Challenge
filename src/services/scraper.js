import { logger } from "../utils/logger.js";
import { ensureDir, getSafeFilePath } from "../utils/fileHelper.js";
import { config } from "../config/index.js";
import { spawn } from "child_process";
import fs from "fs";

const MIN_FILE_SIZE = 50 * 1024; 

async function fetchMetadata(url, fallbackTitle) {
  return new Promise((resolve) => {
    const proc = spawn("py", [
      "-m",
      "yt_dlp",
      "--skip-download",
      "--no-playlist",
      "--print-json",
      url,
    ]);

    let metaOutput = "";
    proc.stdout.on("data", (d) => (metaOutput += d.toString()));
    proc.on("close", () => {
      try {
        const metadata = JSON.parse(
          metaOutput.split("\n").filter(Boolean).pop()
        );
        resolve({
          title: metadata.title || fallbackTitle || "unknown",
          duration: metadata.duration ? `${metadata.duration}s` : "unknown",
          resolution: metadata.resolution || "unknown",
        });
      } catch {
        resolve({
          title: fallbackTitle || "unknown",
          duration: "unknown",
          resolution: "unknown",
        });
      }
    });
  });
}

export async function downloadVideo(url, index, attempt = 1, maxAttempts = 3) {
  ensureDir(config.videosDir);

  const fileName = `video_${index + 1}.mp4`;
  const filePath = getSafeFilePath(config.videosDir, fileName);

  logger.info(`[Attempt ${attempt}] Downloading: ${url}`);

  return new Promise((resolve) => {
    const ytdlp = spawn("py", [
      "-m",
      "yt_dlp",
      "-o",
      filePath,
      "--no-playlist",
      "--print-json",
      url,
    ]);

    let output = "";
    let errorOutput = "";

    ytdlp.stdout.on("data", (data) => {
      output += data.toString();
    });

    ytdlp.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    ytdlp.on("close", async (code) => {
      const errLower = errorOutput.toLowerCase();
      if (
        errLower.includes("unsupported url") ||
        errLower.includes("requested format is not available") ||
        errLower.includes("drm") ||
        errLower.includes("no suitable info extractor")
      ) {
        logger.warn(`Skipping unsupported URL: ${url}`);
        const meta = await fetchMetadata(url, fileName);
        return resolve({
          url,
          status: "skipped",
          reason: errorOutput.trim(),
          ...meta,
        });
      }

      if (code === 0) {
        try {
          const metadata = JSON.parse(output.split("\n").filter(Boolean).pop());

          if (
            !fs.existsSync(filePath) ||
            fs.statSync(filePath).size < MIN_FILE_SIZE
          ) {
            logger.error(`Downloaded file is too small: ${filePath}`);

            if (attempt < maxAttempts) {
              logger.warn(`Retrying ${url} (${attempt + 1}/${maxAttempts})...`);
              return resolve(
                await downloadVideo(url, index, attempt + 1, maxAttempts)
              );
            }

            const meta = await fetchMetadata(url, metadata.title || fileName);
            return resolve({
              url,
              status: "failed",
              error: "File too small",
              ...meta,
            });
          }

          logger.info(`Downloaded: ${filePath}`);
          return resolve({
            url,
            title: metadata.title || fileName,
            duration: metadata.duration ? `${metadata.duration}s` : "unknown",
            resolution: metadata.resolution || "unknown",
            status: "success",
          });
        } catch {
          logger.error(`Failed to parse metadata for ${url}`);
          const meta = await fetchMetadata(url, fileName);
          return resolve({
            url,
            status: "failed",
            error: "Metadata parse error",
            ...meta,
          });
        }
      } else {
        logger.error(`yt-dlp exited with code ${code}: ${errorOutput}`);

        if (attempt < maxAttempts) {
          logger.warn(`Retrying ${url} (${attempt + 1}/${maxAttempts})...`);
          return resolve(
            await downloadVideo(url, index, attempt + 1, maxAttempts)
          );
        }

        const meta = await fetchMetadata(url, fileName);
        return resolve({
          url,
          status: "failed",
          error: errorOutput.trim(),
          ...meta,
        });
      }
    });
  });
}
