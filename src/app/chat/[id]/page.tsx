"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/app-store";
import { useRequireAuthPage } from "@/lib/auth";
import { AppHeader } from "@/components/AppHeader";
import { Avatar } from "@/components/Avatar";
import { MessageBubble } from "@/components/MessageBubble";
import { SendIcon } from "@/components/icons";
import { formatMessageDaySeparator, sameMessageDay } from "@/lib/format";

export default function ChatDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const backToChats = useCallback(() => router.push("/chats"), [router]);
  const { isReady } = useRequireAuthPage(backToChats);
  const { getChat, getUser, currentUserId, sendMessage } = useAppStore();
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  const chat = getChat(id);

  // Chat ids are deterministic: `${uidA}__${uidB}` (sorted). When the user
  // opens a conversation they've never messaged before, the chat doc doesn't
  // exist in Firestore yet — it'll be created by `sendMessage` on the first
  // send. Recover the "other" participant from the id so we can render the
  // draft view (header + empty state) without a backing doc.
  const otherUserId =
    chat?.participantIds.find((p) => p !== currentUserId) ??
    (currentUserId
      ? id.split("__").find((p) => p !== currentUserId && p.length > 0)
      : undefined);
  const otherUser = otherUserId ? getUser(otherUserId) : undefined;
  const messages = chat?.messages ?? [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (!isReady) return null;

  // Only treat the chat as "not found" if we can't even resolve the other
  // participant from the id (e.g. malformed link or the current user isn't
  // one of the encoded uids).
  if (!otherUser) {
    return (
      <div className="flex flex-col h-full bg-background">
        <AppHeader title="Chat" onBack={backToChats} />
        <div className="flex-1 flex items-center justify-center text-muted">
          Chat not found
        </div>
      </div>
    );
  }

  const handleSend = async () => {
    const v = draft.trim();
    if (!v) return;
    setDraft("");
    try {
      await sendMessage(id, v);
    } catch (err) {
      console.error("[chat] failed to send message:", err);
      setDraft(v);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <AppHeader
        title={otherUser.name}
        onBack={backToChats}
        right={
          <Avatar
            name={otherUser.name}
            initials={otherUser.initials}
            size={32}
          />
        }
      />

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
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
          (() => {
            const effectiveNow = Date.now();
            return messages.map((m, i) => {
              const prev = i > 0 ? messages[i - 1] : null;
              const next =
                i < messages.length - 1 ? messages[i + 1] : null;
              const showSeparator =
                !prev || !sameMessageDay(prev.createdAt, m.createdAt);
              // Tight spacing only when the previous bubble is from the same
              // sender on the same day (no separator inserted between them).
              const compact =
                !showSeparator && !!prev && prev.senderId === m.senderId;
              // Tail on the final bubble of a same-sender run (including
              // standalone bubbles). Continues below = next message is from
              // the same sender on the same day, so no tail there yet.
              const continuesBelow =
                !!next &&
                sameMessageDay(m.createdAt, next.createdAt) &&
                next.senderId === m.senderId;
              const isMine = m.senderId === currentUserId;
              const hasTail = isMine && !continuesBelow;
              return (
                <div key={m.id}>
                  {showSeparator && (
                    <DateSeparator
                      label={formatMessageDaySeparator(
                        m.createdAt,
                        effectiveNow
                      )}
                    />
                  )}
                  <MessageBubble
                    message={m}
                    isMine={isMine}
                    compact={compact}
                    hasTail={hasTail}
                  />
                </div>
              );
            });
          })()
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

function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex justify-center my-3">
      <span className="px-3 py-1 rounded-full bg-surface-light text-muted text-[11px] font-medium">
        {label}
      </span>
    </div>
  );
}
