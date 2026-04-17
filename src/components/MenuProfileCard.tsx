"use client";

import type { ReactNode } from "react";
import { Avatar } from "./Avatar";
import { EditIcon } from "./icons";
import {
  useMenuProfileVariant,
  type MenuProfileVariant,
} from "@/lib/menu-profile-variant";

interface MenuProfileCardProps {
  name: string;
  email: string;
  initials: string;
  /**
   * Called when the card is tapped. Every variant is a single tap target
   * that goes directly to the edit-profile screen.
   */
  onEdit?: () => void;
  tabIndex?: number;
  /**
   * Render static elements instead of a button. Use when the card is
   * displayed inside another interactive container (e.g. a picker tile).
   */
  decorative?: boolean;
  /** Override the context variant; primarily for preview use. */
  variant?: MenuProfileVariant;
}

type VariantSpec = {
  containerClass: string;
  avatarSize: number;
  nameClass: string;
  emailClass: string;
  showPencil?: boolean;
};

const VARIANT_SPECS: Record<MenuProfileVariant, VariantSpec> = {
  A: {
    containerClass:
      "bg-surface-light rounded-2xl p-4 flex items-center gap-3",
    avatarSize: 52,
    nameClass: "font-semibold text-foreground text-[15px] truncate",
    emailClass: "text-muted text-xs truncate mt-0.5",
  },
  B: {
    containerClass:
      "rounded-2xl border border-border/60 p-4 flex items-center gap-3",
    avatarSize: 52,
    nameClass: "font-semibold text-foreground text-[15px] truncate",
    emailClass: "text-muted text-xs truncate mt-0.5",
  },
  C: {
    containerClass:
      "bg-surface-light rounded-2xl p-3 pr-4 flex items-center gap-3",
    avatarSize: 44,
    nameClass:
      "font-semibold text-foreground text-[14px] truncate leading-tight",
    emailClass: "text-muted text-[11px] truncate mt-0.5",
    showPencil: true,
  },
  D: {
    containerClass:
      "rounded-2xl border border-border/60 p-4 pr-5 flex items-center gap-3",
    avatarSize: 52,
    nameClass: "font-semibold text-foreground text-[15px] truncate",
    emailClass: "text-muted text-xs truncate mt-0.5",
    showPencil: true,
  },
};

export function MenuProfileCard({
  name,
  email,
  initials,
  onEdit,
  tabIndex = 0,
  decorative = false,
  variant: variantOverride,
}: MenuProfileCardProps) {
  const ctx = useMenuProfileVariant();
  const variant = variantOverride ?? ctx.variant;
  const spec = VARIANT_SPECS[variant];

  const body = (
    <>
      <Avatar name={name} initials={initials} size={spec.avatarSize} />
      <span className="min-w-0 flex-1 block">
        <span className={`${spec.nameClass} block`}>{name}</span>
        <span className={`${spec.emailClass} block`}>{email}</span>
      </span>
      {spec.showPencil && (
        <span aria-hidden className="shrink-0 text-muted">
          <EditIcon size={16} color="currentColor" />
        </span>
      )}
    </>
  );

  return (
    <Tile
      decorative={decorative}
      onClick={onEdit}
      tabIndex={tabIndex}
      className={spec.containerClass}
    >
      {body}
    </Tile>
  );
}

/* -------------------------------------------------------------------------- */
/*  Internal tile wrapper                                                      */
/* -------------------------------------------------------------------------- */

function Tile({
  decorative,
  onClick,
  tabIndex,
  className,
  children,
}: {
  decorative: boolean;
  onClick?: () => void;
  tabIndex: number;
  className: string;
  children: ReactNode;
}) {
  if (decorative) {
    return (
      <div aria-hidden className={`w-full text-left ${className}`}>
        {children}
      </div>
    );
  }
  return (
    <button
      onClick={onClick}
      aria-label="Edit profile"
      tabIndex={tabIndex}
      className={`w-full text-left active:opacity-80 transition-opacity ${className}`}
    >
      {children}
    </button>
  );
}
