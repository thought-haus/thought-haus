/** Format a Date as YYYYMMDDTHHMMSS for use as a note ID. */
export function formatTimestampId(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  );
}

/** Parse a YYYYMMDDTHHMMSS timestamp ID into a Date. */
export function parseTimestampId(id: string): Date | null {
  const m = id.match(
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/,
  );
  if (!m) return null;
  return new Date(
    Number(m[1]),
    Number(m[2]) - 1,
    Number(m[3]),
    Number(m[4]),
    Number(m[5]),
    Number(m[6]),
  );
}

/** Format a Date for display, e.g. "March 22, 2024". */
export function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Get the Monday at 00:00 of the week containing the given date. */
function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? 6 : day - 1; // distance back to Monday
  d.setDate(d.getDate() - diff);
  return d;
}

/** Get a relative date group label for the sidebar. */
export function getDateGroup(date: Date, now: Date = new Date()): string {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const noteDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffMs = today.getTime() - noteDay.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";

  const weekStart = startOfWeek(today);
  if (noteDay >= weekStart) return "This Week";

  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  if (noteDay >= lastWeekStart) return "Last Week";

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  if (noteDay >= monthStart) return "This Month";

  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  if (noteDay >= lastMonthStart) return "Last Month";

  return "Older";
}

/** Get a "Modified ..." date group label for last-modified sort. */
export function getModifiedDateGroup(date: Date, now?: Date): string {
  return `Modified ${getDateGroup(date, now)}`;
}
