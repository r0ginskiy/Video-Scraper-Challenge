import { logger } from './utils/logger.js';
import { ensureDir } from './utils/fileHelper.js';
import { saveMetadataJSON, saveMetadataCSV } from './utils/metadataParser.js';
import { config } from './config/index.js';
import { downloadVideo } from './services/scraper.js';
import fs from 'fs';
import path from 'path';

export async function scrapeVideos(urls) {
  ensureDir(config.videosDir);
  ensureDir(config.metadataDir);

  logger.info(`Received ${urls.length} URLs`);

  const metadata = [];
  const failed = [];

  for (let i = 0; i < urls.length; i++) {
    try {
      const data = await downloadVideo(urls[i].trim(), i);
      metadata.push(data);

      if (data.status !== 'success') {
        failed.push(data);
      }
    } catch (err) {
      logger.error(`Error downloading ${urls[i]}: ${err.message}`);
      failed.push({ url: urls[i], status: 'failed', error: err.message });
    }
  }

  saveMetadataJSON(metadata);
  await saveMetadataCSV(metadata);

  if (failed.length > 0) {
    const failedPath = path.join(config.metadataDir, 'failed.json');
    fs.writeFileSync(failedPath, JSON.stringify(failed, null, 2));
    logger.warn(`Some videos failed. See ${failedPath}`);
  }

  logger.info(`Downloaded: ${metadata.filter(v => v.status === 'success').length}, Failed: ${failed.length}`);
}
