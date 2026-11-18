import React from 'react';
import { MessageCircle } from 'lucide-react';

import { A, FIGS, SANS } from './tokens';

/**
 * COMMENT ACTION (BRIEF_ROUND_COMMENTS_EVERYWHERE §S2, §S5).
 *
 * The sibling of ReactionAction: same 44px tap target cancelled by a negative
 * margin, same tabular count beside the glyph, same rule at zero — THE GLYPH
 * ALONE, never "0 comments" and never a prompt.
 *
 * `hidden` covers a round with no post, so the control is absent rather than
 * disabled.
 */

const WHITE_72 = 'rgba(255,255,255,0.72)';

interface Props {
  count: number;
  onOpen: () => void;
  label: string;
  tone?: 'ink' | 'glass';
  hidden?: boolean;
  size?: number;
  figureSize?: number;
  /** Reserve the count column so glyphs line up down a column. */
  reserveCount?: boolean;
  /** OPT-IN (ReviewBottomSheet footer only): laid-out 44px box, gap 6, 13.5px/600 count. */
  footerBox?: { color: string };
}

export function CommentAction({
  count,
  onOpen,
  label,
  tone = 'ink',
  hidden = false,
  size = 15,
  figureSize = 11.5,
  reserveCount = false,
  footerBox,
}: Props) {
  if (hidden) return null;
  if (footerBox) {
    return (
      <span
        role="button"
        tabIndex={0}
        aria-label={label}
        data-footer-action="comment"
        onClick={(ev: React.MouseEvent) => { ev.stopPropagation(); ev.preventDefault(); onOpen(); }}
        onKeyDown={(ev: React.KeyboardEvent) => {
          if (ev.key !== 'Enter' && ev.key !== ' ') return;
          ev.stopPropagation(); ev.preventDefault(); onOpen();
        }}
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none', boxSizing: 'border-box', height: 44, minWidth: 44, padding: '0 8px', gap: 6, color: footerBox.color, cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
      >
        <MessageCircle size={size} strokeWidth={1.9} color={footerBox.color} fill="none" aria-hidden />
        {count > 0 && <span className="tabular-nums" style={{ ...FIGS, fontSize: 13.5, fontWeight: 600, lineHeight: 1, color: footerBox.color }}>{count}</span>}
      </span>
    );
  }

  const glass = tone === 'glass';
  const color = glass ? WHITE_72 : A.MUTE;

  return (
    <span
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={(ev: React.MouseEvent) => {
        ev.stopPropagation();
        ev.preventDefault();
        onOpen();
      }}
      onKeyDown={(ev: React.KeyboardEvent) => {
        if (ev.key !== 'Enter' && ev.key !== ' ') return;
        ev.stopPropagation();
        ev.preventDefault();
        onOpen();
      }}
      style={{
        display: 'inline-flex',
         flexDirection: reserveCount ? 'row-reverse' : 'row',
        alignItems: 'center',
        gap: count > 0 ? 5 : 0,
        fontFamily: SANS,
        cursor: 'pointer',
        padding: '13px 8px',
        margin: '-13px -8px',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <MessageCircle size={size} strokeWidth={2} color={color} fill="none" aria-hidden />
      {(count > 0 || reserveCount) && (
        <span
          className="tabular-nums"
          style={{
            ...FIGS,
            fontSize: figureSize,
            fontWeight: 700,
            color,
            lineHeight: 1,
            ...(reserveCount ? { minWidth: 13, textAlign: 'left' as const } : null),
          }}
        >
          {count > 0 ? count : ''}
        </span>
      )}
    </span>
  );
}

export default CommentAction;
