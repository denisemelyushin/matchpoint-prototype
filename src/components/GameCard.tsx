"use client";

import { useRouter } from "next/navigation";
import type { Game } from "@/lib/types";
import { useAppStore } from "@/lib/app-store";
import { formatGameDate } from "@/lib/format";
import { Avatar } from "./Avatar";
import { CheckIcon, LockIcon, MapPinIcon } from "./icons";

interface GameCardProps {
  game: Game;
}

export function GameCard({ game }: GameCardProps) {
  const router = useRouter();
  const { getUser, currentUserId, joinGame, leaveGame } = useAppStore();
  const host = getUser(game.userId);
  if (!host) return null;

  const isHost = game.userId === currentUserId;
  const isJoined = currentUserId !== null && game.playerIds.includes(currentUserId);
  const spotsLeft = game.maxPlayers - game.playerIds.length;
  const isFull = spotsLeft <= 0;

  const handleCardClick = () => {
    router.push(`/game/${game.id}`);
  };

  const handleCardKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCardClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      className="bg-surface border border-border/60 rounded-2xl p-4 mb-3 cursor-pointer active:bg-foreground/5 transition-colors"
    >
      <div className="flex items-center gap-3 mb-4">
        <Avatar name={host.name} initials={host.initials} size={40} />
        <div className="flex-1 min-w-0 flex items-center gap-1.5">
          <p className="font-semibold text-foreground text-[15px] leading-tight truncate">
            {host.name}
          </p>
          {game.isPrivate && <LockIcon size={12} color="var(--color-muted)" />}
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

      <GameSchedule date={game.date} court={game.court} />

      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted bg-foreground/5 px-2 py-1 rounded-md">
          {game.minSkill}+
        </span>
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted bg-foreground/5 px-2 py-1 rounded-md">
          {game.playerIds.length}/{game.maxPlayers} players
        </span>
      </div>

      {game.notes && (
        <p className="text-muted text-[13px] leading-relaxed mt-3">
          {game.notes}
        </p>
      )}

      {/* stopPropagation so tapping the action button doesn't also fire the
          card-level navigate-to-detail click. */}
      <div className="mt-4" onClick={(e) => e.stopPropagation()}>
        <GameActionButton
          isHost={isHost}
          isJoined={isJoined}
          isFull={isFull}
          onJoin={() => {
            joinGame(game.id).catch((err) => {
              if (!(err instanceof Error) || err.message !== "auth-cancelled") {
                console.error("[GameCard] join failed:", err);
              }
            });
          }}
          onLeave={() => {
            leaveGame(game.id).catch((err) => {
              if (!(err instanceof Error) || err.message !== "auth-cancelled") {
                console.error("[GameCard] leave failed:", err);
              }
            });
          }}
        />
      </div>
    </div>
  );
}

function GameSchedule({ date, court }: { date: string; court: string }) {
  const { relative, dateLabel, time } = formatGameDate(date);
  // Nearby days collapse to just the relative word (e.g. "Today · 9:00 AM") —
  // showing the absolute date alongside would be redundant. Further-out games
  // show the short absolute date instead.
  const dayText = relative ?? dateLabel;
  return (
    <div className="mb-3 space-y-1">
      <p className="text-foreground text-[17px] font-semibold leading-tight tracking-tight">
        {dayText}
        <span className="mx-1.5 text-muted font-normal">·</span>
        {time}
      </p>
      <div className="flex items-center gap-2">
        <MapPinIcon size={14} color="var(--color-muted)" />
        <span className="text-muted text-[13px]">{court}</span>
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
        className="w-full py-2.5 rounded-xl bg-foreground/5 text-muted text-sm font-semibold cursor-default flex items-center justify-center gap-2"
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
        className="w-full py-2.5 rounded-xl border border-primary/40 bg-primary/10 text-primary text-sm font-semibold active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
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
        className="w-full py-2.5 rounded-xl bg-foreground/5 text-muted text-sm font-semibold cursor-not-allowed"
      >
        Game full
      </button>
    );
  }

  return (
    <button
      onClick={onJoin}
      className="w-full py-2.5 rounded-xl bg-primary text-[var(--app-primary-on)] text-sm font-semibold active:scale-[0.98] transition-transform"
    >
      Join game
    </button>
  );
}
