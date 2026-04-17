"use client";

import { useMemo } from "react";
import { useAppStore } from "@/lib/app-store";
import { ChatListItem } from "@/components/ChatListItem";
import { EmptyState } from "@/components/EmptyState";

export default function ChatsTabPage() {
  const { chats, currentUserId, getUser } = useAppStore();

  const sortedChats = useMemo(() => {
    return [...chats].sort((a, b) => {
      const la = a.messages[a.messages.length - 1]?.createdAt ?? 0;
      const lb = b.messages[b.messages.length - 1]?.createdAt ?? 0;
      return lb - la;
    });
  }, [chats]);

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
