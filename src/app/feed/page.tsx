"use client";

import { useState } from "react";
import { MOCK_POSTS } from "@/lib/mock-data";
import { PostCard } from "@/components/PostCard";
import { BottomTabs, type TabId } from "@/components/BottomTabs";
import { SlideMenu } from "@/components/SlideMenu";
import { Avatar } from "@/components/Avatar";
import { MenuIcon, TrophyIcon, UsersIcon, MessageCircleIcon } from "@/components/icons";

function TBDTab({ title, icon: Icon }: { title: string; icon: typeof TrophyIcon }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 px-8">
      <div className="w-20 h-20 rounded-full bg-surface-light flex items-center justify-center">
        <Icon size={36} color="#555" />
      </div>
      <h3 className="text-xl font-semibold text-foreground">{title}</h3>
      <p className="text-muted text-center text-sm">
        Coming soon! This feature is under development.
      </p>
    </div>
  );
}

export default function FeedPage() {
  const [activeTab, setActiveTab] = useState<TabId>("feed");
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-3 bg-background/80 backdrop-blur-xl sticky top-0 z-30">
        <button
          onClick={() => setMenuOpen(true)}
          className="p-2 -ml-2 active:scale-90 transition-transform"
        >
          <MenuIcon size={24} color="#EDEDED" />
        </button>

        <h1 className="text-lg font-bold text-foreground">
          {activeTab === "feed"
            ? "Feed"
            : activeTab === "games"
            ? "Games"
            : activeTab === "players"
            ? "Players"
            : "Chats"}
        </h1>

        <button className="p-1 -mr-1 active:scale-90 transition-transform">
          <Avatar name="You" initials="YO" size={32} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "feed" && (
          <div className="px-4 py-2 pb-4">
            {MOCK_POSTS.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {activeTab === "games" && (
          <TBDTab title="Games" icon={TrophyIcon} />
        )}

        {activeTab === "players" && (
          <TBDTab title="Players" icon={UsersIcon} />
        )}

        {activeTab === "chats" && (
          <TBDTab title="Chats" icon={MessageCircleIcon} />
        )}
      </div>

      {/* Bottom Tabs */}
      <BottomTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Slide Menu */}
      <SlideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
