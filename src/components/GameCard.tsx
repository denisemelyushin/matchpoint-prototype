"use client";

import type { Game } from "@/lib/types";
import { useAppStore } from "@/lib/app-store";
import { formatDateTime } from "@/lib/format";
import { Avatar } from "./Avatar";
import {
  CalendarIcon,
  MapPinIcon,
  UsersIcon,
  TrophyIcon,
  LockIcon,
} from "./icons";

interface GameCardProps {
  game: Game;
}

export function GameCard({ game }: GameCardProps) {
  const { getUser } = useAppStore();
  const host = getUser(game.userId);
  if (!host) return null;

  const spotsLeft = game.maxPlayers - game.playerIds.length;

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
          <p className="text-muted text-xs mt-0.5">hosting a game</p>
        </div>
        {spotsLeft > 0 ? (
          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
            {spotsLeft} spot{spotsLeft === 1 ? "" : "s"}
          </span>
        ) : (
          <span className="text-xs font-medium text-muted bg-surface-light px-2 py-1 rounded-full">
            Full
          </span>
        )}
      </div>

      <div className="space-y-2 mb-3">
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
      </div>

      {game.notes && (
        <p className="text-muted text-sm leading-relaxed pt-3 border-t border-border">
          {game.notes}
        </p>
      )}
    </div>
  );
}
