"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/types";
import { Avatar } from "./Avatar";
import { MessageCircleIcon, UserPlusIcon, UserCheckIcon } from "./icons";
import { ConfirmDialog } from "./ConfirmDialog";
import { useAppStore } from "@/lib/app-store";

interface PlayerCardProps {
  player: User;
}

export function PlayerCard({ player }: PlayerCardProps) {
  const router = useRouter();
  const { startOrGetChat, isFriend, toggleFriend } = useAppStore();
  const friend = isFriend(player.id);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);

  const handleMessage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const chatId = await startOrGetChat(player.id);
      router.push(`/chat/${chatId}`);
    } catch (err) {
      // Swallow cancelled auth; log anything else.
      if (!(err instanceof Error) || err.message !== "auth-cancelled") {
        console.error("[PlayerCard] failed to start chat:", err);
      }
    }
  };

  const handleFriendToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (friend) {
      setConfirmRemoveOpen(true);
      return;
    }
    try {
      await toggleFriend(player.id);
    } catch (err) {
      if (!(err instanceof Error) || err.message !== "auth-cancelled") {
        console.error("[PlayerCard] failed to add friend:", err);
      }
    }
  };

  const confirmRemove = async () => {
    setConfirmRemoveOpen(false);
    try {
      await toggleFriend(player.id);
    } catch (err) {
      console.error("[PlayerCard] failed to remove friend:", err);
    }
  };

  return (
    <div className="bg-surface border border-border/60 rounded-2xl p-4 mb-3 flex items-center gap-3">
      <Avatar name={player.name} initials={player.initials} size={52} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground text-[15px] truncate">
          {player.name}
        </p>
        <span className="inline-block text-[10px] font-medium uppercase tracking-wider text-muted bg-foreground/5 px-1.5 py-0.5 rounded mt-1">
          {player.skillLevel}
        </span>
        {player.bio && (
          <p className="text-muted text-xs mt-1 line-clamp-2">{player.bio}</p>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={handleFriendToggle}
          aria-pressed={friend}
          aria-label={friend ? `Remove ${player.name} from friends` : `Add ${player.name} to friends`}
          className={`p-2 rounded-full active:scale-90 transition-all ${
            friend
              ? "bg-primary/10"
              : "bg-foreground/5 hover:bg-foreground/10"
          }`}
        >
          {friend ? (
            <UserCheckIcon size={18} color="var(--color-primary)" />
          ) : (
            <UserPlusIcon size={18} color="var(--color-muted)" />
          )}
        </button>
        <button
          onClick={handleMessage}
          className="p-2 rounded-full bg-primary/10 active:scale-90 transition-transform"
          aria-label={`Message ${player.name}`}
        >
          <MessageCircleIcon size={18} color="var(--color-primary)" />
        </button>
      </div>
      <ConfirmDialog
        open={confirmRemoveOpen}
        title={`Remove ${player.name} from friends?`}
        message="They'll no longer see your private posts or games. You can add them back any time."
        confirmLabel="Remove"
        cancelLabel="Cancel"
        destructive
        onConfirm={confirmRemove}
        onCancel={() => setConfirmRemoveOpen(false)}
      />
    </div>
  );
}
