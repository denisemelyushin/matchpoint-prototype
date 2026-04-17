"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { REFERENCE_NOW } from "@/lib/time";

const TITLES: Record<TabId, string> = {
  feed: "Feed",
  games: "Games",
  players: "Players",
  chats: "Chats",
};

type PlayersFilter = "all" | "friends";
type GamesFilter = "upcoming" | "today" | "tomorrow" | "weekend";

const DAY_MS = 24 * 60 * 60 * 1000;

function computeGameRanges(now: number) {
  const d = new Date(now);
  const startOfToday = new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate()
  ).getTime();
  const startOfTomorrow = startOfToday + DAY_MS;
  const endOfTomorrow = startOfTomorrow + DAY_MS;

  // 0 = Sunday, 6 = Saturday
  const dayOfWeek = d.getDay();
  let weekendStart: number;
  let weekendEnd: number;
  if (dayOfWeek === 6) {
    weekendStart = startOfToday;
    weekendEnd = startOfToday + 2 * DAY_MS;
  } else if (dayOfWeek === 0) {
    weekendStart = startOfToday;
    weekendEnd = startOfToday + DAY_MS;
  } else {
    const daysUntilSat = 6 - dayOfWeek;
    weekendStart = startOfToday + daysUntilSat * DAY_MS;
    weekendEnd = weekendStart + 2 * DAY_MS;
  }

  return {
    startOfToday,
    startOfTomorrow,
    endOfTomorrow,
    weekendStart,
    weekendEnd,
  };
}

const TAB_IDS: readonly TabId[] = ["feed", "games", "players", "chats"];

function isTabId(value: string | null): value is TabId {
  return !!value && (TAB_IDS as readonly string[]).includes(value);
}

export default function FeedPage() {
  const router = useRouter();
  const { users, posts, games, chats, currentUserId, getUser, isFriend } =
    useAppStore();
  const [activeTab, setActiveTab] = useState<TabId>("feed");
  const [menuOpen, setMenuOpen] = useState(false);

  // Keep the active tab and the URL in sync. On mount we pick up ?tab=… from
  // the URL so deep links (e.g. Back from a chat or from /game/new) land on
  // the right tab. On every subsequent tab change we mirror the new tab into
  // the URL via replace, so the browser back stack always points at the tab
  // the user was on when they tapped the + button.
  const mountedRef = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!mountedRef.current) {
      mountedRef.current = true;
      const param = new URLSearchParams(window.location.search).get("tab");
      if (isTabId(param)) setActiveTab(param);
      return;
    }
    const targetSearch = activeTab === "feed" ? "" : `?tab=${activeTab}`;
    const target = `/feed${targetSearch}`;
    const current = window.location.pathname + window.location.search;
    if (current !== target) {
      router.replace(target, { scroll: false });
    }
  }, [activeTab, router]);
  const [playersFilter, setPlayersFilter] = useState<PlayersFilter>("all");
  const [gamesFilter, setGamesFilter] = useState<GamesFilter>("upcoming");

  const visiblePosts = useMemo(
    () => posts.filter((p) => !p.isPrivate || p.userId === currentUserId),
    [posts, currentUserId]
  );
  const visibleGames = useMemo(() => {
    const {
      startOfToday,
      startOfTomorrow,
      endOfTomorrow,
      weekendStart,
      weekendEnd,
    } = computeGameRanges(REFERENCE_NOW);

    return games
      .filter((g) => !g.isPrivate || g.userId === currentUserId)
      .filter((g) => {
        const t = new Date(g.date).getTime();
        switch (gamesFilter) {
          case "today":
            return t >= startOfToday && t < startOfTomorrow;
          case "tomorrow":
            return t >= startOfTomorrow && t < endOfTomorrow;
          case "weekend":
            return t >= weekendStart && t < weekendEnd;
          case "upcoming":
          default:
            return t >= startOfToday;
        }
      })
      .sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
  }, [games, currentUserId, gamesFilter]);
  const otherPlayers = useMemo(() => {
    const base = users.filter((u) => u.id !== currentUserId);
    const filtered =
      playersFilter === "friends" ? base.filter((u) => isFriend(u.id)) : base;
    return [...filtered].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );
  }, [users, currentUserId, playersFilter, isFriend]);
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
            <GamesFilterToggle value={gamesFilter} onChange={setGamesFilter} />
            {visibleGames.length === 0 ? (
              <EmptyState text={gamesEmptyText(gamesFilter)} />
            ) : (
              visibleGames.map((game) => <GameCard key={game.id} game={game} />)
            )}
          </div>
        )}

        {activeTab === "players" && (
          <div className="px-4 py-2 pb-4">
            <PlayersFilterToggle
              value={playersFilter}
              onChange={setPlayersFilter}
            />
            {otherPlayers.length === 0 ? (
              <EmptyState
                text={
                  playersFilter === "friends"
                    ? "No friends yet. Add players from All players."
                    : "No players yet."
                }
              />
            ) : (
              otherPlayers.map((p) => <PlayerCard key={p.id} player={p} />)
            )}
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

function PlayersFilterToggle({
  value,
  onChange,
}: {
  value: PlayersFilter;
  onChange: (v: PlayersFilter) => void;
}) {
  const options: Array<{ id: PlayersFilter; label: string }> = [
    { id: "all", label: "All players" },
    { id: "friends", label: "My friends" },
  ];
  return (
    <div
      role="tablist"
      aria-label="Players filter"
      className="flex p-1 rounded-full bg-surface-light mb-3"
    >
      {options.map((opt) => {
        const selected = value === opt.id;
        return (
          <button
            key={opt.id}
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(opt.id)}
            className={`flex-1 text-[13px] font-medium py-1.5 rounded-full transition-colors ${
              selected
                ? "bg-primary text-[var(--app-primary-on)]"
                : "text-muted"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function GamesFilterToggle({
  value,
  onChange,
}: {
  value: GamesFilter;
  onChange: (v: GamesFilter) => void;
}) {
  const options: Array<{ id: GamesFilter; label: string }> = [
    { id: "upcoming", label: "Upcoming" },
    { id: "today", label: "Today" },
    { id: "tomorrow", label: "Tomorrow" },
    { id: "weekend", label: "Weekend" },
  ];
  return (
    <div
      role="tablist"
      aria-label="Games filter"
      className="flex p-1 rounded-full bg-surface-light mb-3"
    >
      {options.map((opt) => {
        const selected = value === opt.id;
        return (
          <button
            key={opt.id}
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(opt.id)}
            className={`flex-1 text-[12px] font-medium py-1.5 rounded-full transition-colors ${
              selected
                ? "bg-primary text-[var(--app-primary-on)]"
                : "text-muted"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function gamesEmptyText(filter: GamesFilter): string {
  switch (filter) {
    case "today":
      return "No games today.";
    case "tomorrow":
      return "No games tomorrow.";
    case "weekend":
      return "No games this weekend.";
    case "upcoming":
    default:
      return "No upcoming games. Create one!";
  }
}
