import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { COMPETITION } from './tokens';

/** CB8 — the one competition mark for row surfaces (board rows, Standout rounds).
 * CB6.1 stands: a category, so a bare coloured mark, never a pill. Every paint is
 * currentColor so the glyph cannot fork from the token. Uses the short register
 * key (`competitionShort`); CompetitionBoards' sentence keeps `competitionChip`.
 * Only call-site spacing and data handles pass through — never restyle the mark. */
type MarkProps = { style?: Pick<CSSProperties, 'marginLeft'> } & { [k: `data-${string}`]: boolean | string | undefined };

export function CompetitionMark({ style, ...data }: MarkProps) {
  const { t } = useTranslation('courses');
  return (
    <span {...data} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0, whiteSpace: 'nowrap', color: COMPETITION, ...style }}>
      <svg width="9" height="10" viewBox="0 0 10 11" aria-hidden="true" focusable="false" style={{ display: 'block', flex: 'none' }}><path d="M3 2H1.4v1.1a2 2 0 0 0 2 2M7 2h1.6v1.1a2 2 0 0 1-2 2" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" /><path d="M3 1h4v2.6a2 2 0 0 1-4 0V1Z" fill="currentColor" /><rect x="4.35" y="5.4" width="1.3" height="2" fill="currentColor" /><rect x="2.7" y="7.4" width="4.6" height="1.3" rx="0.5" fill="currentColor" /></svg>
      <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', lineHeight: 1 }}>{t('discover.filterBoard.competitionShort', { defaultValue: 'Comp' })}</span>
    </span>
  );
}
