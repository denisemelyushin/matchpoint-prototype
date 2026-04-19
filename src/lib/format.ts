// Language/locale for month and weekday names. Timezone is intentionally
// NOT pinned — every absolute date/time rendered in the app (game cards,
// chat bubbles, day separators, post relative times) uses the user's
// local timezone, so the same game viewed from PT and ET will show
// different wall-clock times. This is safe here because all date-bearing
// data flows in from Firestore subscriptions that only run on the client,
// so SSR never emits a formatted date that could mismatch on hydration.
const LOCALE = "en-US";

export function formatRelative(timestamp: number): string {
  const diff = Math.max(0, Date.now() - timestamp);
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
  });
}

// Short wall-clock time shown inside a chat bubble, e.g. "2:34 PM".
export function formatMessageTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString(LOCALE, {
    hour: "numeric",
    minute: "2-digit",
  });
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Days-since-epoch computed against the LOCAL calendar. All "same day" /
// "Today / Yesterday / Tomorrow" comparisons in the UI are about the
// user's wall-clock day, so boundaries follow local midnight rather than
// UTC midnight. Without this, a message sent at 11:55 PM local and one
// at 12:05 AM local could land on the same UTC day (or vice versa),
// producing the wrong day separator in a chat.
function localDayIndex(ts: number): number {
  const d = new Date(ts);
  return Math.floor(
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / DAY_MS
  );
}

export function sameMessageDay(a: number, b: number): boolean {
  return localDayIndex(a) === localDayIndex(b);
}

// Label for the centered day separator between groups of messages.
// - Today / Yesterday for the two most recent days.
// - Weekday name for anything within the past week.
// - "April 12" / "April 12, 2024" for older messages.
export function formatMessageDaySeparator(
  timestamp: number,
  now: number = Date.now()
): string {
  const diff = localDayIndex(now) - localDayIndex(timestamp);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";

  const d = new Date(timestamp);
  if (diff > 0 && diff < 7) {
    return d.toLocaleDateString(LOCALE, {
      weekday: "long",
    });
  }

  const sameYear = d.getFullYear() === new Date(now).getFullYear();
  return d.toLocaleDateString(LOCALE, {
    month: "long",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
  });
}

// Rich formatter for game cards: separates the day label from the time so the
// UI can present them on different lines with distinct icons, and surfaces a
// short relative label ("Today"/"Tomorrow"/"Yesterday") when the game falls on
// a nearby day — matching the cadence used in the chat day separators.
export function formatGameDate(
  iso: string,
  now: number = Date.now()
): { relative: string | null; dateLabel: string; time: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return { relative: null, dateLabel: iso, time: "" };
  }

  const diff = localDayIndex(d.getTime()) - localDayIndex(now);
  let relative: string | null = null;
  if (diff === 0) relative = "Today";
  else if (diff === 1) relative = "Tomorrow";
  else if (diff === -1) relative = "Yesterday";

  const dateLabel = d.toLocaleDateString(LOCALE, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const time = d.toLocaleTimeString(LOCALE, {
    hour: "numeric",
    minute: "2-digit",
  });

  return { relative, dateLabel, time };
}

export function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}
