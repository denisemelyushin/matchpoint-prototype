"use client";

import { useMemo } from "react";
import { useAppStore } from "@/lib/app-store";
import { PostCard } from "@/components/PostCard";
import { EmptyState } from "@/components/EmptyState";

export default function FeedTabPage() {
  const { posts, canSeePrivateContentFrom } = useAppStore();

  // Private posts are scoped to the author and their confirmed friends.
  // `canSeePrivateContentFrom` returns true for the author themselves and
  // for anyone the author has added as a friend (mutual).
  const visiblePosts = useMemo(
    () =>
      posts.filter((p) => !p.isPrivate || canSeePrivateContentFrom(p.userId)),
    [posts, canSeePrivateContentFrom]
  );

  return (
    <div className="px-4 py-2 pb-24">
      {visiblePosts.length === 0 ? (
        <EmptyState text="No posts yet. Be the first to share!" />
      ) : (
        visiblePosts.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </div>
  );
}
