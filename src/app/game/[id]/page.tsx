"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/app-store";
import { AppHeader } from "@/components/AppHeader";
import { Avatar } from "@/components/Avatar";
import { formatGameDate } from "@/lib/format";
import {
  CheckIcon,
  LockIcon,
  MapPinIcon,
} from "@/components/icons";

export default function GameDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const {
    getGame,
    getUser,
    currentUserId,
    joinGame,
    leaveGame,
  } = useAppStore();

  const game = getGame(id);
  const host = game ? getUser(game.userId) : undefined;

  if (!game || !host) {
    return (
      <div className="flex flex-col h-full bg-background">
        <AppHeader title="Game" onBack={() => router.push("/games")} />
        <div className="flex-1 flex items-center justify-center text-muted">
          Game not found
        </div>
      </div>
    );
  }

  const isHost = game.userId === currentUserId;
  const isJoined =
    currentUserId !== null && game.playerIds.includes(currentUserId);
  const spotsLeft = game.maxPlayers - game.playerIds.length;
  const isFull = spotsLeft <= 0;

  const { relative, dateLabel, time } = formatGameDate(game.date);
  const fullDate = new Date(game.date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-col h-full bg-background">
      <AppHeader title="Game" onBack={() => router.push("/games")} />

      <div className="flex-1 overflow-y-auto pb-8">
        {/* Summary card — same visual language as GameCard, a bit more
            spacious for the detail view. */}
        <div className="px-4 pt-4">
          <div className="bg-surface border border-border/60 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-5">
              <Avatar name={host.name} initials={host.initials} size={48} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-foreground text-[16px] leading-tight truncate">
                    {host.name}
                  </p>
                  {game.isPrivate && (
                    <LockIcon size={13} color="var(--color-muted)" />
                  )}
                </div>
                <p className="text-muted text-[12px] mt-0.5">Hosting</p>
              </div>
              {isFull ? (
                <span className="text-xs font-medium text-muted bg-foreground/5 px-2.5 py-1 rounded-full">
                  Full
                </span>
              ) : (
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                  {spotsLeft} spot{spotsLeft === 1 ? "" : "s"}
                </span>
              )}
            </div>

            <div className="mb-4 space-y-1.5">
              <p className="text-foreground text-[22px] font-semibold leading-tight tracking-tight">
                {relative ?? dateLabel}
                <span className="mx-2 text-muted font-normal">·</span>
                {time}
              </p>
              {relative && (
                <p className="text-muted text-[13px]">{fullDate}</p>
              )}
              <div className="flex items-center gap-2 pt-1">
                <MapPinIcon size={15} color="var(--color-muted)" />
                <span className="text-foreground text-[14px]">
                  {game.court}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted bg-foreground/5 px-2 py-1 rounded-md">
                {game.minSkill}+
              </span>
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted bg-foreground/5 px-2 py-1 rounded-md">
                {game.playerIds.length}/{game.maxPlayers} players
              </span>
              {game.isPrivate && (
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted bg-foreground/5 px-2 py-1 rounded-md flex items-center gap-1">
                  <LockIcon size={10} color="var(--color-muted)" />
                  Private
                </span>
              )}
            </div>

            {game.notes && (
              <p className="text-foreground/90 text-[14px] leading-relaxed mt-4 whitespace-pre-wrap">
                {game.notes}
              </p>
            )}

            <div className="mt-5">
              <GameActionButton
                isHost={isHost}
                isJoined={isJoined}
                isFull={isFull}
                onJoin={() => {
                  joinGame(game.id).catch((err) => {
                    if (
                      !(err instanceof Error) ||
                      err.message !== "auth-cancelled"
                    ) {
                      console.error("[game] join failed:", err);
                    }
                  });
                }}
                onLeave={() => {
                  leaveGame(game.id).catch((err) => {
                    if (
                      !(err instanceof Error) ||
                      err.message !== "auth-cancelled"
                    ) {
                      console.error("[game] leave failed:", err);
                    }
                  });
                }}
              />
            </div>
          </div>
        </div>

        {/* Players list */}
        <div className="px-4 mt-6">
          <div className="flex items-baseline justify-between mb-2 px-1">
            <h2 className="text-foreground text-[15px] font-semibold">
              Players
            </h2>
            <span className="text-muted text-[13px]">
              {game.playerIds.length} of {game.maxPlayers}
            </span>
          </div>
          <div className="bg-surface border border-border/60 rounded-2xl overflow-hidden">
            {game.playerIds.map((pid, idx) => {
              const player = getUser(pid);
              if (!player) return null;
              const isPlayerHost = pid === game.userId;
              const isPlayerSelf = pid === currentUserId;
              return (
                <div
                  key={pid}
                  className={`flex items-center gap-3 px-4 py-3 ${
                    idx > 0 ? "border-t border-border/60" : ""
                  }`}
                >
                  <Avatar
                    name={player.name}
                    initials={player.initials}
                    size={40}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-foreground text-[14px] truncate">
                        {player.name}
                      </p>
                      {isPlayerSelf && (
                        <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                          You
                        </span>
                      )}
                    </div>
                    <span className="inline-block text-[10px] font-medium uppercase tracking-wider text-muted bg-foreground/5 px-1.5 py-0.5 rounded mt-0.5">
                      {player.skillLevel}
                    </span>
                  </div>
                  {isPlayerHost && (
                    <span className="text-[11px] font-semibold text-muted bg-foreground/5 px-2 py-1 rounded-full shrink-0">
                      Host
                    </span>
                  )}
                </div>
              );
            })}

            {/* Empty slots — give a sense of how many spots remain. */}
            {Array.from({ length: spotsLeft }).map((_, idx) => (
              <div
                key={`slot-${idx}`}
                className={`flex items-center gap-3 px-4 py-3 ${
                  game.playerIds.length > 0 || idx > 0
                    ? "border-t border-border/60"
                    : ""
                }`}
              >
                <div className="w-10 h-10 rounded-full border border-dashed border-border/80 flex items-center justify-center" />
                <p className="text-muted text-[13px] italic">Open spot</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface GameActionButtonProps {
  isHost: boolean;
  isJoined: boolean;
  isFull: boolean;
  onJoin: () => void;
  onLeave: () => void;
}

function GameActionButton({
  isHost,
  isJoined,
  isFull,
  onJoin,
  onLeave,
}: GameActionButtonProps) {
  if (isHost) {
    return (
      <button
        disabled
        className="w-full py-3 rounded-xl bg-foreground/5 text-muted text-sm font-semibold cursor-default flex items-center justify-center gap-2"
      >
        <CheckIcon size={16} color="var(--color-muted)" />
        You&apos;re hosting
      </button>
    );
  }

  if (isJoined) {
    const handleLeave = () => {
      if (confirm("Leave this game?")) onLeave();
    };
    return (
      <button
        onClick={handleLeave}
        className="w-full py-3 rounded-xl border border-primary/40 bg-primary/10 text-primary text-sm font-semibold active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
      >
        <CheckIcon size={16} color="var(--color-primary)" />
        Joined
      </button>
    );
  }

  if (isFull) {
    return (
      <button
        disabled
        className="w-full py-3 rounded-xl bg-foreground/5 text-muted text-sm font-semibold cursor-not-allowed"
      >
        Game full
      </button>
    );
  }

  return (
    <button
      onClick={onJoin}
      className="w-full py-3 rounded-xl bg-primary text-[var(--app-primary-on)] text-sm font-semibold active:scale-[0.98] transition-transform"
    >
      Join game
    </button>
  );
}
