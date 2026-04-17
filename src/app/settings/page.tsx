"use client";

import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { BottomTabs, type TabId } from "@/components/BottomTabs";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FeedAppBar } from "@/components/FeedAppBar";
import { MenuProfileCard } from "@/components/MenuProfileCard";
import { CheckIcon } from "@/components/icons";
import { useAppStore } from "@/lib/app-store";
import {
  DEFAULT_TAB_BAR_VARIANT,
  TAB_BAR_VARIANTS,
  useTabBarVariant,
  type TabBarVariant,
} from "@/lib/tab-bar-variant";
import {
  APP_BAR_VARIANTS,
  DEFAULT_APP_BAR_VARIANT,
  useAppBarVariant,
  type AppBarVariant,
} from "@/lib/app-bar-variant";
import {
  DEFAULT_MENU_PROFILE_VARIANT,
  MENU_PROFILE_VARIANTS,
  useMenuProfileVariant,
  type MenuProfileVariant,
} from "@/lib/menu-profile-variant";
import {
  DEFAULT_THEME,
  THEMES,
  useTheme,
  type ThemeDefinition,
} from "@/lib/theme";

export default function SettingsPage() {
  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Settings" />
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-10">
        <ResetSection />
        <ThemeSection />
        <AppBarStyleSection />
        <MenuProfileStyleSection />
        <TabBarStyleSection />
        <PreviewTabBar />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Reset-to-default control                                                  */
/* -------------------------------------------------------------------------- */

function ResetSection() {
  const { themeId, setThemeId } = useTheme();
  const { variant: appBarVariant, setVariant: setAppBarVariant } =
    useAppBarVariant();
  const { variant: menuProfileVariant, setVariant: setMenuProfileVariant } =
    useMenuProfileVariant();
  const { variant: tabBarVariant, setVariant: setTabBarVariant } =
    useTabBarVariant();
  const [open, setOpen] = useState(false);

  const isDirty =
    themeId !== DEFAULT_THEME ||
    appBarVariant !== DEFAULT_APP_BAR_VARIANT ||
    menuProfileVariant !== DEFAULT_MENU_PROFILE_VARIANT ||
    tabBarVariant !== DEFAULT_TAB_BAR_VARIANT;

  const handleConfirm = () => {
    setThemeId(DEFAULT_THEME);
    setAppBarVariant(DEFAULT_APP_BAR_VARIANT);
    setMenuProfileVariant(DEFAULT_MENU_PROFILE_VARIANT);
    setTabBarVariant(DEFAULT_TAB_BAR_VARIANT);
    setOpen(false);
  };

  if (!isDirty) return null;

  return (
    <>
      <section className="mb-8">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full py-3 rounded-2xl border border-primary/60 bg-primary/[0.08] text-primary text-[14px] font-semibold active:opacity-80 transition-opacity"
        >
          Reset Default Settings
        </button>
      </section>
      <ConfirmDialog
        open={open}
        title="Reset settings?"
        message="This restores the default theme, app bar, menu profile, and tab bar styles. Your account and data are not affected."
        confirmLabel="Reset"
        cancelLabel="Cancel"
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Theme picker                                                              */
/* -------------------------------------------------------------------------- */

function ThemeSection() {
  const { themeId, setThemeId } = useTheme();
  const darkThemes = THEMES.filter((t) => t.mode === "dark");
  const lightThemes = THEMES.filter((t) => t.mode === "light");

  return (
    <section className="mb-8">
      <div className="mb-4 px-1">
        <h2 className="text-[15px] font-semibold text-foreground uppercase tracking-wider">
          App theme
        </h2>
        <p className="text-muted text-[13px] mt-1 leading-relaxed">
          Pick a look. Your choice is saved locally and applies instantly.
        </p>
      </div>

      <p className="px-1 mb-2 text-muted text-[11px] uppercase tracking-wider">
        Dark
      </p>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {darkThemes.map((theme) => (
          <ThemeTile
            key={theme.id}
            theme={theme}
            selected={themeId === theme.id}
            onSelect={() => setThemeId(theme.id)}
          />
        ))}
      </div>

      <p className="px-1 mb-2 text-muted text-[11px] uppercase tracking-wider">
        Light
      </p>
      <div className="grid grid-cols-2 gap-2">
        {lightThemes.map((theme) => (
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
  return (
    <button
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`${theme.name} theme`}
      className={`relative text-left rounded-2xl overflow-hidden border transition-all active:scale-[0.98] ${
        selected
          ? "border-primary/70 ring-2 ring-primary/30"
          : "border-border/60"
      }`}
    >
      {/* Swatch preview */}
      <div
        className="h-20 flex items-end p-2.5 gap-1.5"
        style={{ backgroundColor: theme.swatches.bg }}
      >
        <div
          className="w-8 h-8 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.25)]"
          style={{ backgroundColor: theme.swatches.surface }}
          aria-hidden
        />
        <div
          className="flex-1 h-3 rounded-full"
          style={{ backgroundColor: theme.swatches.surface }}
          aria-hidden
        />
        <div
          className="w-8 h-8 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.25)]"
          style={{ backgroundColor: theme.swatches.primary }}
          aria-hidden
        />
      </div>
      {/* Label */}
      <div className="px-3 py-2.5 bg-surface">
        <p className="font-semibold text-foreground text-[13px] leading-tight truncate">
          {theme.name}
        </p>
        <p className="text-muted text-[11px] mt-0.5 line-clamp-2 leading-snug">
          {theme.description}
        </p>
      </div>
      {selected && (
        <div
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-[0_2px_6px_rgba(0,0,0,0.35)]"
          aria-hidden
        >
          <CheckIcon size={14} color="var(--app-primary-on)" />
        </div>
      )}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  App-bar style                                                             */
/* -------------------------------------------------------------------------- */

function AppBarStyleSection() {
  const { variant, setVariant } = useAppBarVariant();
  return (
    <section className="mb-8">
      <div className="mb-4 px-1">
        <h2 className="text-[15px] font-semibold text-foreground uppercase tracking-wider">
          App bar style
        </h2>
        <p className="text-muted text-[13px] mt-1 leading-relaxed">
          Pick how the top bar looks on the Feed, Games, Players and Chats
          screens.
        </p>
      </div>

      <div className="space-y-2">
        {APP_BAR_VARIANTS.map((option) => (
          <AppBarVariantRow
            key={option.id}
            id={option.id}
            label={option.label}
            description={option.description}
            selected={variant === option.id}
            onSelect={() => setVariant(option.id)}
          />
        ))}
      </div>
    </section>
  );
}

interface AppBarVariantRowProps {
  id: AppBarVariant;
  label: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}

function AppBarVariantRow({
  id,
  label,
  description,
  selected,
  onSelect,
}: AppBarVariantRowProps) {
  return (
    <button
      onClick={onSelect}
      aria-pressed={selected}
      className={`w-full text-left rounded-2xl border transition-colors overflow-hidden active:scale-[0.99] ${
        selected
          ? "border-primary/60 bg-primary/[0.06]"
          : "border-border/60 bg-surface"
      }`}
    >
      {/* Preview */}
      <div className="relative border-b border-border/40 bg-background/60">
        <FeedAppBar
          variant={id}
          title="Feed"
          compact
          decorative
        />
      </div>
      {/* Label */}
      <div className="flex items-start gap-3 p-4">
        <div
          className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
            selected ? "bg-primary" : "border-2 border-border bg-transparent"
          }`}
          aria-hidden
        >
          {selected && <CheckIcon size={12} color="var(--app-primary-on)" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-[15px] leading-tight">
            {label}
          </p>
          <p className="text-muted text-[13px] mt-1 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Menu profile style                                                        */
/* -------------------------------------------------------------------------- */

function MenuProfileStyleSection() {
  const { variant, setVariant } = useMenuProfileVariant();
  const { currentUser } = useAppStore();
  return (
    <section className="mb-8">
      <div className="mb-4 px-1">
        <h2 className="text-[15px] font-semibold text-foreground uppercase tracking-wider">
          Menu profile style
        </h2>
        <p className="text-muted text-[13px] mt-1 leading-relaxed">
          Pick how the profile card looks at the top of the slide-out menu.
        </p>
      </div>

      <div className="space-y-2">
        {MENU_PROFILE_VARIANTS.map((option) => (
          <MenuProfileVariantRow
            key={option.id}
            id={option.id}
            label={option.label}
            description={option.description}
            selected={variant === option.id}
            onSelect={() => setVariant(option.id)}
            name={currentUser.name}
            email={currentUser.email}
            initials={currentUser.initials}
          />
        ))}
      </div>
    </section>
  );
}

interface MenuProfileVariantRowProps {
  id: MenuProfileVariant;
  label: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
  name: string;
  email: string;
  initials: string;
}

function MenuProfileVariantRow({
  id,
  label,
  description,
  selected,
  onSelect,
  name,
  email,
  initials,
}: MenuProfileVariantRowProps) {
  return (
    <button
      onClick={onSelect}
      aria-pressed={selected}
      className={`w-full text-left rounded-2xl border transition-colors overflow-hidden active:scale-[0.99] ${
        selected
          ? "border-primary/60 bg-primary/[0.06]"
          : "border-border/60 bg-surface"
      }`}
    >
      {/* Preview */}
      <div className="relative border-b border-border/40 bg-background/60 p-4">
        <MenuProfileCard
          variant={id}
          name={name}
          email={email}
          initials={initials}
          decorative
        />
      </div>
      {/* Label */}
      <div className="flex items-start gap-3 p-4">
        <div
          className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
            selected ? "bg-primary" : "border-2 border-border bg-transparent"
          }`}
          aria-hidden
        >
          {selected && <CheckIcon size={12} color="var(--app-primary-on)" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-[15px] leading-tight">
            {label}
          </p>
          <p className="text-muted text-[13px] mt-1 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tab-bar style                                                             */
/* -------------------------------------------------------------------------- */

function TabBarStyleSection() {
  const { variant, setVariant } = useTabBarVariant();
  return (
    <section>
      <div className="mb-4 px-1">
        <h2 className="text-[15px] font-semibold text-foreground uppercase tracking-wider">
          Tab bar style
        </h2>
        <p className="text-muted text-[13px] mt-1 leading-relaxed">
          Pick a variant. Your choice is saved locally and applies instantly.
        </p>
      </div>

      <div className="space-y-2">
        {TAB_BAR_VARIANTS.map((option) => (
          <VariantRow
            key={option.id}
            id={option.id}
            label={option.label}
            description={option.description}
            selected={variant === option.id}
            onSelect={() => setVariant(option.id)}
          />
        ))}
      </div>
    </section>
  );
}

interface VariantRowProps {
  id: TabBarVariant;
  label: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}

function VariantRow({ label, description, selected, onSelect }: VariantRowProps) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-2xl border transition-colors active:scale-[0.99] ${
        selected
          ? "border-primary/60 bg-primary/[0.06]"
          : "border-border/60 bg-surface"
      }`}
      aria-pressed={selected}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
            selected
              ? "bg-primary"
              : "border-2 border-border bg-transparent"
          }`}
          aria-hidden
        >
          {selected && <CheckIcon size={12} color="var(--app-primary-on)" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-[15px] leading-tight">
            {label}
          </p>
          <p className="text-muted text-[13px] mt-1 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tab-bar preview (non-navigating)                                          */
/* -------------------------------------------------------------------------- */

function PreviewTabBar() {
  const [demoTab, setDemoTab] = useState<TabId>("feed");
  return (
    <section className="mt-8">
      <div className="px-1 mb-3">
        <h2 className="text-[15px] font-semibold text-foreground uppercase tracking-wider">
          Preview
        </h2>
        <p className="text-muted text-[13px] mt-1 leading-relaxed">
          Tap between tabs to try the active state. This is a demo — it
          doesn&apos;t navigate.
        </p>
      </div>
      <div
        className="relative h-[76px] rounded-2xl bg-surface/40 border border-border/60 overflow-hidden flex flex-col justify-end"
        aria-label="Tab bar preview"
      >
        <BottomTabs activeTab={demoTab} onTabChange={setDemoTab} />
      </div>
    </section>
  );
}
