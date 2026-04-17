import { REFERENCE_NOW } from "./time";

// Fixed locale so server and client produce identical output during hydration.
const LOCALE = "en-US";

export function formatRelative(timestamp: number): string {
  const diff = Math.max(0, REFERENCE_NOW - timestamp);
  const min = 60 * 1000;
  const hr = 60 * min;
  const day = 24 * hr;

  if (diff < min) return "just now";
  if (diff < hr) {
    const m = Math.floor(diff / min);
    return `${m} min ago`;
  }
  if (diff < day) {
    const h = Math.floor(diff / hr);
    return `${h} hr${h === 1 ? "" : "s"} ago`;
  }
  if (diff < 7 * day) {
    const d = Math.floor(diff / day);
    return `${d} day${d === 1 ? "" : "s"} ago`;
  }
  return new Date(timestamp).toLocaleDateString(LOCALE, {
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(LOCALE, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

// Short wall-clock time shown inside a chat bubble, e.g. "2:34 PM".
export function formatMessageTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString(LOCALE, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

const DAY_MS = 24 * 60 * 60 * 1000;

function utcDayIndex(ts: number): number {
  return Math.floor(ts / DAY_MS);
}

export function sameMessageDay(a: number, b: number): boolean {
  return utcDayIndex(a) === utcDayIndex(b);
}

// Label for the centered day separator between groups of messages.
// - Today / Yesterday for the two most recent days.
// - Weekday name for anything within the past week.
// - "April 12" / "April 12, 2024" for older messages.
//
// `now` lets the caller pick an explicit anchor for "today". This matters in
// the prototype where seeded data is tied to REFERENCE_NOW but user-sent
// messages carry real-time timestamps — the chat page passes whichever is
// latest so the newest day always reads as "Today" regardless of clock drift.
export function formatMessageDaySeparator(
  timestamp: number,
  now: number = REFERENCE_NOW
): string {
  const todayIdx = utcDayIndex(now);
  const dayIdx = utcDayIndex(timestamp);
  const diff = todayIdx - dayIdx;
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";

  const d = new Date(timestamp);
  if (diff > 0 && diff < 7) {
    return d.toLocaleDateString(LOCALE, {
      weekday: "long",
      timeZone: "UTC",
    });
  }

  const sameYear = d.getUTCFullYear() === new Date(now).getUTCFullYear();
  return d.toLocaleDateString(LOCALE, {
    month: "long",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
    timeZone: "UTC",
  });
}

export function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}
