import { useTranslation } from 'react-i18next';
import { A, FIGS, SANS } from './tokens';
import type { BoardFilters } from './boardFilters';
import { playDateAtLocalNoon } from './discoverWhen';
import { numberWord } from '@/lib/text/numbers';
import { groupCompetitionCards, useCompetitionBoards, type CompetitionCard } from './hooks/useCompetitionBoards';

/** CB1: sits directly below Standout rounds. Reads the page's scope (never a
 * copy), fixed 30-day window. No drill-in: the filter model cannot reach a
 * course on one day, so any link would show a different ranking. Absent while
 * unsettled and when empty — an empty month is normal, not a failure. */
const NET_W = 46;
const GROSS_W = 44;

function Card({ card }: { card: CompetitionCard }) {
  const { t, i18n } = useTranslation('courses');
  const d = playDateAtLocalNoon(card.comp_date);
  const date = d ? `${d.getDate()} ${d.toLocaleDateString(i18n?.language, { month: 'short' })}` : '';
  const rest = card.members - card.rows.length;
  return (
    <div data-competition-card style={{ border: `1px solid ${A.HAIRLINE}`, borderRadius: 14, padding: '12px 13px' }}>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: A.INK, lineHeight: 1.25 }}>{card.course_name}</div>
      <div style={{ marginTop: 3, fontSize: 10.5, fontWeight: 600, color: A.DIM }}>
        {t('amateur.competitions.subtitle', { count: card.members, date, defaultValue: 'Competition · {{date}} · {{count}} players' })}
      </div>
      <div style={{ display: 'flex', marginTop: 10, fontSize: 8, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: A.FAINT }}>
        <span style={{ flex: 1 }} />
        <span style={{ width: NET_W, textAlign: 'center' }}>{t('discover.filterBoard.col.net', { defaultValue: 'Net' })}</span>
        <span style={{ width: GROSS_W, textAlign: 'center' }}>{t('discover.filterBoard.col.gross', { defaultValue: 'Gross' })}</span>
      </div>
      {card.rows.map((r) => (
        <div key={`${r.pos}:${r.whs_score_id ?? r.user_id}`} data-competition-row style={{ display: 'flex', alignItems: 'center', marginTop: 7 }}>
          {/* A TIE STATES ITSELF: T4, never a silent second 4 (BoardRows.tsx). */}
          <span style={{ width: 26, fontSize: 10, fontWeight: 800, color: A.FAINT }}>{r.is_tie ? `T${r.pos}` : r.pos}</span>
          <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 600, color: A.BODY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.display_name ?? t('discover.aMember')}</span>
          <span className="tabular-nums" style={{ width: NET_W, textAlign: 'center', fontSize: 13, fontWeight: 700, color: A.INK }}>{r.net_score ?? '\u2014'}</span>
          <span className="tabular-nums" style={{ width: GROSS_W, textAlign: 'center', fontSize: 11.5, fontWeight: 700, color: A.FAINT }}>{r.gross_score ?? '\u2014'}</span>
        </div>
      ))}
      {card.members > 3 && rest > 0 ? (
        <div data-competition-rest style={{ marginTop: 10, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: A.FAINT }}>
          {t('amateur.competitions.morePlayed', { n: numberWord(rest), defaultValue: '{{n}} more played' })}
        </div>
      ) : null}
    </div>
  );
}

export function CompetitionBoards({ viewerId, scope, enabled }: { viewerId: string | undefined; scope: BoardFilters['scope']; enabled: boolean }) {
  const { t } = useTranslation('courses');
  const query = useCompetitionBoards(viewerId, scope, enabled);
  if (!enabled || !query.isSuccess || !query.data?.length) return null;
  const cards = groupCompetitionCards(query.data);
  return (
    <section data-competitions-section style={{ fontFamily: SANS, ...FIGS, paddingInline: 16, marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', fontSize: 9, fontWeight: 700, letterSpacing: '0.19em', textTransform: 'uppercase', color: A.DIM, lineHeight: 'normal' }}>
        <span>{t('amateur.competitions.title', { defaultValue: 'Competitions' })}</span>
        <span style={{ marginLeft: 'auto', color: A.FAINT }}>{t('amateur.competitions.window', { defaultValue: 'Last 30 days' })}</span>
      </div>
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 9 }}>
        {cards.map((c) => <Card key={c.key} card={c} />)}
      </div>
    </section>
  );
}
