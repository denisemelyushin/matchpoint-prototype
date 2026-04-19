"use client";

import { MenuIcon, PlusIcon } from "@/components/icons";

interface FeedAppBarProps {
  /**
   * Per-screen page title. The app bar intentionally shows a fixed
   * "MatchPoint Pro" brand title in the centre; this prop is accepted
   * for backwards compatibility (and used as the aria-label for the
   * heading on screens where relevant) but not rendered.
   */
  title: string;
  onMenu?: () => void;
  onAdd?: () => void;
  addLabel?: string;
  /**
   * When true, skip the safe-area top padding and sticky positioning so
   * the bar can be rendered inside a preview card.
   */
  compact?: boolean;
  /**
   * When true, render static elements instead of interactive buttons.
   */
  decorative?: boolean;
}

export function FeedAppBar({
  onMenu,
  onAdd,
  addLabel,
  compact = false,
  decorative = false,
}: FeedAppBarProps) {
  const showAdd = decorative || !!onAdd;
  const brandTitle = "MatchPoint Pro";

  const topPad = compact ? "pt-3" : "pt-12";
  const containerClass = compact
    ? "relative flex items-center justify-between px-4 pb-3 bg-background"
    : `flex items-center justify-between px-4 ${topPad} pb-3 bg-background/80 backdrop-blur-xl sticky top-0 z-30`;

  return (
    <div className={containerClass}>
      <MenuControl onMenu={onMenu} decorative={decorative} iconSize={30} />
      {decorative ? (
        <span aria-hidden className="text-lg font-bold text-foreground">
          {brandTitle}
        </span>
      ) : (
        <h1 className="text-lg font-bold text-foreground">{brandTitle}</h1>
      )}
      {showAdd ? (
        <AddControl
          onAdd={onAdd}
          addLabel={addLabel}
          decorative={decorative}
          iconSize={30}
        />
      ) : (
        <Spacer iconSize={30} />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Shared bits                                                                */
/* -------------------------------------------------------------------------- */

function MenuControl({
  onMenu,
  decorative,
  iconSize,
}: {
  onMenu?: () => void;
  decorative: boolean;
  iconSize: number;
}) {
  const icon = <MenuIcon size={iconSize} color="var(--color-foreground)" />;
  if (decorative) {
    return (
      <span aria-hidden className="p-2 -ml-2 inline-flex">
        {icon}
      </span>
    );
  }
  return (
    <button
      onClick={onMenu}
      className="p-2 -ml-2 active:scale-90 transition-transform"
      aria-label="Open menu"
    >
      {icon}
    </button>
  );
}

function AddControl({
  onAdd,
  addLabel,
  decorative,
  iconSize,
}: {
  onAdd?: () => void;
  addLabel?: string;
  decorative: boolean;
  iconSize: number;
}) {
  const icon = <PlusIcon size={iconSize} color="var(--color-foreground)" />;
  if (decorative) {
    return (
      <span aria-hidden className="p-2 -mr-2 inline-flex">
        {icon}
      </span>
    );
  }
  return (
    <button
      onClick={onAdd}
      className="p-2 -mr-2 active:scale-90 transition-transform"
      aria-label={addLabel ?? "Create new"}
    >
      {icon}
    </button>
  );
}

function Spacer({ iconSize }: { iconSize: number }) {
  // Mirror the width of MenuControl / AddControl (icon + p-2 padding) so the
  // centred title stays centred on screens where the Add button is hidden.
  const size = iconSize + 16;
  return (
    <div
      aria-hidden
      className="-mr-2 shrink-0"
      style={{ width: size, height: size }}
    />
  );
}
