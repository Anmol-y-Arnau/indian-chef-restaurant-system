import { MenuCard } from "./MenuCard";
import { memo } from "react";

/**
 * Memoized version of MenuCard to prevent unnecessary re-renders
 * Only re-renders when item or onAdd props change
 */
export const MenuCardMemo = memo(MenuCard, (prevProps, nextProps) => {
  // Custom comparison: only re-render if item.id or onAdd reference changes
  return prevProps.item.id === nextProps.item.id && prevProps.onAdd === nextProps.onAdd;
});

MenuCardMemo.displayName = "MenuCardMemo";
