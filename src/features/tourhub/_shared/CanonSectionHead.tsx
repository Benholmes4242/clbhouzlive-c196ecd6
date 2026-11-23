/**
 * The one canonical Tour section-head primitive (briefs 15 and 16): eyebrow
 * with an optional live dot, a wrapping h2 title, and an optional action on
 * the title's last line. OverviewSectionHead (overview sections) and
 * HeroSectionHead (hero band) both render through this, so the two heads
 * cannot drift; each passes only its own margins, dot and data attributes.
 */
import type { CSSProperties, ReactNode } from 'react';
import { FONT, INK, INK_MUTE } from './tokens';
import { SECTION_EYEBROW, SECTION_TITLE, SECTION_TITLE_GAP } from '@/lib/tokens/type';

type Attrs = Record<string, string | boolean | undefined>;

export interface CanonSectionHeadProps {
  eyebrow: string;
  title: string;
  live?: boolean;
  action?: string;
  onAction?: () => void;
  liveDot: ReactNode;
  wrapperStyle?: CSSProperties;
  eyebrowTextStyle?: CSSProperties;
  attrs: { head: Attrs; eyebrow?: Attrs; title: Attrs; action?: Attrs };
}

export function CanonSectionHead({ eyebrow, title, live, action, onAction, liveDot, wrapperStyle, eyebrowTextStyle, attrs }: CanonSectionHeadProps) {
  return (
    <div {...attrs.head} style={{ fontFamily: FONT, ...wrapperStyle }}>
      <div {...attrs.eyebrow} style={{ ...SECTION_EYEBROW, color: INK, display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={eyebrowTextStyle}>{eyebrow}</span>
        {live ? liveDot : null}
      </div>
      <div style={{ marginTop: SECTION_TITLE_GAP, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14 }}>
        <h2 {...attrs.title} style={{ margin: 0, minWidth: 0, ...SECTION_TITLE, color: INK }}>{title}</h2>
        {action && onAction ? (
          <button type="button" {...attrs.action} onClick={onAction} style={{ flex: 'none', padding: 0, border: 0, background: 'transparent', color: INK_MUTE, fontFamily: FONT, fontSize: 13.5, fontWeight: 600, lineHeight: 'normal', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {action} ›
          </button>
        ) : null}
      </div>
    </div>
  );
}
