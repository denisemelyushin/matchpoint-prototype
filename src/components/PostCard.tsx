"use client";

import { useState } from "react";
import type { Post } from "@/lib/mock-data";
import { Avatar } from "./Avatar";
import { HeartIcon, MessageIcon, MapPinIcon } from "./icons";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const [liked, setLiked] = useState(post.liked);
  const [likeCount, setLikeCount] = useState(post.likes);

  const toggleLike = () => {
    setLiked((prev) => !prev);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
  };

  return (
    <div className="bg-surface rounded-2xl p-4 mb-3">
      <div className="flex items-center gap-3 mb-3">
        <Avatar name={post.user.name} initials={post.user.initials} size={42} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-[15px] leading-tight">
            {post.user.name}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-muted text-xs">{post.timeAgo}</span>
            {post.location && (
              <>
                <span className="text-muted text-xs">·</span>
                <span className="text-muted text-xs flex items-center gap-0.5">
                  <MapPinIcon size={10} color="#888" />
                  {post.location}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <p className="text-foreground text-[15px] leading-relaxed mb-4">
        {post.content}
      </p>

      <div className="flex items-center gap-6 pt-2 border-t border-border">
        <button
          onClick={toggleLike}
          className="flex items-center gap-1.5 active:scale-95 transition-transform"
        >
          <HeartIcon
            size={20}
            color={liked ? "#FF4757" : "#888"}
            filled={liked}
          />
          <span
            className={`text-sm ${liked ? "text-[#FF4757]" : "text-muted"}`}
          >
            {likeCount}
          </span>
        </button>

        <button className="flex items-center gap-1.5 active:scale-95 transition-transform">
          <MessageIcon size={20} color="#888" />
          <span className="text-sm text-muted">{post.comments}</span>
        </button>
      </div>
    </div>
  );
}
