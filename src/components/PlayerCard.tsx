"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/types";
import { Avatar } from "./Avatar";
import {
  CheckIcon,
  ClockIcon,
  MessageCircleIcon,
  UserCheckIcon,
  UserPlusIcon,
  XIcon,
} from "./icons";
import { ConfirmDialog } from "./ConfirmDialog";
import { useAppStore, type FriendshipStatus } from "@/lib/app-store";

interface PlayerCardProps {
  player: User;
  /**
   * Layout hint for the action column. `default` shows the friend toggle +
   * message button side by side; `requests` is used on the Requests tab and
   * renders the full Accept/Decline (or Cancel) controls inline instead.
   */
  variant?: "default" | "requests";
}

export function PlayerCard({ player, variant = "default" }: PlayerCardProps) {
  const router = useRouter();
  const {
    startOrGetChat,
    getFriendshipStatus,
    sendFriendRequest,
    cancelFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
  } = useAppStore();
  const status = getFriendshipStatus(player.id);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

  const handleMessage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const chatId = await startOrGetChat(player.id);
      router.push(`/chat/${chatId}`);
    } catch (err) {
      if (!(err instanceof Error) || err.message !== "auth-cancelled") {
        console.error("[PlayerCard] failed to start chat:", err);
      }
    }
  };

  const handlePrimaryAction = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      switch (status) {
        case "none":
          await sendFriendRequest(player.id);
          break;
        case "outgoing":
          setConfirmCancelOpen(true);
          return;
        case "incoming":
          await acceptFriendRequest(player.id);
          break;
        case "friends":
          setConfirmRemoveOpen(true);
          return;
      }
    } catch (err) {
      if (!(err instanceof Error) || err.message !== "auth-cancelled") {
        console.error("[PlayerCard] friendship action failed:", err);
      }
    }
  };

  const handleDecline = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await declineFriendRequest(player.id);
    } catch (err) {
      console.error("[PlayerCard] failed to decline request:", err);
    }
  };

  const confirmRemove = async () => {
    setConfirmRemoveOpen(false);
    try {
      await removeFriend(player.id);
    } catch (err) {
      console.error("[PlayerCard] failed to remove friend:", err);
    }
  };

  const confirmCancel = async () => {
    setConfirmCancelOpen(false);
    try {
      await cancelFriendRequest(player.id);
    } catch (err) {
      console.error("[PlayerCard] failed to cancel request:", err);
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
        {variant === "requests" && status === "incoming" ? (
          <>
            <button
              onClick={handleDecline}
              aria-label={`Decline friend request from ${player.name}`}
              className="p-2 rounded-full bg-foreground/5 hover:bg-foreground/10 active:scale-90 transition-all"
            >
              <XIcon size={18} color="var(--color-muted)" />
            </button>
            <button
              onClick={handlePrimaryAction}
              aria-label={`Accept friend request from ${player.name}`}
              className="p-2 rounded-full bg-primary text-[var(--app-primary-on)] active:scale-90 transition-all"
            >
              <CheckIcon size={18} color="var(--app-primary-on)" />
            </button>
          </>
        ) : variant === "requests" && status === "outgoing" ? (
          <button
            onClick={handlePrimaryAction}
            aria-label={`Cancel friend request to ${player.name}`}
            className="text-[12px] font-medium px-3 py-1.5 rounded-full bg-foreground/5 hover:bg-foreground/10 text-muted active:scale-95 transition-all flex items-center gap-1"
          >
            <ClockIcon size={14} color="var(--color-muted)" />
            Pending
          </button>
        ) : (
          <>
            <button
              onClick={handlePrimaryAction}
              aria-pressed={status === "friends"}
              aria-label={primaryLabel(status, player.name)}
              title={primaryTitle(status)}
              className={`p-2 rounded-full active:scale-90 transition-all ${
                status === "friends"
                  ? "bg-primary/10"
                  : status === "incoming"
                  ? "bg-primary text-[var(--app-primary-on)]"
                  : status === "outgoing"
                  ? "bg-foreground/5"
                  : "bg-foreground/5 hover:bg-foreground/10"
              }`}
            >
              {status === "friends" ? (
                <UserCheckIcon size={18} color="var(--color-primary)" />
              ) : status === "incoming" ? (
                <UserCheckIcon size={18} color="var(--app-primary-on)" />
              ) : status === "outgoing" ? (
                <ClockIcon size={18} color="var(--color-muted)" />
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
          </>
        )}
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
      <ConfirmDialog
        open={confirmCancelOpen}
        title={`Cancel request to ${player.name}?`}
        message="They'll no longer see your friend request. You can send a new one any time."
        confirmLabel="Cancel request"
        cancelLabel="Keep request"
        destructive
        onConfirm={confirmCancel}
        onCancel={() => setConfirmCancelOpen(false)}
      />
    </div>
  );
}

function primaryLabel(status: FriendshipStatus, name: string): string {
  switch (status) {
    case "friends":
      return `Remove ${name} from friends`;
    case "outgoing":
      return `Cancel friend request to ${name}`;
    case "incoming":
      return `Accept friend request from ${name}`;
    case "none":
    default:
      return `Send ${name} a friend request`;
  }
}

function primaryTitle(status: FriendshipStatus): string {
  switch (status) {
    case "friends":
      return "Friends — tap to remove";
    case "outgoing":
      return "Request pending — tap to cancel";
    case "incoming":
      return "Tap to accept friend request";
    case "none":
    default:
      return "Send friend request";
  }
}
