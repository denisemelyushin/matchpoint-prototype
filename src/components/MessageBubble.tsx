"use client";

import type { Message } from "@/lib/types";

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
}

export function MessageBubble({ message, isMine }: MessageBubbleProps) {
  return (
    <div
      className={`flex w-full mb-2 ${isMine ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-[15px] leading-snug whitespace-pre-wrap break-words ${
          isMine
            ? "bg-primary text-[var(--app-primary-on)] rounded-br-md"
            : "bg-surface-light text-foreground rounded-bl-md"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
