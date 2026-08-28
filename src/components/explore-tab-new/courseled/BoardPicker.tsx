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
import { Trophy } from 'lucide-react';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { SheetHeader } from '@/components/ui/SheetHeader';

import {
  AMBER_TINT_04,
  FONT,
  INK,
  INK_ALPHA_45,
  INK_TINT_07,
} from '@/features/tourhub/_shared/tokens';

/* PARITY WITH THE TOUR PICKER: this sheet borrows the Tour Hub picker's row
   construction wholesale — 28px logo tile, 13/700 caps title, 12/500 subtitle,
   right-hand 10/700 status marker, 12x16 padding, 0.5px hairline, amber tint on
   the active row — so the two pickers read as one control in two places. */
const SUBTITLE_COLOR = '#8A9099';

export interface BoardCategoryOption<K extends string> {
  key: K;
  /** Long form — the hero title and the sheet row. */
  label: string;
  /** Short form — retained for callers; unused now the island slot is gone. */
  short: string;
  /** Second line, the tour picker's tournament-name slot. */
  subtitle?: string;
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
          const empty = o.count === 0;
          return (
            <button
              key={o.key}
              type="button"
              aria-pressed={isActive}
              disabled={empty}
              onClick={() => {
                onSelect(o.key);
                onClose();
              }}
              style={{
                /* A board with no qualifiers is DIMMED, never hidden — a picker
                   whose contents change week to week reads as broken. */
                opacity: empty ? 0.35 : 1,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                background: isActive ? AMBER_TINT_04 : 'transparent',
                border: 'none',
                borderBottom: `0.5px solid ${INK_TINT_07}`,
                cursor: empty ? 'default' : 'pointer',
                textAlign: 'left',
                fontFamily: FONT,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 6,
                  background: INK_TINT_07,
                }}
              >
                <Trophy size={15} strokeWidth={2.2} color={INK} aria-hidden />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: INK,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  {o.label}
                </div>
                {o.subtitle ? (
                  <div
                    style={{
                      marginTop: 2,
                      fontSize: 12,
                      fontWeight: 500,
                      color: SUBTITLE_COLOR,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {o.subtitle}
                  </div>
                ) : null}
              </div>
              <span
                className="tabular-nums"
                style={{
                  flexShrink: 0,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.16em',
                  color: INK_ALPHA_45,
                }}
              >
                {o.count}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
    </BottomSheet>
  );
}

export default BoardPicker;
