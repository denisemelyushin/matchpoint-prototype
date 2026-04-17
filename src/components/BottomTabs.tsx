"use client";

import {
  HomeIcon,
  TrophyIcon,
  UsersIcon,
  MessageCircleIcon,
} from "./icons";
import { useTabBarVariant } from "@/lib/tab-bar-variant";

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
  const { variant } = useTabBarVariant();

  switch (variant) {
    case "A":
      return <FloatingDock activeTab={activeTab} onTabChange={onTabChange} />;
    case "B":
      return <SlidingPill activeTab={activeTab} onTabChange={onTabChange} />;
    case "C":
      return <ExpandingPill activeTab={activeTab} onTabChange={onTabChange} />;
    case "D":
      return <IndicatorLine activeTab={activeTab} onTabChange={onTabChange} />;
  }
}

/* -- Variant A — Floating dock -------------------------------------------- */
function FloatingDock({ activeTab, onTabChange }: BottomTabsProps) {
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
              <Icon size={18} color={isActive ? "var(--color-primary)" : "var(--color-muted)"} />
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

/* -- Variant B — Sliding pill --------------------------------------------- */
function SlidingPill({ activeTab, onTabChange }: BottomTabsProps) {
  const activeIndex = TABS.findIndex((t) => t.id === activeTab);
  const percent = 100 / TABS.length;
  return (
    <div className="bg-surface/85 backdrop-blur-2xl safe-bottom">
      <div className="relative flex items-center px-2 py-2">
        <div
          className="absolute top-2 bottom-2 bg-primary/10 rounded-2xl transition-all duration-300 ease-out"
          style={{
            left: `calc(${activeIndex * percent}% + 8px)`,
            width: `calc(${percent}% - 16px)`,
          }}
          aria-hidden
        />
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative flex-1 flex flex-col items-center gap-1 py-1.5 active:scale-95 transition-transform"
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={20} color={isActive ? "var(--color-primary)" : "var(--color-muted)"} />
              <span
                className={`text-[10px] tracking-wide transition-colors ${
                  isActive
                    ? "text-primary font-semibold"
                    : "text-muted font-medium"
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

/* -- Variant C — Expanding pill (Material 3) ------------------------------ */
function ExpandingPill({ activeTab, onTabChange }: BottomTabsProps) {
  return (
    <div className="bg-surface/85 backdrop-blur-2xl safe-bottom">
      <div className="flex items-center justify-center gap-1 px-2 py-3">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center justify-center gap-2 py-2 rounded-full transition-all duration-300 ease-out active:scale-95 ${
                isActive ? "bg-primary/15 px-4" : "px-3"
              }`}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={20} color={isActive ? "var(--color-primary)" : "var(--color-muted)"} />
              <span
                className={`text-[13px] font-semibold text-primary whitespace-nowrap overflow-hidden transition-all duration-300 ease-out ${
                  isActive ? "max-w-[90px] opacity-100" : "max-w-0 opacity-0"
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

/* -- Variant D — Indicator line ------------------------------------------- */
function IndicatorLine({ activeTab, onTabChange }: BottomTabsProps) {
  return (
    <div className="bg-surface/85 backdrop-blur-2xl safe-bottom">
      <div className="flex items-center justify-around py-2">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center gap-1 px-3 py-1.5 active:scale-95 transition-transform"
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={20} color={isActive ? "var(--color-foreground)" : "var(--color-muted)"} />
              <span
                className={`text-[10px] tracking-wide transition-colors ${
                  isActive
                    ? "text-foreground font-semibold"
                    : "text-muted font-medium"
                }`}
              >
                {tab.label}
              </span>
              <div
                className={`h-[3px] rounded-full transition-all duration-300 ${
                  isActive ? "w-5 bg-primary" : "w-0 bg-transparent"
                }`}
                aria-hidden
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export type { TabId };
