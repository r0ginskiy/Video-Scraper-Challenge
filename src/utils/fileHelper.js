import fs from "fs";
import path from "path";
import { logger } from "./logger.js";

export function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    logger.info(`Created directory: ${dirPath}`);
  }
}

export function getSafeFilePath(dir, filename) {
  const safeName = filename.replace(/[<>:"/\\|?*]/g, "_");
  return path.join(dir, safeName);
}
