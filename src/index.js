import { logger } from "./utils/logger.js";
import { ensureDir } from "./utils/fileHelper.js";
import { saveMetadataJSON, saveMetadataCSV } from "./utils/metadataParser.js";
import { config } from "./config/index.js";

export async function scrapeVideos(urls) {
  ensureDir(config.videosDir);
  ensureDir(config.metadataDir);

  logger.info(`Received ${urls.length} URLs`);

  const dummyMetadata = urls.map((url, idx) => ({
    url,
    title: `Test video ${idx + 1}`,
    duration: "00:01:00",
    resolution: "1920x1080",
  }));

  saveMetadataJSON(dummyMetadata);
  await saveMetadataCSV(dummyMetadata);
}
