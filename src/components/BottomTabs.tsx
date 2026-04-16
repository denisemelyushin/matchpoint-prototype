"use client";

import { HomeIcon, TrophyIcon, UsersIcon, MessageCircleIcon } from "./icons";

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
    <div className="bg-surface border-t border-border safe-bottom">
      <div className="flex items-center justify-around h-16">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center gap-1 px-4 py-1 active:scale-95 transition-transform"
            >
              <IconComponent
                size={22}
                color={isActive ? "#96FE17" : "#888"}
              />
              <span
                className={`text-[10px] font-medium ${
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
