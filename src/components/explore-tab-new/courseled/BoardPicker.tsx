/**
 * BoardPicker — the Discover board's CATEGORY control, rendered inside the
 * ChromeIsland's LEFT capsule via useSetChromeLeftSlot, plus the bottom sheet
 * it opens. Construction mirrors TourIslandLeft + TourPickerSheet: the capsule
 * (glass, 44px, radius 999) is supplied by ChromeIsland's LeftCapsule; this
 * component owns only the row content.
 *
 * BRIEF_DISCOVER_THE_BOARD §2.5 — THE RECORDED OBJECTION, so it is not
 * rediscovered: Claude argued against this placement and Ben overruled it
 * deliberately. The objection was (a) the island already carries the TOUR
 * picker on tour pages, so the same capsule means two different things on two
 * tabs, and (b) the category ends up visible only in a small capsule at the top
 * of the screen rather than beside the board it governs. Ben's version is what
 * ships.
 *
 * §2.3 — THE LABEL FOLLOWS THE BOARD. `category` is passed in as the category
 * the board is ACTUALLY rendering (after any fallback), never as a raw
 * selection. Same fault BRIEF_TOUR_LABEL_FOLLOWS_THE_LIST exists for.
 *
 * §2.4 — SCOPED TO THIS TAB: useSetChromeLeftSlot clears on unmount, and this
 * bridge mounts inside the board, which only renders on the Discover/Explore
 * course-led surface.
 */
import React, { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { SheetHeader } from '@/components/ui/SheetHeader';
import { useSetChromeLeftSlot } from '@/features/chrome-v2/leftOverride';

import { A, DISCOVER_FACT, DISCOVER_QUIET, SANS } from './tokens';

/** Same mark ChromeIsland's default logo cell paints. Amber on every tone. */
const LOGO_SRC = '/lovable-uploads/29e83040-b5c5-48e4-84d7-3f99640e4a80.png';

/* /explore resolves tone 'light' in registry.ts (a known separate fault on a
   dark-only app — REPORTED, not fixed here), so the capsule ink is the light
   tone's ink, exactly as ChromeIsland's inkFor(tone) would give it. */
const CAPSULE_INK = '#FFFFFF';
const CAPSULE_DIVIDER = 'rgba(255,255,255,0.18)';
const CAPSULE_CHEVRON = 'rgba(255,255,255,0.62)';

const AMBER = '#F7931E';
const AMBER_WASH = 'rgba(247,147,30,0.10)';

export interface BoardCategoryOption<K extends string> {
  key: K;
  /** Long form — the hero title and the sheet row. */
  label: string;
  /** Short form — the island capsule. */
  short: string;
  /** How many ranked members this board holds right now. 0 dims the row. */
  count: number;
}

interface Props<K extends string> {
  /** The category the board is RENDERING (§2.3), not the stored selection. */
  category: K;
  options: ReadonlyArray<BoardCategoryOption<K>>;
  onSelect: (k: K) => void;
  sheetEyebrow: string;
  sheetTitle: string;
  ariaLabel: string;
}

export function BoardPicker<K extends string>({
  category,
  options,
  onSelect,
  sheetEyebrow,
  sheetTitle,
  ariaLabel,
}: Props<K>) {
  const [open, setOpen] = useState(false);
  const active = options.find((o) => o.key === category);
  const short = active?.short ?? '';

  const slot = useMemo(
    () => (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, height: '100%' }}>
        <img
          src={LOGO_SRC}
          alt="clbhouz"
          style={{ height: 22, width: 22, objectFit: 'contain', flexShrink: 0 }}
        />
        <span
          aria-hidden
          style={{ width: 1, height: 18, background: CAPSULE_DIVIDER, flexShrink: 0 }}
        />
        <button
          type="button"
          aria-label={ariaLabel}
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
          className="active:scale-[0.96]"
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontFamily: SANS,
          }}
        >
          <span
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              letterSpacing: '0.02em',
              color: CAPSULE_INK,
              whiteSpace: 'nowrap',
            }}
          >
            {short}
          </span>
          <ChevronDown size={10} color={CAPSULE_CHEVRON} strokeWidth={2.4} aria-hidden />
        </button>
      </div>
    ),
    [short, ariaLabel],
  );
  useSetChromeLeftSlot(slot);

  return (
    <BottomSheet open={open} onClose={() => setOpen(false)} ariaLabelledBy="board-category-title">
      <SheetHeader
        eyebrow={sheetEyebrow}
        title={<span id="board-category-title">{sheetTitle}</span>}
        onClose={() => setOpen(false)}
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
                setOpen(false);
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
