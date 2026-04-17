"use client";

import { use, useEffect, useRef, useState } from "react";
import { useAppStore } from "@/lib/app-store";
import { AppHeader } from "@/components/AppHeader";
import { Avatar } from "@/components/Avatar";
import { MessageBubble } from "@/components/MessageBubble";
import { SendIcon } from "@/components/icons";

export default function ChatDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { getChat, getUser, currentUserId, sendMessage } = useAppStore();
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  const chat = getChat(id);
  const otherUserId = chat?.participantIds.find((p) => p !== currentUserId);
  const otherUser = otherUserId ? getUser(otherUserId) : undefined;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages.length]);

  if (!chat || !otherUser) {
    return (
      <div className="flex flex-col h-full bg-background">
        <AppHeader title="Chat" />
        <div className="flex-1 flex items-center justify-center text-muted">
          Chat not found
        </div>
      </div>
    );
  }

  const handleSend = () => {
    const v = draft.trim();
    if (!v) return;
    sendMessage(chat.id, v);
    setDraft("");
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <AppHeader
        title={otherUser.name}
        right={
          <Avatar
            name={otherUser.name}
            initials={otherUser.initials}
            size={32}
          />
        }
      />

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {chat.messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
            <Avatar
              name={otherUser.name}
              initials={otherUser.initials}
              size={72}
            />
            <p className="text-foreground font-semibold">{otherUser.name}</p>
            <p className="text-muted text-sm max-w-[240px]">
              Say hi and start your conversation with {otherUser.name.split(" ")[0]}.
            </p>
          </div>
        ) : (
          chat.messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              isMine={m.senderId === currentUserId}
            />
          ))
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-border bg-surface p-3 safe-bottom">
        <div className="flex items-center gap-2 bg-background rounded-full border border-border px-3 py-1.5">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={`Message ${otherUser.name.split(" ")[0]}…`}
            className="flex-1 bg-transparent text-foreground placeholder:text-muted focus:outline-none text-[15px] py-1"
          />
          <button
            onClick={handleSend}
            disabled={!draft.trim()}
            className="p-1.5 rounded-full active:scale-90 transition-transform disabled:opacity-40"
            aria-label="Send"
          >
            <SendIcon size={18} color={draft.trim() ? "var(--color-primary)" : "var(--color-muted)"} />
          </button>
        </div>
      </div>
    </div>
  );
}
