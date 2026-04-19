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
  | "strava"
  | "nike"
  | "partiful"
  | "apple-fitness"
  | "playtomic";

export interface ThemeSwatches {
  /** Main app background */
  bg: string;
  /** Card / surface colour */
  surface: string;
  /** Primary accent colour (flat). */
  primary: string;
  /** Secondary accent dot in the preview tile (optional). */
  accent?: string;
  /**
   * Optional CSS linear-gradient used as the primary swatch background.
   * Set for themes whose primary CTA uses a gradient (Partiful).
   */
  primaryGradient?: string;
}

export interface ThemeDefinition {
  id: ThemeId;
  /** Product-facing name ("Midnight Lime"). */
  name: string;
  /** Short reference to the app this look is inspired by. */
  inspiredBy: string;
  /** One-sentence mood / usage description. */
  description: string;
  mode: ThemeMode;
  /** Matches the mobile browser chrome; also used for quick-glance previews. */
  browserThemeColor: string;
  swatches: ThemeSwatches;
}

/**
 * The five app themes. Colours here are a *preview* for the picker — the
 * actual runtime values live in globals.css under `:root[data-theme="…"]`
 * so Tailwind utilities can pick them up directly.
 */
export const THEMES: ThemeDefinition[] = [
  {
    id: "strava",
    name: "Midnight Lime",
    inspiredBy: "Strava",
    description:
      "Performance athletic. Deep black canvas with a neon pickleball-green primary.",
    mode: "dark",
    browserThemeColor: "#0A0A0A",
    swatches: {
      bg: "#0A0A0A",
      surface: "#1A1A1A",
      primary: "#96FE17",
      accent: "#FF5A1F",
    },
  },
  {
    id: "nike",
    name: "Volt Slab",
    inspiredBy: "Nike Run Club",
    description:
      "Editorial brutalist. Pure black + Volt lime, hard corners, oversized caps type.",
    mode: "dark",
    browserThemeColor: "#000000",
    swatches: {
      bg: "#000000",
      surface: "#0D0D0D",
      primary: "#CEFF00",
      accent: "#FF5A1F",
    },
  },
  {
    id: "partiful",
    name: "Party Plum",
    inspiredBy: "Partiful",
    description:
      "Playful social. Warm plum background with a hot-pink → tangerine gradient.",
    mode: "dark",
    browserThemeColor: "#1A0E23",
    swatches: {
      bg: "#1A0E23",
      surface: "#2A1A36",
      primary: "#FF4D8F",
      accent: "#FFB547",
      primaryGradient: "linear-gradient(135deg, #FF4D8F 0%, #FF8A3D 100%)",
    },
  },
  {
    id: "apple-fitness",
    name: "Jet Noir",
    inspiredBy: "Apple Fitness+",
    description:
      "Calm iOS-native. Jet-black canvas, system font, and an iOS-green primary.",
    mode: "dark",
    browserThemeColor: "#000000",
    swatches: {
      bg: "#000000",
      surface: "#1C1C1E",
      primary: "#32D74B",
      accent: "#0A84FF",
    },
  },
  {
    id: "playtomic",
    name: "Court Green",
    inspiredBy: "Playtomic",
    description:
      "Court-native sporty light mode. Crisp off-white with tennis-green and clay-orange.",
    mode: "light",
    browserThemeColor: "#F6F7F4",
    swatches: {
      bg: "#F6F7F4",
      surface: "#FFFFFF",
      primary: "#1E8E3E",
      accent: "#E06B2A",
    },
  },
];

export const DEFAULT_THEME: ThemeId = "strava";
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
