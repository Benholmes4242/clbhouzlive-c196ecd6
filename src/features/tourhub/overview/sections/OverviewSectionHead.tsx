/**
 * Brief 15: the canonical overview section head — eyebrow (section name, with
 * an optional live dot) over a 21px title stating what the section found. The
 * action sits on the title's last line and never shrinks; the title wraps.
 */
import { FONT, INK, INK_MUTE, LIVE_DOT } from '../../_shared/tokens';
import { SECTION_EYEBROW, SECTION_TITLE, SECTION_TITLE_GAP } from '@/lib/tokens/type';

interface OverviewSectionHeadProps {
  eyebrow: string;
  title: string;
  live?: boolean;
  action?: string;
  onAction?: () => void;
}

export function OverviewSectionHead({ eyebrow, title, live, action, onAction }: OverviewSectionHeadProps) {
  return (
    <div data-overview-head style={{ margin: '0 24px 10px', fontFamily: FONT }}>
      <div data-overview-eyebrow style={{ ...SECTION_EYEBROW, color: INK, display: 'flex', alignItems: 'center', gap: 7 }}>
        <span>{eyebrow}</span>
        {live ? <span data-overview-live-dot aria-hidden style={{ color: LIVE_DOT }}>●</span> : null}
      </div>
      <div style={{ marginTop: SECTION_TITLE_GAP, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14 }}>
        <h2 data-overview-title style={{ margin: 0, minWidth: 0, ...SECTION_TITLE, color: INK }}>{title}</h2>
        {action && onAction ? (
          <button type="button" data-overview-action onClick={onAction} style={{ flex: 'none', padding: 0, border: 0, background: 'transparent', color: INK_MUTE, fontFamily: FONT, fontSize: 13.5, fontWeight: 600, lineHeight: 'normal', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {action} ›
          </button>
        ) : null}
      </div>
    </div>
  );
}
