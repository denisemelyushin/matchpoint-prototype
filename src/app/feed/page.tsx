"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/app-store";
import { PostCard } from "@/components/PostCard";
import { GameCard } from "@/components/GameCard";
import { PlayerCard } from "@/components/PlayerCard";
import { ChatListItem } from "@/components/ChatListItem";
import { BottomTabs, type TabId } from "@/components/BottomTabs";
import { SlideMenu } from "@/components/SlideMenu";
import { MenuIcon, PlusIcon } from "@/components/icons";

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

  return (
    <div className="relative flex flex-col h-full bg-background">
      <div className="flex items-center justify-between px-4 pt-12 pb-3 bg-background/80 backdrop-blur-xl sticky top-0 z-30">
        <button
          onClick={() => setMenuOpen(true)}
          className="p-2 -ml-2 active:scale-90 transition-transform"
          aria-label="Open menu"
        >
          <MenuIcon size={24} color="#EDEDED" />
        </button>

        <h1 className="text-lg font-bold text-foreground">
          {TITLES[activeTab]}
        </h1>

        {showAdd ? (
          <button
            onClick={handleAddClick}
            className="p-2 -mr-2 active:scale-90 transition-transform"
            aria-label={`Create new ${activeTab === "chats" ? "chat" : activeTab.slice(0, -1)}`}
          >
            <PlusIcon size={24} color="#EDEDED" />
          </button>
        ) : (
          <div className="w-10 h-10 -mr-2" aria-hidden />
        )}
      </div>

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

      <SlideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="py-16 flex flex-col items-center gap-3 text-center px-6">
      <div className="w-14 h-14 rounded-full bg-surface-light flex items-center justify-center">
        <PlusIcon size={22} color="#888" />
      </div>
      <p className="text-muted text-sm">{text}</p>
    </div>
  );
}
