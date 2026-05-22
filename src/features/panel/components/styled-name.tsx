"use client";

import type { CSSProperties, ReactNode } from "react";

import { NAME_BY_ID } from "@/features/panel/names-data";

type Props = {
  styleId?: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

// Renders text with the visual treatment of the given name style id.
// Unknown / undefined styleId falls back to inheriting colour.
export function StyledName({ styleId, children, className = "", style }: Props) {
  const ns = styleId ? NAME_BY_ID[styleId] : undefined;
  const mergedClass = `${className} ${ns?.className ?? ""}`.trim();
  const mergedStyle: CSSProperties = {
    ...style,
    ...(ns?.color ? { color: ns.color } : null),
  };
  return (
    <span className={mergedClass} style={mergedStyle}>
      {children}
    </span>
  );
}
