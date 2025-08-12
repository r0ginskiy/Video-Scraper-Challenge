#!/usr/bin/env node
import fs from "fs";
import { scrapeVideos } from "./index.js";

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error("Provide a file with URLs or a list of URLs.");
  process.exit(1);
}

let urls = [];

if (fs.existsSync(args[0])) {
  urls = fs.readFileSync(args[0], "utf-8").split("\n").filter(Boolean);
} else {
  urls = args;
}

scrapeVideos(urls);
