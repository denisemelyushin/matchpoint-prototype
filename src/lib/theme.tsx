"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type ThemeMode = "dark" | "light";

export type ThemeId =
  | "dark-lime"
  | "dark-blue"
  | "dark-ember"
  | "dark-violet"
  | "light-daylight"
  | "light-paper"
  | "light-coral";

export interface ThemeSwatches {
  /** Main app background */
  bg: string;
  /** Card / surface colour */
  surface: string;
  /** Primary accent colour */
  primary: string;
}

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  description: string;
  mode: ThemeMode;
  /** Matches the mobile browser chrome; also used for quick-glance previews. */
  browserThemeColor: string;
  swatches: ThemeSwatches;
}

/**
 * The full palette of themes the app ships with. Colours here are intentionally
 * a *preview* (three swatches for the picker) — the actual runtime values live
 * in globals.css under `:root[data-theme="…"]` so Tailwind utilities can pick
 * them up directly.
 */
export const THEMES: ThemeDefinition[] = [
  {
    id: "dark-lime",
    name: "Midnight Lime",
    description: "The original — deep black with neon pickleball green.",
    mode: "dark",
    browserThemeColor: "#0A0A0A",
    swatches: { bg: "#0A0A0A", surface: "#1A1A1A", primary: "#96FE17" },
  },
  {
    id: "dark-blue",
    name: "Court Blue",
    description: "Stadium navy with an electric-blue accent.",
    mode: "dark",
    browserThemeColor: "#0A1020",
    swatches: { bg: "#0A1020", surface: "#141B2E", primary: "#60A5FA" },
  },
  {
    id: "dark-ember",
    name: "Ember",
    description: "Warm near-black and sunset-orange for evening play.",
    mode: "dark",
    browserThemeColor: "#140D08",
    swatches: { bg: "#140D08", surface: "#1E1711", primary: "#FB923C" },
  },
  {
    id: "dark-violet",
    name: "Violet Rally",
    description: "Deep violet with a punchy magenta highlight.",
    mode: "dark",
    browserThemeColor: "#100B1C",
    swatches: { bg: "#100B1C", surface: "#1A142A", primary: "#E879F9" },
  },
  {
    id: "light-daylight",
    name: "Daylight",
    description: "Crisp white background with a forest-green accent.",
    mode: "light",
    browserThemeColor: "#FFFFFF",
    swatches: { bg: "#FFFFFF", surface: "#F4F6FA", primary: "#16A34A" },
  },
  {
    id: "light-paper",
    name: "Paper",
    description: "Warm cream with a classic navy accent.",
    mode: "light",
    browserThemeColor: "#FAF7F2",
    swatches: { bg: "#FAF7F2", surface: "#F2EEE6", primary: "#1D4ED8" },
  },
  {
    id: "light-coral",
    name: "Coral",
    description: "Soft peach and terracotta for a friendly, warm feel.",
    mode: "light",
    browserThemeColor: "#FFF6F0",
    swatches: { bg: "#FFF6F0", surface: "#FDEBDF", primary: "#EA580C" },
  },
];

export const DEFAULT_THEME: ThemeId = "dark-lime";
export const THEME_STORAGE_KEY = "matchpoint:theme";

const THEME_IDS = new Set<ThemeId>(THEMES.map((t) => t.id));

function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && THEME_IDS.has(value as ThemeId);
}

interface ThemeContextValue {
  themeId: ThemeId;
  theme: ThemeDefinition;
  setThemeId: (id: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyThemeToDocument(id: ThemeId) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", id);

  // Keep the mobile browser chrome colour in sync.
  const theme = THEMES.find((t) => t.id === id);
  if (!theme) return;
  const meta = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]'
  );
  if (meta) {
    meta.content = theme.browserThemeColor;
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState<ThemeId>(DEFAULT_THEME);

  // On mount, reconcile React state with whatever the pre-hydration script
  // already applied to <html data-theme="…">.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (isThemeId(stored)) {
        setThemeIdState(stored);
        applyThemeToDocument(stored);
        return;
      }
    } catch {
      // ignore storage errors
    }
    applyThemeToDocument(DEFAULT_THEME);
  }, []);

  const setThemeId = useCallback((id: ThemeId) => {
    setThemeIdState(id);
    applyThemeToDocument(id);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, id);
    } catch {
      // ignore storage errors
    }
  }, []);

  const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0];

  return (
    <ThemeContext.Provider value={{ themeId, theme, setThemeId }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used inside a ThemeProvider");
  }
  return ctx;
}

/**
 * Inline script (stringified) that runs before React hydrates to pick up the
 * saved theme from localStorage and stamp it on <html data-theme>. Prevents
 * a flash of the default dark theme on light-theme reloads.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');var v=${JSON.stringify(
  [...THEME_IDS]
)};if(t&&v.indexOf(t)>-1){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;
