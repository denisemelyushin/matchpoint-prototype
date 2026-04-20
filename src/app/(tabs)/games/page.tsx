"use client";

import { useMemo, useState } from "react";
import { useAppStore } from "@/lib/app-store";
import { GameCard } from "@/components/GameCard";
import { EmptyState } from "@/components/EmptyState";

type GamesFilter = "upcoming" | "today" | "tomorrow" | "weekend";

const DAY_MS = 24 * 60 * 60 * 1000;

function computeGameRanges(now: number) {
  const d = new Date(now);
  const startOfToday = new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate()
  ).getTime();
  const startOfTomorrow = startOfToday + DAY_MS;
  const endOfTomorrow = startOfTomorrow + DAY_MS;

  // 0 = Sunday, 6 = Saturday
  const dayOfWeek = d.getDay();
  let weekendStart: number;
  let weekendEnd: number;
  if (dayOfWeek === 6) {
    weekendStart = startOfToday;
    weekendEnd = startOfToday + 2 * DAY_MS;
  } else if (dayOfWeek === 0) {
    weekendStart = startOfToday;
    weekendEnd = startOfToday + DAY_MS;
  } else {
    const daysUntilSat = 6 - dayOfWeek;
    weekendStart = startOfToday + daysUntilSat * DAY_MS;
    weekendEnd = weekendStart + 2 * DAY_MS;
  }

  return {
    startOfToday,
    startOfTomorrow,
    endOfTomorrow,
    weekendStart,
    weekendEnd,
  };
}

export default function GamesTabPage() {
  const { games, canSeePrivateContentFrom } = useAppStore();
  const [filter, setFilter] = useState<GamesFilter>("upcoming");

  const visibleGames = useMemo(() => {
    const now = Date.now();
    const {
      startOfToday,
      startOfTomorrow,
      endOfTomorrow,
      weekendStart,
      weekendEnd,
    } = computeGameRanges(now);

    return games
      .filter((g) => !g.isPrivate || canSeePrivateContentFrom(g.userId))
      .filter((g) => {
        const t = new Date(g.date).getTime();
        switch (filter) {
          case "today":
            // Everything scheduled for today's local date, including games
            // earlier today that have already finished.
            return t >= startOfToday && t < startOfTomorrow;
          case "tomorrow":
            return t >= startOfTomorrow && t < endOfTomorrow;
          case "weekend":
            // Future-weekend games only — past weekend games shouldn't
            // linger here when scrolling mid-weekend.
            return t >= Math.max(now, weekendStart) && t < weekendEnd;
          case "upcoming":
          default:
            // Strictly future: any game whose start time has already passed
            // is hidden, so "Yesterday" / past-today games never appear.
            return t >= now;
        }
      })
      .sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
  }, [games, canSeePrivateContentFrom, filter]);

  return (
    <div className="px-4 py-2 pb-24">
      <GamesFilterToggle value={filter} onChange={setFilter} />
      {visibleGames.length === 0 ? (
        <EmptyState text={emptyText(filter)} />
      ) : (
        visibleGames.map((game) => <GameCard key={game.id} game={game} />)
      )}
    </div>
  );
}

function GamesFilterToggle({
  value,
  onChange,
}: {
  value: GamesFilter;
  onChange: (v: GamesFilter) => void;
}) {
  const options: Array<{ id: GamesFilter; label: string }> = [
    { id: "upcoming", label: "Upcoming" },
    { id: "today", label: "Today" },
    { id: "tomorrow", label: "Tomorrow" },
    { id: "weekend", label: "Weekend" },
  ];
  return (
    <div
      role="tablist"
      aria-label="Games filter"
      className="flex p-1 rounded-full bg-surface-light mb-3"
    >
      {options.map((opt) => {
        const selected = value === opt.id;
        return (
          <button
            key={opt.id}
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(opt.id)}
            className={`flex-1 text-[12px] font-medium py-1.5 rounded-full transition-colors ${
              selected
                ? "bg-primary text-[var(--app-primary-on)]"
                : "text-muted"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function emptyText(filter: GamesFilter): string {
  switch (filter) {
    case "today":
      return "No games today.";
    case "tomorrow":
      return "No games tomorrow.";
    case "weekend":
      return "No games this weekend.";
    case "upcoming":
    default:
      return "No upcoming games. Create one!";
  }
}
