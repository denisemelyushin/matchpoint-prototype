"use client";

import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/app-store";
import { AppHeader } from "@/components/AppHeader";
import { Avatar } from "@/components/Avatar";
import { PostCard } from "@/components/PostCard";
import { EditIcon, TrophyIcon } from "@/components/icons";

export default function ProfilePage() {
  const router = useRouter();
  const { currentUser, posts } = useAppStore();

  const myPosts = posts.filter((p) => p.userId === currentUser.id);

  return (
    <div className="flex flex-col h-full bg-background">
      <AppHeader title="Profile" />

      <div className="flex-1 overflow-y-auto">
        <div className="px-6 pt-8 pb-6 flex flex-col items-center text-center border-b border-border">
          <Avatar
            name={currentUser.name}
            initials={currentUser.initials}
            size={96}
          />
          <h2 className="mt-4 text-2xl font-bold text-foreground">
            {currentUser.name}
          </h2>
          <p className="text-muted text-sm mt-1">{currentUser.email}</p>

          <div className="mt-3 flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full">
            <TrophyIcon size={14} color="#96FE17" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              {currentUser.skillLevel}
            </span>
          </div>

          {currentUser.bio && (
            <p className="mt-4 text-foreground text-[15px] leading-relaxed max-w-[320px]">
              {currentUser.bio}
            </p>
          )}

          <button
            onClick={() => router.push("/profile/edit")}
            className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-full bg-surface border border-border active:scale-95 transition-transform"
          >
            <EditIcon size={14} color="#EDEDED" />
            <span className="text-foreground text-sm font-medium">
              Edit Profile
            </span>
          </button>
        </div>

        <div className="px-4 py-4">
          <h3 className="text-muted text-xs font-semibold uppercase tracking-wider mb-3 px-1">
            Your Posts ({myPosts.length})
          </h3>
          {myPosts.length === 0 ? (
            <div className="py-12 text-center text-muted text-sm">
              You haven&apos;t posted anything yet.
            </div>
          ) : (
            myPosts.map((p) => <PostCard key={p.id} post={p} />)
          )}
        </div>
      </div>
    </div>
  );
}
