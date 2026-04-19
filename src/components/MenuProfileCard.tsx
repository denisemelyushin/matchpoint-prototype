"use client";

import type { ReactNode } from "react";
import { Avatar } from "./Avatar";

interface MenuProfileCardProps {
  name: string;
  email: string;
  initials: string;
  /**
   * Called when the card is tapped. The whole card is a single tap target
   * that goes directly to the edit-profile screen.
   */
  onEdit?: () => void;
  tabIndex?: number;
  /**
   * Render static elements instead of a button. Use when the card is
   * displayed inside another interactive container (e.g. a picker tile).
   */
  decorative?: boolean;
}

const CONTAINER_CLASS =
  "rounded-2xl border border-border/60 p-4 flex items-center gap-3";

export function MenuProfileCard({
  name,
  email,
  initials,
  onEdit,
  tabIndex = 0,
  decorative = false,
}: MenuProfileCardProps) {
  const body = (
    <>
      <Avatar name={name} initials={initials} size={44} />
      <span className="min-w-0 flex-1 block">
        <span className="font-semibold text-foreground text-[17px] truncate block leading-tight">
          {name}
        </span>
        <span className="text-muted text-[13px] truncate block leading-tight">
          {email}
        </span>
      </span>
    </>
  );

  return (
    <Tile
      decorative={decorative}
      onClick={onEdit}
      tabIndex={tabIndex}
      className={CONTAINER_CLASS}
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
