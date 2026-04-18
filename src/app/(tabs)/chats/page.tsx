"use client";

import { useMemo } from "react";
import { useAppStore } from "@/lib/app-store";
import { useAuth } from "@/lib/auth";
import { ChatListItem } from "@/components/ChatListItem";
import { EmptyState } from "@/components/EmptyState";

export default function ChatsTabPage() {
  const { chats, currentUserId, getUser } = useAppStore();
  const { openAuthModal } = useAuth();

  const sortedChats = useMemo(() => {
    return [...chats].sort((a, b) => {
      const la = a.messages[a.messages.length - 1]?.createdAt ?? 0;
      const lb = b.messages[b.messages.length - 1]?.createdAt ?? 0;
      return lb - la;
    });
  }, [chats]);

  // Guests have no chats — point them at the sign-in flow rather than
  // showing the generic "Start one!" empty state.
  if (!currentUserId) {
    return (
      <div className="pb-24 px-6 py-16 flex flex-col items-center text-center gap-3">
        <p className="text-foreground font-semibold text-[15px]">
          Sign in to see your messages
        </p>
        <p className="text-muted text-sm max-w-[260px]">
          Chats are tied to your account. Create one to start talking with other
          players.
        </p>
        <button
          type="button"
          onClick={openAuthModal}
          className="mt-2 px-5 py-2.5 rounded-full bg-primary text-[var(--app-primary-on)] text-[14px] font-semibold active:opacity-80 transition-opacity"
        >
          Sign in
        </button>
      </div>
    );
  }

  if (sortedChats.length === 0) {
    return (
      <div className="pb-24">
        <EmptyState text="No conversations yet. Start one!" />
      </div>
    );
  }

  return (
    <div className="pb-24">
      {sortedChats.map((chat) => {
        const otherUserId = chat.participantIds.find(
          (id) => id !== currentUserId
        );
        const otherUser = otherUserId ? getUser(otherUserId) : undefined;
        if (!otherUser) return null;
        return (
          <ChatListItem
            key={chat.id}
            chat={chat}
            otherUser={otherUser}
            currentUserId={currentUserId}
          />
        );
      })}
    </div>
  );
}
