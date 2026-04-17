"use client";

import type { Message } from "@/lib/types";
import { formatMessageTime } from "@/lib/format";

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
  // When true, this bubble continues the same sender as the previous bubble in
  // the thread, so it sits tightly against it. When false, the previous bubble
  // was from the other side (or this is the first of a group) and a bit more
  // vertical breathing room is added — same cadence as WhatsApp/Telegram.
  compact?: boolean;
  // When true, the bubble is the last one in a same-sender group (including
  // standalone bubbles), so a speech-bubble tail is attached to the outer
  // bottom corner. Currently rendered for own messages only.
  hasTail?: boolean;
}

export function MessageBubble({
  message,
  isMine,
  compact = false,
  hasTail = false,
}: MessageBubbleProps) {
  const time = formatMessageTime(message.createdAt);
  const spacing = compact ? "mt-0.5" : "mt-2.5";
  // Outer corners use a slightly softer radius; tail/stack corners still curve
  // a little, so middle-of-group bubbles don't look harshly square and
  // standalone bubbles don't look overly pill-shaped.
  // Mine → right column, so its "tail" sits at bottom-right. When a same-sender
  // bubble precedes this one, flatten the top-right corner so the two bubbles
  // visually connect as a stacked group. Mirror logic for received bubbles.
  // When `hasTail` is set on an own message, we square off the bottom-right
  // corner entirely so the speech-bubble tail can attach seamlessly.
  const tailCorner = isMine
    ? hasTail
      ? "rounded-br-none"
      : "rounded-br-lg"
    : "rounded-bl-lg";
  const stackCorner = compact
    ? isMine
      ? "rounded-tr-lg"
      : "rounded-tl-lg"
    : "";
  const showTail = hasTail && isMine;

  return (
    <div
      className={`flex w-full ${spacing} ${isMine ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`relative max-w-[78%] px-3 py-1.5 rounded-xl ${tailCorner} ${stackCorner} text-[15px] leading-snug ${
          isMine
            ? "bg-primary text-[var(--app-primary-on)]"
            : "bg-surface-light text-foreground"
        }`}
      >
        <span className="whitespace-pre-wrap break-words">
          {message.content}
          {/* Invisible inline spacer that reserves room on the final text line
              so the absolutely positioned timestamp never overlaps the text.
              Matches the WhatsApp/Telegram inline-time layout. */}
          <span
            aria-hidden
            className="inline-block align-bottom h-0 w-[54px]"
          />
        </span>
        <span
          className={`absolute right-2 bottom-[5px] text-[10px] leading-none tabular-nums select-none ${
            isMine ? "opacity-60" : "text-muted"
          }`}
        >
          {time}
        </span>
        {showTail && (
          /* Speech-bubble tail for own messages. Anchored at the squared-off
             bottom-right corner of the bubble so it reads as a single shape.
             `fill="currentColor"` + the primary text color keeps the tail in
             sync with the active theme's primary color. */
          <span
            aria-hidden
            className="absolute bottom-0 -right-[6px] text-[var(--color-primary)] pointer-events-none"
          >
            <svg
              width="8"
              height="12"
              viewBox="0 0 8 12"
              fill="currentColor"
              className="block"
            >
              <path d="M0 0 C 0 5 2 9 8 12 L 0 12 Z" />
            </svg>
          </span>
        )}
      </div>
    </div>
  );
}
