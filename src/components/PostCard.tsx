"use client";

import { useRouter } from "next/navigation";
import type { Post } from "@/lib/types";
import { useAppStore } from "@/lib/app-store";
import { formatRelative } from "@/lib/format";
import { Avatar } from "./Avatar";
import {
  HeartIcon,
  MessageIcon,
  MapPinIcon,
  LockIcon,
} from "./icons";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const router = useRouter();
  const { getUser, toggleLike } = useAppStore();
  const author = getUser(post.userId);

  const handleCommentsClick = () => {
    router.push(`/post/${post.id}`);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLike(post.id);
  };

  if (!author) return null;

  return (
    <div
      className="bg-surface border border-border/60 rounded-2xl p-4 mb-3 active:bg-surface-light transition-colors cursor-pointer"
      onClick={() => router.push(`/post/${post.id}`)}
    >
      <div className="flex items-center gap-3 mb-3">
        <Avatar name={author.name} initials={author.initials} size={42} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-foreground text-[15px] leading-tight truncate">
              {author.name}
            </p>
            {post.isPrivate && <LockIcon size={12} color="var(--color-muted)" />}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-muted text-xs">
              {formatRelative(post.createdAt)}
            </span>
            {post.location && (
              <>
                <span className="text-muted text-xs">·</span>
                <span className="text-muted text-xs flex items-center gap-0.5 truncate">
                  <MapPinIcon size={10} color="var(--color-muted)" />
                  {post.location}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {post.content && (
        <p className="text-foreground text-[15px] leading-relaxed mb-3 whitespace-pre-wrap">
          {post.content}
        </p>
      )}

      {post.image && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={post.image}
          alt=""
          className="w-full rounded-xl mb-3 max-h-[360px] object-cover border border-border"
        />
      )}

      <div className="flex items-center gap-5 -mb-1">
        <button
          onClick={handleLike}
          className="flex items-center gap-1.5 px-2.5 py-1.5 -ml-2.5 rounded-full active:bg-foreground/5 active:scale-95 transition-all"
        >
          <HeartIcon
            size={18}
            color={post.liked ? "#F87171" : "var(--color-muted)"}
            filled={post.liked}
          />
          <span className="text-[13px] font-medium text-muted">
            {post.likes}
          </span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleCommentsClick();
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full active:bg-foreground/5 active:scale-95 transition-all"
        >
          <MessageIcon size={18} color="var(--color-muted)" />
          <span className="text-[13px] font-medium text-muted">
            {post.comments.length}
          </span>
        </button>
      </div>
    </div>
  );
}
