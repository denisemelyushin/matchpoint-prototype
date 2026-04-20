"use client";

import { useMemo, useState } from "react";
import { useAppStore } from "@/lib/app-store";
import { PlayerCard } from "@/components/PlayerCard";
import { EmptyState } from "@/components/EmptyState";

type PlayersFilter = "all" | "friends" | "pending";

export default function PlayersTabPage() {
  const {
    users,
    currentUserId,
    isFriend,
    incomingFriendRequests,
    outgoingFriendRequests,
  } = useAppStore();
  const [filter, setFilter] = useState<PlayersFilter>("all");

  const sortByName = (a: { name: string }, b: { name: string }) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" });

  const otherPlayers = useMemo(() => {
    const base = users.filter((u) => u.id !== currentUserId);
    const filtered =
      filter === "friends" ? base.filter((u) => isFriend(u.id)) : base;
    return [...filtered].sort(sortByName);
  }, [users, currentUserId, filter, isFriend]);

  const incomingUsers = useMemo(() => {
    return users
      .filter((u) => incomingFriendRequests.includes(u.id))
      .sort(sortByName);
  }, [users, incomingFriendRequests]);

  const outgoingUsers = useMemo(() => {
    return users
      .filter((u) => outgoingFriendRequests.includes(u.id))
      .sort(sortByName);
  }, [users, outgoingFriendRequests]);

  const pendingCount = incomingFriendRequests.length;

  return (
    <div className="px-4 py-2 pb-24">
      <PlayersFilterToggle
        value={filter}
        onChange={setFilter}
        pendingCount={pendingCount}
      />
      {filter === "pending" ? (
        <PendingList
          incoming={incomingUsers}
          outgoing={outgoingUsers}
        />
      ) : otherPlayers.length === 0 ? (
        <EmptyState
          text={
            filter === "friends"
              ? "No friends yet. Add players from All to get started."
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
  pendingCount,
}: {
  value: PlayersFilter;
  onChange: (v: PlayersFilter) => void;
  pendingCount: number;
}) {
  const options: Array<{ id: PlayersFilter; label: string }> = [
    { id: "all", label: "All" },
    { id: "friends", label: "Friends" },
    { id: "pending", label: "Pending" },
  ];
  return (
    <div
      role="tablist"
      aria-label="Players filter"
      className="flex p-1 rounded-full bg-surface-light mb-3"
    >
      {options.map((opt) => {
        const selected = value === opt.id;
        const showBadge = opt.id === "pending" && pendingCount > 0;
        return (
          <button
            key={opt.id}
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(opt.id)}
            className={`flex-1 text-[13px] font-medium py-1.5 rounded-full transition-colors flex items-center justify-center gap-1.5 ${
              selected
                ? "bg-primary text-[var(--app-primary-on)]"
                : "text-muted"
            }`}
          >
            {opt.label}
            {showBadge && (
              <span
                aria-label={`${pendingCount} pending request${
                  pendingCount === 1 ? "" : "s"
                }`}
                className={`min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-full text-[10px] font-semibold leading-none ${
                  selected
                    ? "bg-[var(--app-primary-on)] text-primary"
                    : "bg-primary text-[var(--app-primary-on)]"
                }`}
              >
                {pendingCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function PendingList({
  incoming,
  outgoing,
}: {
  incoming: ReturnType<typeof useAppStore>["users"];
  outgoing: ReturnType<typeof useAppStore>["users"];
}) {
  if (incoming.length === 0 && outgoing.length === 0) {
    return (
      <EmptyState text="No pending requests yet. Add players from All to get started." />
    );
  }
  return (
    <>
      {incoming.length > 0 && (
        <section className="mb-4">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted px-1 mb-2">
            Incoming
          </h2>
          {incoming.map((p) => (
            <PlayerCard key={p.id} player={p} variant="requests" />
          ))}
        </section>
      )}
      {outgoing.length > 0 && (
        <section>
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted px-1 mb-2">
            Sent
          </h2>
          {outgoing.map((p) => (
            <PlayerCard key={p.id} player={p} variant="requests" />
          ))}
        </section>
      )}
    </>
  );
}
