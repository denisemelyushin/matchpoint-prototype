"use client";

import { use, useState } from "react";
import { useAppStore } from "@/lib/app-store";
import { useAuth } from "@/lib/auth";
import { AppHeader } from "@/components/AppHeader";
import { Avatar } from "@/components/Avatar";
import { formatRelative } from "@/lib/format";
import {
  HeartIcon,
  MapPinIcon,
  MessageIcon,
  SendIcon,
  LockIcon,
} from "@/components/icons";

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { getPost, getUser, toggleLike, addComment, currentUser } =
    useAppStore();
  const { openAuthModal } = useAuth();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const post = getPost(id);
  const author = post ? getUser(post.userId) : undefined;

  if (!post || !author) {
    return (
      <div className="flex flex-col h-full bg-background">
        <AppHeader title="Post" />
        <div className="flex-1 flex items-center justify-center text-muted">
          Post not found
        </div>
      </div>
    );
  }

  const handleSend = async () => {
    const v = draft.trim();
    if (!v) return;
    setSending(true);
    setDraft("");
    try {
      await addComment(post.id, v);
    } catch (err) {
      console.error("[post] failed to add comment:", err);
      setDraft(v);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <AppHeader title="Post" />

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3 mb-3">
            <Avatar
              name={author.name}
              initials={author.initials}
              size={44}
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground text-[15px] truncate">
                {author.name}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-muted text-xs">
                  {formatRelative(post.createdAt)}
                </span>
                {post.location && (
                  <>
                    <span className="text-muted text-xs">·</span>
                    <span className="text-muted text-xs flex items-center gap-0.5">
                      <MapPinIcon size={10} color="var(--color-muted)" />
                      {post.location}
                    </span>
                  </>
                )}
              </div>
            </div>
            {post.isPrivate && (
              <span
                className="shrink-0 inline-flex items-center text-muted"
                aria-label="Private post"
                title="Private post"
              >
                <LockIcon size={11} color="var(--color-muted)" />
              </span>
            )}
          </div>

          {post.content && (
            <p className="text-foreground text-[16px] leading-relaxed mb-3 whitespace-pre-wrap">
              {post.content}
            </p>
          )}

          {post.image && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={post.image}
              alt=""
              className="w-full rounded-xl mb-3 max-h-[420px] object-cover border border-border"
            />
          )}

          <div className="flex items-center gap-6 pt-3 border-t border-border">
            <button
              onClick={() => toggleLike(post.id)}
              className="flex items-center gap-1.5 active:scale-95 transition-transform"
            >
              <HeartIcon
                size={20}
                color={post.liked ? "#F87171" : "var(--color-muted)"}
                filled={post.liked}
              />
              <span className="text-sm text-muted">{post.likes}</span>
            </button>
            <div className="flex items-center gap-1.5">
              <MessageIcon size={20} color="var(--color-muted)" />
              <span className="text-sm text-muted">
                {post.comments.length}
              </span>
            </div>
          </div>
        </div>

        <div className="px-4 py-4">
          <h3 className="text-muted text-xs font-semibold uppercase tracking-wider mb-3">
            Comments ({post.comments.length})
          </h3>

          {post.comments.length === 0 ? (
            <p className="text-muted text-sm text-center py-8">
              No comments yet. Be the first!
            </p>
          ) : (
            <div className="space-y-4">
              {post.comments.map((c) => {
                const u = getUser(c.userId);
                if (!u) return null;
                return (
                  <div key={c.id} className="flex gap-3">
                    <Avatar
                      name={u.name}
                      initials={u.initials}
                      size={36}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="bg-surface rounded-2xl px-3 py-2">
                        <p className="font-semibold text-foreground text-[14px]">
                          {u.name}
                        </p>
                        <p className="text-foreground text-[14px] leading-relaxed whitespace-pre-wrap">
                          {c.content}
                        </p>
                      </div>
                      <p className="text-muted text-[11px] mt-1 ml-3">
                        {formatRelative(c.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border bg-surface p-3 safe-bottom">
        {currentUser ? (
          <div className="flex items-center gap-2">
            <Avatar
              name={currentUser.name}
              initials={currentUser.initials}
              size={32}
            />
            <div className="flex-1 flex items-center gap-2 bg-background rounded-full border border-border px-3 py-1.5">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Add a comment…"
                disabled={sending}
                className="flex-1 bg-transparent text-foreground placeholder:text-muted focus:outline-none text-[15px] disabled:opacity-60"
              />
              <button
                onClick={handleSend}
                disabled={!draft.trim() || sending}
                className="p-1.5 rounded-full active:scale-90 transition-transform disabled:opacity-40"
                aria-label="Send"
              >
                <SendIcon
                  size={18}
                  color={
                    draft.trim()
                      ? "var(--color-primary)"
                      : "var(--color-muted)"
                  }
                />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={openAuthModal}
            className="w-full py-2.5 rounded-full bg-primary text-[var(--app-primary-on)] text-[14px] font-semibold active:opacity-80 transition-opacity"
          >
            Sign in to comment
          </button>
        )}
      </div>
    </div>
  );
}
