"use client";

import { useMemo, useState } from "react";
import { useAppStore } from "@/lib/app-store";
import { PlayerCard } from "@/components/PlayerCard";
import { EmptyState } from "@/components/EmptyState";

type PlayersFilter = "all" | "friends";

export default function PlayersTabPage() {
  const { users, currentUserId, isFriend } = useAppStore();
  const [filter, setFilter] = useState<PlayersFilter>("all");

  const otherPlayers = useMemo(() => {
    const base = users.filter((u) => u.id !== currentUserId);
    const filtered =
      filter === "friends" ? base.filter((u) => isFriend(u.id)) : base;
    return [...filtered].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );
  }, [users, currentUserId, filter, isFriend]);

  return (
    <div className="px-4 py-2 pb-24">
      <PlayersFilterToggle value={filter} onChange={setFilter} />
      {otherPlayers.length === 0 ? (
        <EmptyState
          text={
            filter === "friends"
              ? "No friends yet. Add players from All players."
              : "No players yet."
          }
        />
      ) : (
        otherPlayers.map((p) => <PlayerCard key={p.id} player={p} />)
      )}
    </div>
  );
}

function PlayersFilterToggle({
  value,
  onChange,
}: {
  value: PlayersFilter;
  onChange: (v: PlayersFilter) => void;
}) {
  const options: Array<{ id: PlayersFilter; label: string }> = [
    { id: "all", label: "All players" },
    { id: "friends", label: "My friends" },
  ];
  return (
    <div
      role="tablist"
      aria-label="Players filter"
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
            className={`flex-1 text-[13px] font-medium py-1.5 rounded-full transition-colors ${
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
