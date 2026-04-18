"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SlideMenu } from "@/components/SlideMenu";
import { FeedAppBar } from "@/components/FeedAppBar";
import { BottomTabs, type TabId } from "@/components/BottomTabs";
import { useAuth } from "@/lib/auth";

const PATH_TO_TAB: Record<string, TabId> = {
  "/feed": "feed",
  "/games": "games",
  "/players": "players",
  "/chats": "chats",
};

const TITLES: Record<TabId, string> = {
  feed: "Feed",
  games: "Games",
  players: "Players",
  chats: "Chats",
};

// Tabs that expose a + button in the app bar, paired with their add route.
const ADD_ROUTES: Partial<Record<TabId, string>> = {
  feed: "/post/new",
  games: "/game/new",
  chats: "/chat/new",
};

const ADD_LABELS: Partial<Record<TabId, string>> = {
  feed: "Create new post",
  games: "Create new game",
  chats: "Create new chat",
};

export default function TabsLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { requireAuth } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const activeTab: TabId = PATH_TO_TAB[pathname ?? "/feed"] ?? "feed";
  const addRoute = ADD_ROUTES[activeTab];

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  // Auto-close the drawer whenever the route changes so the menu never
  // lingers open after a tab switch or deep navigation.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const handleTabChange = (tab: TabId) => {
    const target = `/${tab}`;
    if (pathname !== target) {
      router.push(target);
    }
  };

  // Tapping "+" requires a signed-in user. If the visitor is still a guest,
  // open the auth modal first and only navigate once they've signed in.
  const handleAdd = async () => {
    if (!addRoute) return;
    try {
      await requireAuth();
      router.push(addRoute);
    } catch {
      // User dismissed the modal — stay on the current tab.
    }
  };

  return (
    <div className="relative h-full w-full bg-background overflow-hidden">
      <SlideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

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
            onClick={() => setMenuOpen(false)}
            tabIndex={-1}
            aria-label="Close menu"
            className="absolute inset-0 z-[60] cursor-pointer bg-transparent"
          />
        )}

        <FeedAppBar
          title={TITLES[activeTab]}
          onMenu={() => setMenuOpen(true)}
          onAdd={addRoute ? handleAdd : undefined}
          addLabel={ADD_LABELS[activeTab]}
        />

        <div className="flex-1 overflow-y-auto">{children}</div>

        <BottomTabs activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    </div>
  );
}
