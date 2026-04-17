"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/app-store";
import { PostCard } from "@/components/PostCard";
import { GameCard } from "@/components/GameCard";
import { PlayerCard } from "@/components/PlayerCard";
import { ChatListItem } from "@/components/ChatListItem";
import { BottomTabs, type TabId } from "@/components/BottomTabs";
import { SlideMenu } from "@/components/SlideMenu";
import { FeedAppBar } from "@/components/FeedAppBar";
import { PlusIcon } from "@/components/icons";

const TITLES: Record<TabId, string> = {
  feed: "Feed",
  games: "Games",
  players: "Players",
  chats: "Chats",
};

export default function FeedPage() {
  const router = useRouter();
  const { users, posts, games, chats, currentUserId, getUser } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabId>("feed");
  const [menuOpen, setMenuOpen] = useState(false);

  const visiblePosts = useMemo(
    () => posts.filter((p) => !p.isPrivate || p.userId === currentUserId),
    [posts, currentUserId]
  );
  const visibleGames = useMemo(
    () => games.filter((g) => !g.isPrivate || g.userId === currentUserId),
    [games, currentUserId]
  );
  const otherPlayers = useMemo(
    () => users.filter((u) => u.id !== currentUserId),
    [users, currentUserId]
  );
  const sortedChats = useMemo(() => {
    return [...chats].sort((a, b) => {
      const la = a.messages[a.messages.length - 1]?.createdAt ?? 0;
      const lb = b.messages[b.messages.length - 1]?.createdAt ?? 0;
      return lb - la;
    });
  }, [chats]);

  const handleAddClick = () => {
    switch (activeTab) {
      case "feed":
        router.push("/post/new");
        break;
      case "games":
        router.push("/game/new");
        break;
      case "chats":
        router.push("/chat/new");
        break;
      default:
        break;
    }
  };

  const showAdd = activeTab !== "players";

  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  return (
    <div className="relative h-full w-full bg-background overflow-hidden">
      <SlideMenu isOpen={menuOpen} onClose={closeMenu} />

      <div
        className="absolute inset-0 z-10 flex flex-col bg-background transition-transform duration-[400ms] ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform"
        style={{
          transform: menuOpen ? "translateX(280px)" : "translateX(0)",
          boxShadow: menuOpen
            ? "-8px 0 24px -8px rgba(0,0,0,0.6), -2px 0 6px -2px rgba(0,0,0,0.5)"
            : "0 0 0 0 rgba(0,0,0,0)",
        }}
      >
        {menuOpen && (
          <button
            type="button"
            onClick={closeMenu}
            tabIndex={-1}
            aria-label="Close menu"
            className="absolute inset-0 z-[60] cursor-pointer bg-transparent"
          />
        )}

        <FeedAppBar
          title={TITLES[activeTab]}
          onMenu={() => setMenuOpen(true)}
          onAdd={showAdd ? handleAddClick : undefined}
          addLabel={`Create new ${
            activeTab === "chats" ? "chat" : activeTab.slice(0, -1)
          }`}
        />

      <div className="flex-1 overflow-y-auto">
        {activeTab === "feed" && (
          <div className="px-4 py-2 pb-24">
            {visiblePosts.length === 0 ? (
              <EmptyState text="No posts yet. Be the first to share!" />
            ) : (
              visiblePosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))
            )}
          </div>
        )}

        {activeTab === "games" && (
          <div className="px-4 py-2 pb-24">
            {visibleGames.length === 0 ? (
              <EmptyState text="No games scheduled yet. Create one!" />
            ) : (
              visibleGames.map((game) => <GameCard key={game.id} game={game} />)
            )}
          </div>
        )}

        {activeTab === "players" && (
          <div className="px-4 py-2 pb-4">
            {otherPlayers.map((p) => (
              <PlayerCard key={p.id} player={p} />
            ))}
          </div>
        )}

        {activeTab === "chats" && (
          <div className="pb-24">
            {sortedChats.length === 0 ? (
              <EmptyState text="No conversations yet. Start one!" />
            ) : (
              sortedChats.map((chat) => {
                const otherUserId = chat.participantIds.find(
                  (id) => id !== currentUserId
                );
                const otherUser = otherUserId
                  ? getUser(otherUserId)
                  : undefined;
                if (!otherUser) return null;
                return (
                  <ChatListItem
                    key={chat.id}
                    chat={chat}
                    otherUser={otherUser}
                    currentUserId={currentUserId}
                  />
                );
              })
            )}
          </div>
        )}

        </div>

        <BottomTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="py-16 flex flex-col items-center gap-3 text-center px-6">
      <div className="w-14 h-14 rounded-full bg-surface-light flex items-center justify-center">
        <PlusIcon size={22} color="var(--color-muted)" />
      </div>
      <p className="text-muted text-sm">{text}</p>
    </div>
  );
}
