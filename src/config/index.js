import path from "path";

export const config = {
  videosDir: path.resolve("videos"),
  metadataDir: path.resolve("metadata"),
  defaultFormat: "mp4",
  csvFile: path.resolve("metadata", "videos.csv"),
  jsonFile: path.resolve("metadata", "videos.json"),
};
 