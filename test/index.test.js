import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { config } from '../src/config/index.js';

// Создаем мок-функцию
const downloadVideoMock = jest.fn();
jest.unstable_mockModule('../src/services/scraper.js', () => ({
  downloadVideo: downloadVideoMock
}));

// Импортируем после моков
const { scrapeVideos } = await import('../src/index.js');

const tempMeta = path.join(process.cwd(), 'temp_meta_test');

afterAll(() => {
  if (fs.existsSync(tempMeta)) {
    fs.rmSync(tempMeta, { recursive: true });
  }
});

describe('index', () => {
  beforeEach(() => {
    downloadVideoMock.mockReset();
  });

  test('should save metadata and failed.json', async () => {
    downloadVideoMock
      .mockResolvedValueOnce({ url: 'ok', title: 'OK', status: 'success' })
      .mockResolvedValueOnce({ url: 'fail', title: 'FAIL', status: 'failed' });

    config.metadataDir = tempMeta;
    config.videosDir = path.join(tempMeta, 'videos');

    await scrapeVideos(['http://ok', 'http://fail']);

    expect(fs.existsSync(path.join(tempMeta, 'videos.json'))).toBe(true);
    expect(fs.existsSync(path.join(tempMeta, 'failed.json'))).toBe(true);
  });
});
