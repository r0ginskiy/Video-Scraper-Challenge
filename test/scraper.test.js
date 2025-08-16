import { jest } from "@jest/globals";
import fs from "fs";


const spawnMock = jest.fn();
jest.unstable_mockModule("child_process", () => ({
  spawn: spawnMock,
}));

jest.spyOn(fs, "existsSync").mockReturnValue(true);
jest
  .spyOn(fs, "statSync")
  .mockReturnValue({ size: 60 * 1024 }); 

const { downloadVideo } = await import("../src/services/scraper.js");

describe("scraper", () => {
  beforeEach(() => {
    spawnMock.mockReset();
  });

  test("should resolve with metadata when yt-dlp succeeds", async () => {
    const mockProcess = {
      stdout: {
        on: (event, cb) => {
          if (event === "data") cb('{"title":"Test Video","duration":10}');
        },
      },
      stderr: { on: () => {} },
      on: (event, cb) => {
        if (event === "close") cb(0);
      },
    };
    spawnMock.mockReturnValue(mockProcess);

    const result = await downloadVideo("http://example.com", 0);
    expect(result.status).toBe("success");
    expect(result.title).toBe("Test Video");
  });

  test("should return failed status when yt-dlp fails", async () => {
    const mockProcess = {
      stdout: { on: () => {} },
      stderr: {
        on: (event, cb) => {
          if (event === "data") cb("error");
        },
      },
      on: (event, cb) => {
        if (event === "close") cb(1);
      },
    };
    spawnMock.mockReturnValue(mockProcess);

    const result = await downloadVideo("http://example.com", 0);
    expect(result.status).toBe("failed");
    expect(result.error).toBe("error");
  });
});
