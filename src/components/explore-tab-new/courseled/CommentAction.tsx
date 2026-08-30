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
  /** Reserve the count column so glyphs line up down a column. */
  reserveCount?: boolean;
}

export function CommentAction({
  count,
  onOpen,
  label,
  tone = 'ink',
  hidden = false,
  size = 15,
  reserveCount = false,
}: Props) {
  if (hidden) return null;

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
        gap: 4,
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
            fontSize: 11.5,
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
