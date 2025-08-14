import fs from 'fs';
import path from 'path';
import { logger } from './logger.js';

export function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    logger.info(`Created directory: ${dirPath}`);
  }
}

export function fileExists(filePath) {
  return fs.existsSync(filePath);
}

export function getSafeFilePath(dir, fileName) {
  return path.resolve(dir, fileName);
}