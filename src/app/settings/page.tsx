"use client";

import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { BottomTabs, type TabId } from "@/components/BottomTabs";
import { CheckIcon } from "@/components/icons";
import {
  TAB_BAR_VARIANTS,
  useTabBarVariant,
  type TabBarVariant,
} from "@/lib/tab-bar-variant";

export default function SettingsPage() {
  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Settings" />
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-10">
        <TabBarStyleSection />
        <PreviewTabBar />
      </div>
    </div>
  );
}

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
          {selected && <CheckIcon size={12} color="#0A0A0A" />}
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
