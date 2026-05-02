import React, { useState, useMemo, useEffect } from 'react';
import Pager from './Pager';

export interface Paged8Props<T extends { id: string }> {
  /** All items in display order (caller is responsible for sorting). */
  items: T[];
  /** Per-item renderer. `absoluteIndex` is the item's index in the unpaginated list. */
  renderItem: (item: T, absoluteIndex: number) => React.ReactNode;
  /** Optional: an item to always show, separated, when not on the current page. */
  pinnedItem?: T | null;
  /** Renderer for the pinned row (typically a styled "you" row). */
  pinnedRenderer?: (item: T, absoluteIndex: number) => React.ReactNode;
  /** Empty state shown when items.length === 0. */
  emptyState?: React.ReactNode;
  /** Page size. Default 8. Don't change this for Phase 2. */
  pageSize?: number;
  /** Optional aria-label for the list. */
  ariaLabel?: string;
}

export function Paged8<T extends { id: string }>({
  items,
  renderItem,
  pinnedItem = null,
  pinnedRenderer,
  emptyState = null,
  pageSize = 8,
  ariaLabel,
}: Paged8Props<T>) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  // If items shrink (e.g. friend removed), clamp the page so we don't render an empty list
  useEffect(() => {
    if (page > totalPages - 1) setPage(Math.max(0, totalPages - 1));
  }, [page, totalPages]);

  const start = page * pageSize;
  const end = start + pageSize;
  const visible = useMemo(() => items.slice(start, end), [items, start, end]);

  const pinnedAbsoluteIndex = useMemo(
    () => (pinnedItem ? items.findIndex((i) => i.id === pinnedItem.id) : -1),
    [items, pinnedItem],
  );
  const pinnedOnCurrentPage =
    !!pinnedItem && pinnedAbsoluteIndex >= start && pinnedAbsoluteIndex < end;
  const showPinnedRow =
    !!pinnedItem && !!pinnedRenderer && pinnedAbsoluteIndex >= 0 && !pinnedOnCurrentPage;

  if (items.length === 0) {
    return <>{emptyState}</>;
  }

  return (
    <div role="list" aria-label={ariaLabel}>
      {/* Page contents — keyed by page so the inner subtree remounts on page change for animation */}
      <div
        key={page}
        style={{
          animation: 'paged8Slide 220ms cubic-bezier(0.22, 0.61, 0.36, 1) both',
        }}
      >
        {visible.map((it, idx) => (
          <div role="listitem" key={it.id}>
            {renderItem(it, start + idx)}
          </div>
        ))}
      </div>

      {/* Pinned row — only when pinned item exists and is off the current page */}
      {showPinnedRow && pinnedItem && pinnedRenderer && (
        <div
          role="listitem"
          aria-label="Your position"
          style={{
            borderTop: '2px solid rgba(247,147,30,0.20)',
            background: 'rgba(247,147,30,0.04)',
          }}
        >
          {pinnedRenderer(pinnedItem, pinnedAbsoluteIndex)}
        </div>
      )}

      {/* Pager — only when more than one page */}
      {totalPages > 1 && (
        <Pager page={page} totalPages={totalPages} onChange={setPage} />
      )}

      {/* Animation keyframes — local to this component */}
      <style>{`
        @keyframes paged8Slide {
          from { opacity: 0; transform: translateX(8px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

export default Paged8;
