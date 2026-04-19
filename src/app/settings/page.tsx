"use client";

import { AppHeader } from "@/components/AppHeader";
import { CheckIcon } from "@/components/icons";
import {
  THEMES,
  useTheme,
  type ThemeDefinition,
} from "@/lib/theme";

export default function SettingsPage() {
  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Settings" />
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-10">
        <ThemeSection />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Theme picker                                                              */
/* -------------------------------------------------------------------------- */

function ThemeSection() {
  const { themeId, setThemeId } = useTheme();

  return (
    <section className="mb-8">
      <div className="mb-4 px-1">
        <h2 className="text-[15px] font-semibold text-foreground uppercase tracking-wider">
          App theme
        </h2>
        <p className="text-muted text-[13px] mt-1 leading-relaxed">
          Pick a look, each one inspired by a popular sport or social app.
          Your choice is saved locally and applies instantly.
        </p>
      </div>

      <div className="space-y-2">
        {THEMES.map((theme) => (
          <ThemeTile
            key={theme.id}
            theme={theme}
            selected={themeId === theme.id}
            onSelect={() => setThemeId(theme.id)}
          />
        ))}
      </div>
    </section>
  );
}

interface ThemeTileProps {
  theme: ThemeDefinition;
  selected: boolean;
  onSelect: () => void;
}

function ThemeTile({ theme, selected, onSelect }: ThemeTileProps) {
  const primaryBackground =
    theme.swatches.primaryGradient ?? theme.swatches.primary;
  return (
    <button
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`${theme.name} theme, inspired by ${theme.inspiredBy}`}
      className={`relative w-full text-left rounded-2xl overflow-hidden border transition-all active:scale-[0.99] ${
        selected
          ? "border-primary/70 ring-2 ring-primary/30"
          : "border-border/60"
      }`}
    >
      {/* Swatch preview — bg + surface tile + faux text bar + primary + accent */}
      <div
        className="h-24 flex items-end p-3 gap-2"
        style={{ backgroundColor: theme.swatches.bg }}
      >
        <div
          className="w-10 h-12 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.25)]"
          style={{ backgroundColor: theme.swatches.surface }}
          aria-hidden
        />
        <div className="flex-1 flex flex-col gap-1.5 justify-end">
          <div
            className="h-2 rounded-full w-4/5"
            style={{ backgroundColor: theme.swatches.surface }}
            aria-hidden
          />
          <div
            className="h-2 rounded-full w-3/5"
            style={{ backgroundColor: theme.swatches.surface, opacity: 0.6 }}
            aria-hidden
          />
        </div>
        {theme.swatches.accent && (
          <div
            className="w-6 h-6 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.25)]"
            style={{ backgroundColor: theme.swatches.accent }}
            aria-hidden
          />
        )}
        <div
          className="w-10 h-10 rounded-full shadow-[0_2px_6px_rgba(0,0,0,0.35)]"
          style={{ background: primaryBackground }}
          aria-hidden
        />
      </div>
      {/* Label */}
      <div className="px-4 py-3 bg-surface">
        <div className="flex items-baseline gap-2">
          <p className="font-semibold text-foreground text-[15px] leading-tight truncate">
            {theme.name}
          </p>
          <p className="text-muted text-[11px] uppercase tracking-wider shrink-0">
            {theme.inspiredBy}
          </p>
        </div>
        <p className="text-muted text-[13px] mt-1 leading-snug">
          {theme.description}
        </p>
      </div>
      {selected && (
        <div
          className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-[0_2px_6px_rgba(0,0,0,0.35)]"
          aria-hidden
        >
          <CheckIcon size={14} color="var(--app-primary-on)" />
        </div>
      )}
    </button>
  );
}
