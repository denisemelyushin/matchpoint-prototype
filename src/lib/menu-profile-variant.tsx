"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type MenuProfileVariant = "A" | "B" | "C" | "D";

export const MENU_PROFILE_VARIANTS: Array<{
  id: MenuProfileVariant;
  label: string;
  description: string;
}> = [
  {
    id: "A",
    label: "A · Classic",
    description: "Filled card with a roomy profile row.",
  },
  {
    id: "B",
    label: "B · Airy",
    description: "Outlined card, roomy and airy.",
  },
  {
    id: "C",
    label: "C · Compact",
    description:
      "Filled compact card with a small pencil icon on the right as an edit hint.",
  },
  {
    id: "D",
    label: "D · Airy + hint",
    description:
      "Outlined roomy card with a small pencil icon on the right as an edit hint.",
  },
];

const STORAGE_KEY = "matchpoint:menu-profile-variant";
const DEFAULT_VARIANT: MenuProfileVariant = "A";

interface MenuProfileVariantContextValue {
  variant: MenuProfileVariant;
  setVariant: (v: MenuProfileVariant) => void;
}

const MenuProfileVariantContext =
  createContext<MenuProfileVariantContextValue | null>(null);

function isVariant(v: string | null): v is MenuProfileVariant {
  return v === "A" || v === "B" || v === "C" || v === "D";
}

export function MenuProfileVariantProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [variant, setVariantState] =
    useState<MenuProfileVariant>(DEFAULT_VARIANT);

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

  const setVariant = useCallback((v: MenuProfileVariant) => {
    setVariantState(v);
    try {
      localStorage.setItem(STORAGE_KEY, v);
    } catch {
      // ignore storage errors
    }
  }, []);

  return (
    <MenuProfileVariantContext.Provider value={{ variant, setVariant }}>
      {children}
    </MenuProfileVariantContext.Provider>
  );
}

export function useMenuProfileVariant(): MenuProfileVariantContextValue {
  const ctx = useContext(MenuProfileVariantContext);
  if (!ctx) {
    throw new Error(
      "useMenuProfileVariant must be used inside a MenuProfileVariantProvider"
    );
  }
  return ctx;
}
