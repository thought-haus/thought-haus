import { describe, it, expect } from "vitest";
import {
  formatTimestampId,
  parseTimestampId,
  formatDisplayDate,
  getDateGroup,
} from "./date.ts";

describe("formatTimestampId", () => {
  it("formats a date as YYYYMMDDTHHMMSS", () => {
    const date = new Date(2024, 2, 22, 13, 18, 56); // March 22, 2024
    expect(formatTimestampId(date)).toBe("20240322T131856");
  });

  it("pads single-digit values", () => {
    const date = new Date(2024, 0, 5, 3, 7, 9); // Jan 5, 2024
    expect(formatTimestampId(date)).toBe("20240105T030709");
  });
});

describe("parseTimestampId", () => {
  it("parses a valid timestamp ID", () => {
    const date = parseTimestampId("20240322T131856");
    expect(date).not.toBeNull();
    expect(date!.getFullYear()).toBe(2024);
    expect(date!.getMonth()).toBe(2); // March
    expect(date!.getDate()).toBe(22);
    expect(date!.getHours()).toBe(13);
    expect(date!.getMinutes()).toBe(18);
    expect(date!.getSeconds()).toBe(56);
  });

  it("returns null for invalid format", () => {
    expect(parseTimestampId("not-a-date")).toBeNull();
    expect(parseTimestampId("2024-03-22")).toBeNull();
  });
});

describe("formatDisplayDate", () => {
  it("formats a date for display", () => {
    const date = new Date(2024, 2, 22);
    expect(formatDisplayDate(date)).toBe("March 22, 2024");
  });
});

describe("getDateGroup", () => {
  // Use a fixed "now": Thursday, February 12, 2026
  // Week starts Monday Feb 9
  const now = new Date(2026, 1, 12);

  it("returns 'Today' for today's date", () => {
    expect(getDateGroup(new Date(2026, 1, 12), now)).toBe("Today");
  });

  it("returns 'Yesterday' for yesterday", () => {
    expect(getDateGroup(new Date(2026, 1, 11), now)).toBe("Yesterday");
  });

  it("returns 'This Week' for earlier in the same week", () => {
    // Monday Feb 9 and Tuesday Feb 10 are earlier this week
    expect(getDateGroup(new Date(2026, 1, 9), now)).toBe("This Week");
    expect(getDateGroup(new Date(2026, 1, 10), now)).toBe("This Week");
  });

  it("returns 'Last Week' for the previous week", () => {
    // Mon Feb 2 – Sun Feb 8
    expect(getDateGroup(new Date(2026, 1, 2), now)).toBe("Last Week");
    expect(getDateGroup(new Date(2026, 1, 8), now)).toBe("Last Week");
  });

  it("returns 'This Month' for earlier in the same month", () => {
    expect(getDateGroup(new Date(2026, 1, 1), now)).toBe("This Month");
  });

  it("returns 'Last Month' for the previous month", () => {
    expect(getDateGroup(new Date(2026, 0, 15), now)).toBe("Last Month");
    expect(getDateGroup(new Date(2026, 0, 1), now)).toBe("Last Month");
  });

  it("returns 'Older' for dates before last month", () => {
    expect(getDateGroup(new Date(2025, 11, 31), now)).toBe("Older");
    expect(getDateGroup(new Date(2023, 0, 15), now)).toBe("Older");
  });
});
