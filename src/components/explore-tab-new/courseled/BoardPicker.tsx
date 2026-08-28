/**
 * BoardPicker — the Discover board's CATEGORY sheet.
 *
 * MICRO_BRIEF_BOARD_PICKER_ON_TITLE: the control now lives ON THE BOARD TITLE,
 * not in the ChromeIsland's left capsule. This component is therefore a pure
 * controlled bottom sheet — no chrome slot, no internal open state. The chrome
 * island reverts to registry.ts's declared `logo` left cell simply by nobody
 * registering a slot for this surface.
 *
 * THE LABEL FOLLOWS THE BOARD. `category` is passed in as the category the
 * board is ACTUALLY rendering (after any fallback), never as a raw selection.
 */
import React from 'react';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { SheetHeader } from '@/components/ui/SheetHeader';

import { A, DISCOVER_FACT, DISCOVER_QUIET, SANS } from './tokens';

const AMBER = '#F7931E';
const AMBER_WASH = 'rgba(247,147,30,0.10)';

export interface BoardCategoryOption<K extends string> {
  key: K;
  /** Long form — the hero title and the sheet row. */
  label: string;
  /** Short form — retained for callers; unused now the island slot is gone. */
  short: string;
  /** How many ranked members this board holds right now. 0 dims the row. */
  count: number;
}

interface Props<K extends string> {
  open: boolean;
  onClose: () => void;
  /** The category the board is RENDERING, not the stored selection. */
  category: K;
  options: ReadonlyArray<BoardCategoryOption<K>>;
  onSelect: (k: K) => void;
  sheetEyebrow: string;
  sheetTitle: string;
}

export function BoardPicker<K extends string>({
  open,
  onClose,
  category,
  options,
  onSelect,
  sheetEyebrow,
  sheetTitle,
}: Props<K>) {
  return (
    <BottomSheet open={open} onClose={onClose} ariaLabelledBy="board-category-title">
      <SheetHeader
        eyebrow={sheetEyebrow}
        title={<span id="board-category-title">{sheetTitle}</span>}
        onClose={onClose}
      />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {options.map((o) => {
          const isActive = o.key === category;
          return (
            <button
              key={o.key}
              type="button"
              aria-pressed={isActive}
              disabled={o.count === 0}
              onClick={() => {
                onSelect(o.key);
                onClose();
              }}
              style={{
                /* A board with no qualifiers is DIMMED, never hidden — a picker
                   whose contents change week to week reads as broken. */
                opacity: o.count === 0 ? 0.35 : 1,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '13px 16px',
                background: isActive ? AMBER_WASH : 'transparent',
                border: 'none',
                borderBottom: `0.5px solid ${A.HAIRLINE}`,
                cursor: o.count === 0 ? 'default' : 'pointer',
                textAlign: 'left',
                fontFamily: SANS,
              }}
            >
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: 14,
                  fontWeight: 700,
                  color: isActive ? AMBER : DISCOVER_FACT,
                }}
              >
                {o.label}
              </span>
              <span
                className="tabular-nums"
                style={{ fontSize: 12, fontWeight: 700, color: DISCOVER_QUIET }}
              >
                {o.count}
              </span>
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}

export default BoardPicker;
