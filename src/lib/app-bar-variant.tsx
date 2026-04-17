"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type AppBarVariant = "A" | "B" | "C" | "D";

// Options are displayed in a specific order ("Big icons" first as the new
// default) and relabeled A–D top-to-bottom so the user-visible letter matches
// the position. Ids stay stable (id A = Classic, id B = Big icons, etc.) so
// existing stored preferences keep resolving to the same visual.
export const APP_BAR_VARIANTS: Array<{
  id: AppBarVariant;
  label: string;
  description: string;
}> = [
  {
    id: "B",
    label: "A · Big icons",
    description:
      "Larger icons and a fixed \u201CMatchPoint Pro\u201D title in the centre.",
  },
  {
    id: "A",
    label: "B · Classic",
    description: "Centred page title between stroke icons.",
  },
  {
    id: "C",
    label: "C · Framed",
    description: "Icons tucked inside soft rounded-square tiles.",
  },
  {
    id: "D",
    label: "D · Branded",
    description: "App name in the middle instead of a page title.",
  },
];

const STORAGE_KEY = "matchpoint:app-bar-variant";
export const DEFAULT_APP_BAR_VARIANT: AppBarVariant = "B";
const DEFAULT_VARIANT = DEFAULT_APP_BAR_VARIANT;

interface AppBarVariantContextValue {
  variant: AppBarVariant;
  setVariant: (v: AppBarVariant) => void;
}

const AppBarVariantContext = createContext<AppBarVariantContextValue | null>(
  null
);

function isVariant(v: string | null): v is AppBarVariant {
  return v === "A" || v === "B" || v === "C" || v === "D";
}

export function AppBarVariantProvider({ children }: { children: ReactNode }) {
  const [variant, setVariantState] = useState<AppBarVariant>(DEFAULT_VARIANT);

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

  const setVariant = useCallback((v: AppBarVariant) => {
    setVariantState(v);
    try {
      localStorage.setItem(STORAGE_KEY, v);
    } catch {
      // ignore storage errors
    }
  }, []);

  return (
    <AppBarVariantContext.Provider value={{ variant, setVariant }}>
      {children}
    </AppBarVariantContext.Provider>
  );
}

export function useAppBarVariant(): AppBarVariantContextValue {
  const ctx = useContext(AppBarVariantContext);
  if (!ctx) {
    throw new Error(
      "useAppBarVariant must be used inside an AppBarVariantProvider"
    );
  }
  return ctx;
}
