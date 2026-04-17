"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type TabBarVariant = "A" | "B" | "C" | "D";

export const TAB_BAR_VARIANTS: Array<{
  id: TabBarVariant;
  label: string;
  description: string;
}> = [
  {
    id: "A",
    label: "A · Floating dock",
    description: "Rounded capsule detached from the bottom edge.",
  },
  {
    id: "B",
    label: "B · Sliding pill",
    description: "A highlight pill slides between tabs as you switch.",
  },
  {
    id: "C",
    label: "C · Expanding pill",
    description:
      "Inactive tabs show icon only; active tab expands with its label.",
  },
  {
    id: "D",
    label: "D · Indicator line",
    description: "Minimal — a short dash under the active tab.",
  },
];

const STORAGE_KEY = "matchpoint:tab-bar-variant";
export const DEFAULT_TAB_BAR_VARIANT: TabBarVariant = "A";
const DEFAULT_VARIANT = DEFAULT_TAB_BAR_VARIANT;

interface TabBarVariantContextValue {
  variant: TabBarVariant;
  setVariant: (v: TabBarVariant) => void;
}

const TabBarVariantContext = createContext<TabBarVariantContextValue | null>(
  null
);

function isVariant(v: string | null): v is TabBarVariant {
  return v === "A" || v === "B" || v === "C" || v === "D";
}

export function TabBarVariantProvider({ children }: { children: ReactNode }) {
  const [variant, setVariantState] = useState<TabBarVariant>(DEFAULT_VARIANT);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (isVariant(stored)) {
        setVariantState(stored);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const setVariant = useCallback((v: TabBarVariant) => {
    setVariantState(v);
    try {
      localStorage.setItem(STORAGE_KEY, v);
    } catch {
      // ignore storage errors
    }
  }, []);

  return (
    <TabBarVariantContext.Provider value={{ variant, setVariant }}>
      {children}
    </TabBarVariantContext.Provider>
  );
}

export function useTabBarVariant(): TabBarVariantContextValue {
  const ctx = useContext(TabBarVariantContext);
  if (!ctx) {
    throw new Error(
      "useTabBarVariant must be used inside a TabBarVariantProvider"
    );
  }
  return ctx;
}
