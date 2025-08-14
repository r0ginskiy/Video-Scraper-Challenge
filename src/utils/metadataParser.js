import fs from "fs";
import path from "path";
import { createObjectCsvWriter } from "csv-writer";
import { logger } from "./logger.js";
import { config } from "../config/index.js";
import { ensureDir } from "./fileHelper.js";

export function saveMetadataJSON(data, dir = config.metadataDir) {
  ensureDir(dir);
  const filePath = path.join(dir, "videos.json");
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  logger.info(`Saved metadata JSON: ${filePath}`);
}

export async function saveMetadataCSV(data, dir = config.metadataDir) {
  ensureDir(dir);
  const filePath = path.join(dir, "videos.csv");
  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: [
      { id: "url", title: "URL" },
      { id: "title", title: "Title" },
      { id: "duration", title: "Duration" },
      { id: "resolution", title: "Resolution" },
      { id: "status", title: "Status" },
    ],
  });
  await csvWriter.writeRecords(data);
  logger.info(`Saved metadata CSV: ${filePath}`);
}
