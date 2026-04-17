"use client";

import { useRouter } from "next/navigation";
import type { Chat, User } from "@/lib/types";
import { Avatar } from "./Avatar";
import { formatRelative } from "@/lib/format";

interface ChatListItemProps {
  chat: Chat;
  otherUser: User;
  currentUserId: string;
}

export function ChatListItem({
  chat,
  otherUser,
  currentUserId,
}: ChatListItemProps) {
  const router = useRouter();
  const lastMessage = chat.messages[chat.messages.length - 1];

  return (
    <button
      onClick={() => router.push(`/chat/${chat.id}`)}
      className="w-full flex items-center gap-3 px-4 py-3 active:bg-surface-light transition-colors text-left border-b border-white/5 last:border-b-0"
    >
      <Avatar name={otherUser.name} initials={otherUser.initials} size={48} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold text-foreground text-[15px] truncate">
            {otherUser.name}
          </p>
          {lastMessage && (
            <span className="text-muted text-xs shrink-0">
              {formatRelative(lastMessage.createdAt)}
            </span>
          )}
        </div>
        <p className="text-muted text-sm truncate mt-0.5">
          {lastMessage
            ? `${
                lastMessage.senderId === currentUserId ? "You: " : ""
              }${lastMessage.content}`
            : "No messages yet"}
        </p>
      </div>
    </button>
  );
}
