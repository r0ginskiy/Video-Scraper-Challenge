import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { saveMetadataJSON, saveMetadataCSV } from '../src/utils/metadataParser.js';

const tempDir = path.join(process.cwd(), 'temp_metadata_test');

afterAll(() => {
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true });
  }
});

describe('metadataParser', () => {
  const data = [
    { url: 'http://example.com', title: 'Video 1', duration: '10s', resolution: '1080p', status: 'success' }
  ];

  test('saveMetadataJSON should create a JSON file', () => {
    saveMetadataJSON(data, tempDir);
    const filePath = path.join(tempDir, 'videos.json');
    expect(fs.existsSync(filePath)).toBe(true);
  });

  test('saveMetadataCSV should create a CSV file', async () => {
    await saveMetadataCSV(data, tempDir);
    const filePath = path.join(tempDir, 'videos.csv');
    expect(fs.existsSync(filePath)).toBe(true);
  });
});
