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
  it("returns 'Today' for today's date", () => {
    expect(getDateGroup(new Date())).toBe("Today");
  });

  it("returns 'Yesterday' for yesterday", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(getDateGroup(yesterday)).toBe("Yesterday");
  });

  it("returns 'X days ago' for recent dates", () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    expect(getDateGroup(threeDaysAgo)).toBe("3 days ago");
  });

  it("returns formatted date for older dates", () => {
    const oldDate = new Date(2023, 0, 15);
    expect(getDateGroup(oldDate)).toBe("January 15, 2023");
  });
});
