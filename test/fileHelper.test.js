import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { ensureDir, getSafeFilePath } from '../src/utils/fileHelper.js';

const tempDir = path.join(process.cwd(), 'temp_test_dir');

afterAll(() => {
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true });
  }
});

describe('fileHelper', () => {
  test('ensureDir should create directory if not exists', () => {
    ensureDir(tempDir);
    expect(fs.existsSync(tempDir)).toBe(true);
  });

  test('getSafeFilePath should sanitize filenames', () => {
    const safePath = getSafeFilePath(tempDir, 'test<>.mp4');
    expect(safePath).toMatch(/test__\.mp4$/);
  });
});
