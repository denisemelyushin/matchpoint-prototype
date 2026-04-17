"use client";

import { MenuIcon, PlusIcon } from "@/components/icons";
import { useAppBarVariant, type AppBarVariant } from "@/lib/app-bar-variant";

interface FeedAppBarProps {
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
   * When true, render static elements instead of interactive buttons. Use
   * this when the bar is displayed as a decorative preview inside another
   * interactive container (e.g. a picker tile).
   */
  decorative?: boolean;
  /**
   * Optional override. When omitted, the variant is read from context.
   */
  variant?: AppBarVariant;
}

export function FeedAppBar({
  title,
  onMenu,
  onAdd,
  addLabel,
  compact = false,
  decorative = false,
  variant: variantOverride,
}: FeedAppBarProps) {
  const ctx = useAppBarVariant();
  const variant = variantOverride ?? ctx.variant;
  const showAdd = decorative || !!onAdd;

  const topPad = compact ? "pt-3" : "pt-12";
  const containerClass = compact
    ? "relative flex items-center justify-between px-4 pb-3 bg-background"
    : `flex items-center justify-between px-4 ${topPad} pb-3 bg-background/80 backdrop-blur-xl sticky top-0 z-30`;

  const renderTitle = () =>
    decorative ? (
      <span aria-hidden className="text-lg font-bold text-foreground">
        {title}
      </span>
    ) : (
      <h1 className="text-lg font-bold text-foreground">{title}</h1>
    );

  if (variant === "B") {
    // Same layout as A (Classic) but with larger icons and a fixed brand
    // title instead of the per-tab page title.
    const brandTitle = "MatchPoint Pro";
    return (
      <div className={containerClass}>
        <MenuControl
          onMenu={onMenu}
          decorative={decorative}
          iconSize={30}
        />
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

  if (variant === "C") {
    return (
      <div className={containerClass}>
        <FramedIconControl
          ariaLabel="Open menu"
          onClick={onMenu}
          decorative={decorative}
        >
          <MenuIcon size={20} color="var(--color-foreground)" />
        </FramedIconControl>
        {renderTitle()}
        {showAdd ? (
          <FramedIconControl
            ariaLabel={addLabel ?? "Create new"}
            onClick={onAdd}
            decorative={decorative}
          >
            <PlusIcon size={20} color="var(--color-foreground)" />
          </FramedIconControl>
        ) : (
          <div className="w-10 h-10" aria-hidden />
        )}
      </div>
    );
  }

  if (variant === "D") {
    return (
      <div className={containerClass}>
        <MenuControl onMenu={onMenu} decorative={decorative} />
        <Wordmark decorative={decorative} />
        {showAdd ? (
          <AddControl
            onAdd={onAdd}
            addLabel={addLabel}
            decorative={decorative}
          />
        ) : (
          <Spacer />
        )}
      </div>
    );
  }

  // variant === "A" (default)
  return (
    <div className={containerClass}>
      <MenuControl onMenu={onMenu} decorative={decorative} />
      {renderTitle()}
      {showAdd ? (
        <AddControl
          onAdd={onAdd}
          addLabel={addLabel}
          decorative={decorative}
        />
      ) : (
        <Spacer />
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
  iconSize = 24,
}: {
  onMenu?: () => void;
  decorative: boolean;
  iconSize?: number;
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
  iconSize = 24,
}: {
  onAdd?: () => void;
  addLabel?: string;
  decorative: boolean;
  iconSize?: number;
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

function Spacer({ iconSize = 24 }: { iconSize?: number }) {
  // Mirror the width of MenuControl/AddControl (p-2 padding + icon) so the
  // centred title stays centred even when the Add button is hidden (e.g. on
  // the Players tab). Without this, bigger-icon variants visibly shift the
  // title toward the right.
  const size = iconSize + 16;
  return (
    <div
      aria-hidden
      className="-mr-2 shrink-0"
      style={{ width: size, height: size }}
    />
  );
}

function FramedIconControl({
  children,
  ariaLabel,
  onClick,
  decorative,
}: {
  children: React.ReactNode;
  ariaLabel: string;
  onClick?: () => void;
  decorative: boolean;
}) {
  const className =
    "w-10 h-10 rounded-xl bg-surface border border-border/60 flex items-center justify-center";
  if (decorative) {
    return (
      <span aria-hidden className={className}>
        {children}
      </span>
    );
  }
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={`${className} active:scale-95 active:bg-surface-light transition-all`}
    >
      {children}
    </button>
  );
}

function Wordmark({ decorative }: { decorative: boolean }) {
  const className =
    "text-lg font-bold tracking-tight text-foreground select-none";
  if (decorative) {
    return (
      <span aria-hidden className={className}>
        Matchpoint
      </span>
    );
  }
  return (
    <span aria-label="Matchpoint" className={className}>
      Matchpoint
    </span>
  );
}
