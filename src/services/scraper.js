import { logger } from '../utils/logger.js';
import { ensureDir, getSafeFilePath } from '../utils/fileHelper.js';
import { config } from '../config/index.js';
import { spawn } from 'child_process';

export async function downloadVideo(url, index, attempt = 1, maxAttempts = 3) {
  ensureDir(config.videosDir);

  const fileName = `video_${index + 1}.mp4`;
  const filePath = getSafeFilePath(config.videosDir, fileName);

  logger.info(`[Attempt ${attempt}] Downloading: ${url}`);

  return new Promise((resolve) => {
    const ytdlp = spawn('py', [
      '-m', 'yt_dlp',
      '-o', filePath,
      '--no-playlist',
      '--print-json',
      url
    ]);

    let output = '';
    let errorOutput = '';

    ytdlp.stdout.on('data', data => {
      output += data.toString();
    });

    ytdlp.stderr.on('data', data => {
      errorOutput += data.toString();
    });

    ytdlp.on('close', async (code) => {
      if (code === 0) {
        try {
          const metadata = JSON.parse(output.split('\n').filter(Boolean).pop());
          logger.info(`Downloaded: ${filePath}`);
          resolve({
            url,
            title: metadata.title || fileName,
            duration: metadata.duration ? `${metadata.duration}s` : 'unknown',
            resolution: metadata.resolution || 'unknown',
            status: 'success'
          });
        } catch {
          logger.error(`Failed to parse metadata for ${url}`);
          resolve({ url, title: fileName, status: 'failed' });
        }
      } else {
        logger.error(`yt-dlp exited with code ${code}: ${errorOutput}`);

        if (attempt < maxAttempts) {
          logger.warn(`Retrying ${url} (${attempt + 1}/${maxAttempts})...`);
          const retryResult = await downloadVideo(url, index, attempt + 1, maxAttempts);
          return resolve(retryResult);
        }

        resolve({ url, title: fileName, status: 'failed', error: errorOutput.trim() });
      }
    });
  });
}
