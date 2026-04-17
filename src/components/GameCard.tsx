"use client";

import type { Game } from "@/lib/types";
import { useAppStore } from "@/lib/app-store";
import { formatDateTime } from "@/lib/format";
import { Avatar } from "./Avatar";
import {
  CalendarIcon,
  CheckIcon,
  LockIcon,
  MapPinIcon,
  TrophyIcon,
  UsersIcon,
} from "./icons";

interface GameCardProps {
  game: Game;
}

export function GameCard({ game }: GameCardProps) {
  const { getUser, currentUserId, joinGame, leaveGame } = useAppStore();
  const host = getUser(game.userId);
  if (!host) return null;

  const isHost = game.userId === currentUserId;
  const isJoined = game.playerIds.includes(currentUserId);
  const spotsLeft = game.maxPlayers - game.playerIds.length;
  const isFull = spotsLeft <= 0;

  return (
    <div className="bg-surface rounded-2xl p-4 mb-3">
      <div className="flex items-center gap-3 mb-3">
        <Avatar name={host.name} initials={host.initials} size={40} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-foreground text-[15px] leading-tight truncate">
              {host.name}
            </p>
            {game.isPrivate && <LockIcon size={12} color="#888" />}
          </div>
          <p className="text-muted text-xs mt-0.5">
            {isHost ? "you are hosting" : "hosting a game"}
          </p>
        </div>
        {isFull ? (
          <span className="text-xs font-medium text-muted bg-surface-light px-2 py-1 rounded-full">
            Full
          </span>
        ) : (
          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
            {spotsLeft} spot{spotsLeft === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-[14px]">
          <MapPinIcon size={14} color="#96FE17" />
          <span className="text-foreground">{game.court}</span>
        </div>
        <div className="flex items-center gap-2 text-[14px]">
          <CalendarIcon size={14} color="#96FE17" />
          <span className="text-foreground">{formatDateTime(game.date)}</span>
        </div>
        <div className="flex items-center gap-2 text-[14px]">
          <TrophyIcon size={14} color="#96FE17" />
          <span className="text-foreground">{game.minSkill}+ level</span>
        </div>
        <div className="flex items-center gap-2 text-[14px]">
          <UsersIcon size={14} color="#96FE17" />
          <span className="text-foreground">
            {game.playerIds.length} / {game.maxPlayers} players
          </span>
        </div>
        {game.notes && (
          <p className="text-muted text-[14px] leading-relaxed pt-1">
            {game.notes}
          </p>
        )}
      </div>

      <div className="mt-4">
        <GameActionButton
          isHost={isHost}
          isJoined={isJoined}
          isFull={isFull}
          onJoin={() => joinGame(game.id)}
          onLeave={() => leaveGame(game.id)}
        />
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
        className="w-full py-2.5 rounded-xl bg-surface-light text-muted text-sm font-semibold cursor-default flex items-center justify-center gap-2"
      >
        <CheckIcon size={16} color="#888" />
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
        <CheckIcon size={16} color="#96FE17" />
        Joined
      </button>
    );
  }

  if (isFull) {
    return (
      <button
        disabled
        className="w-full py-2.5 rounded-xl bg-surface-light text-muted text-sm font-semibold cursor-not-allowed"
      >
        Game full
      </button>
    );
  }

  return (
    <button
      onClick={onJoin}
      className="w-full py-2.5 rounded-xl bg-primary text-background text-sm font-semibold active:scale-[0.98] transition-transform"
    >
      Join game
    </button>
  );
}
