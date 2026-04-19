"use client";

import {
  HomeIcon,
  TrophyIcon,
  UsersIcon,
  MessageCircleIcon,
} from "./icons";

const TABS = [
  { id: "feed", label: "Feed", icon: HomeIcon },
  { id: "games", label: "Games", icon: TrophyIcon },
  { id: "players", label: "Players", icon: UsersIcon },
  { id: "chats", label: "Chats", icon: MessageCircleIcon },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface BottomTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function BottomTabs({ activeTab, onTabChange }: BottomTabsProps) {
  return (
    <div
      className="absolute left-3 right-3 bg-surface/90 backdrop-blur-2xl rounded-full border border-white/5 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.6)] z-30"
      style={{ bottom: "max(12px, env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="flex items-center gap-1 px-2 py-1.5">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 basis-0 min-w-0 flex flex-col items-center gap-0.5 py-1.5 rounded-full transition-all duration-200 active:scale-95 ${
                isActive ? "bg-primary/10" : ""
              }`}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                size={18}
                color={isActive ? "var(--color-primary)" : "var(--color-muted)"}
              />
              <span
                className={`text-[9px] font-semibold tracking-wide ${
                  isActive ? "text-primary" : "text-muted"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export type { TabId };
