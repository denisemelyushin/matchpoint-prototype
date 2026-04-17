"use client";

import { useRouter } from "next/navigation";
import type { User } from "@/lib/types";
import { Avatar } from "./Avatar";
import { MessageCircleIcon } from "./icons";
import { useAppStore } from "@/lib/app-store";

interface PlayerCardProps {
  player: User;
}

export function PlayerCard({ player }: PlayerCardProps) {
  const router = useRouter();
  const { startOrGetChat } = useAppStore();

  const handleMessage = (e: React.MouseEvent) => {
    e.stopPropagation();
    const chatId = startOrGetChat(player.id);
    router.push(`/chat/${chatId}`);
  };

  return (
    <div className="bg-surface border border-border/60 rounded-2xl p-4 mb-3 flex items-center gap-3">
      <Avatar name={player.name} initials={player.initials} size={52} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-foreground text-[15px] truncate">
            {player.name}
          </p>
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted bg-white/5 px-1.5 py-0.5 rounded">
            {player.skillLevel}
          </span>
        </div>
        {player.bio && (
          <p className="text-muted text-xs mt-1 line-clamp-2">{player.bio}</p>
        )}
      </div>
      <button
        onClick={handleMessage}
        className="p-2 rounded-full bg-primary/10 active:scale-90 transition-transform shrink-0"
        aria-label={`Message ${player.name}`}
      >
        <MessageCircleIcon size={18} color="#96FE17" />
      </button>
    </div>
  );
}
