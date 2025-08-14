import fs from 'fs';
import path from 'path';
import { createObjectCsvWriter } from 'csv-writer';
import { logger } from './logger.js';
import { config } from '../config/index.js';

export function saveMetadataJSON(metadata) {
  const filePath = path.resolve(config.metadataDir, 'videos.json');
  fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2), 'utf-8');
  logger.info(`Saved metadata JSON: ${filePath}`);
}

export async function saveMetadataCSV(metadata) {
  const filePath = path.resolve(config.metadataDir, 'videos.csv');
  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: Object.keys(metadata[0] || {}).map(key => ({ id: key, title: key }))
  });

  await csvWriter.writeRecords(metadata);
  logger.info(`Saved metadata CSV: ${filePath}`);
}
