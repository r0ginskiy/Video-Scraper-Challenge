import { logger } from './utils/logger.js';

export function scrapeVideos(urls) {
  logger.info(`Received ${urls.length} URLs`);
  urls.forEach(url => logger.info(`Processing: ${url}`));
}
