import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { A, COMPETITION_SELF_TINT, FIGS, SANS } from './tokens';
import type { BoardFilters } from './boardFilters';
import { playDateAtLocalNoon } from './discoverWhen';
import { MemberAvatar } from './MemberAvatar';
import { numberWord } from '@/lib/text/numbers';
import { groupCompetitionCards, useCompetitionBoards, type CompetitionBoardRow, type CompetitionCard } from './hooks/useCompetitionBoards';

/** CB2 (supersedes CB1): sits directly below Standout rounds. Reads the page's
 * scope (never a copy), fixed 30-day window. Card and field sheet render the
 * SAME rows from one RPC result — no second query. Absent while unsettled and
 * when empty: an empty month is normal, not a failure. */
const PODIUM = 3;

function useSubtitle(card: CompetitionCard) {
  const { t, i18n } = useTranslation('courses');
  const d = playDateAtLocalNoon(card.comp_date);
  const date = d ? `${d.getDate()} ${d.toLocaleDateString(i18n?.language, { month: 'short' })}` : '';
  return t('amateur.competitions.subtitle', { count: card.members, date, defaultValue: 'Competition · {{date}} · {{count}} players' });
}

/** A TIE STATES ITSELF: T4, never a silent second 4 (BoardRows.tsx). */
const posText = (r: CompetitionBoardRow) => (r.is_tie ? `T${r.pos}` : String(r.pos));

function Heads({ netW, grossW, style }: { netW: number; grossW: number; style: React.CSSProperties }) {
  const { t } = useTranslation('courses');
  return (
    <div style={{ display: 'flex', alignItems: 'center', fontSize: 8, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: A.FAINT, ...style }}>
      <span style={{ flex: 1 }} />
      <span style={{ width: netW, textAlign: 'center' }}>{t('discover.filterBoard.col.net', { defaultValue: 'Net' })}</span>
      <span style={{ width: grossW, textAlign: 'center' }}>{t('discover.filterBoard.col.gross', { defaultValue: 'Gross' })}</span>
    </div>
  );
}

function Card({ card, onOpen }: { card: CompetitionCard; onOpen: () => void }) {
  const { t } = useTranslation('courses');
  const subtitle = useSubtitle(card);
  const rest = card.members - PODIUM;
  return (
    <div data-competition-card role="button" tabIndex={0} onClick={onOpen}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } }}
      style={{ border: `1px solid ${A.HAIRLINE}`, borderRadius: 14, padding: '12px 13px', cursor: 'pointer', textAlign: 'left' }}>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: A.INK, lineHeight: 1.25 }}>{card.course_name}</div>
      <div style={{ marginTop: 3, fontSize: 10.5, fontWeight: 600, color: A.DIM }}>{subtitle}</div>
      <Heads netW={46} grossW={44} style={{ marginTop: 10 }} />
      {card.rows.slice(0, PODIUM).map((r) => (
        <div key={`${r.pos}:${r.whs_score_id ?? r.user_id}`} data-competition-row style={{ display: 'flex', alignItems: 'center', marginTop: 7 }}>
          <span style={{ width: 26, fontSize: 10, fontWeight: 800, color: A.FAINT }}>{posText(r)}</span>
          <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 600, color: A.BODY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.display_name ?? t('discover.aMember')}</span>
          <span className="tabular-nums" style={{ width: 46, textAlign: 'center', fontSize: 13, fontWeight: 700, color: A.INK }}>{r.net_score ?? '\u2014'}</span>
          <span className="tabular-nums" style={{ width: 44, textAlign: 'center', fontSize: 11.5, fontWeight: 700, color: A.FAINT }}>{r.gross_score ?? '\u2014'}</span>
        </div>
      ))}
      {rest > 0 ? (
        <button type="button" data-competition-rest onClick={(e) => { e.stopPropagation(); onOpen(); }}
          style={{ display: 'block', marginTop: 10, padding: 0, background: 'transparent', border: 'none', fontFamily: SANS, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: A.FAINT, cursor: 'pointer', lineHeight: 'normal', textAlign: 'left' }}>
          {t('amateur.competitions.morePlayed', { n: numberWord(rest), defaultValue: '{{n}} more played' })}
        </button>
      ) : null}
    </div>
  );
}

function FieldSheet({ card, viewerId, onClose }: { card: CompetitionCard | null; viewerId: string | undefined; onClose: () => void }) {
  const { t } = useTranslation('courses');
  return (
    <BottomSheet open={!!card} onClose={onClose} maxHeight="85dvh" ariaLabelledBy="competition-field-title">
      {card ? <FieldBody card={card} viewerId={viewerId} t={t} /> : null}
    </BottomSheet>
  );
}

function FieldBody({ card, viewerId, t }: { card: CompetitionCard; viewerId: string | undefined; t: (k: string, o?: Record<string, unknown>) => string }) {
  const subtitle = useSubtitle(card);
  return (
    <div data-competition-field style={{ fontFamily: SANS, ...FIGS, lineHeight: 'normal' }}>
      <div style={{ padding: '14px 18px 0' }}>
        <h2 id="competition-field-title" style={{ margin: 0, fontSize: 16, fontWeight: 700, color: A.INK, lineHeight: 1.25 }}>{card.course_name}</h2>
        <div style={{ marginTop: 4, fontSize: 11.5, fontWeight: 600, color: A.DIM }}>{subtitle}</div>
      </div>
      <Heads netW={48} grossW={46} style={{ margin: '14px 18px 0', paddingBottom: 7, borderBottom: `1px solid ${A.SOFT}` }} />
      {card.rows.map((r) => {
        const self = !!viewerId && r.user_id === viewerId;
        return (
          <div key={`${r.pos}:${r.whs_score_id ?? r.user_id}`} data-competition-field-row data-self={self || undefined}
            style={{ display: 'flex', alignItems: 'center', padding: '9px 18px', borderBottom: `1px solid ${A.SOFT}`, background: self ? COMPETITION_SELF_TINT : 'transparent' }}>
            <span style={{ width: 30, fontSize: 10.5, fontWeight: 800, color: A.FAINT }}>{posText(r)}</span>
            <span style={{ display: 'flex', flex: 'none', marginRight: 10 }}><MemberAvatar userId={r.user_id} name={r.display_name} photoUrl={null} size={28} /></span>
            <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: self ? 700 : 600, color: self ? A.INK : A.BODY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.display_name ?? t('discover.aMember')}</span>
            <span className="tabular-nums" style={{ width: 48, textAlign: 'center', fontSize: 14, fontWeight: 700, color: A.INK }}>{r.net_score ?? '\u2014'}</span>
            <span className="tabular-nums" style={{ width: 46, textAlign: 'center', fontSize: 12, fontWeight: 700, color: A.FAINT }}>{r.gross_score ?? '\u2014'}</span>
          </div>
        );
      })}
    </div>
  );
}

export function CompetitionBoards({ viewerId, scope, enabled }: { viewerId: string | undefined; scope: BoardFilters['scope']; enabled: boolean }) {
  const { t } = useTranslation('courses');
  const query = useCompetitionBoards(viewerId, scope, enabled);
  const [openKey, setOpenKey] = useState<string | null>(null);
  if (!enabled || !query.isSuccess || !query.data?.length) return null;
  const cards = groupCompetitionCards(query.data);
  const open = cards.find((c) => c.key === openKey) ?? null;
  return (
    <section data-competitions-section style={{ fontFamily: SANS, ...FIGS, lineHeight: 'normal', paddingInline: 16, marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', fontSize: 9, fontWeight: 700, letterSpacing: '0.19em', textTransform: 'uppercase', color: A.DIM, lineHeight: 'normal' }}>
        <span>{t('amateur.competitions.title', { defaultValue: 'Competitions' })}</span>
        <span style={{ marginLeft: 'auto', color: A.FAINT }}>{t('amateur.competitions.window', { defaultValue: 'Last 30 days' })}</span>
      </div>
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 9 }}>
        {cards.map((c) => <Card key={c.key} card={c} onOpen={() => setOpenKey(c.key)} />)}
      </div>
      <FieldSheet card={open} viewerId={viewerId} onClose={() => setOpenKey(null)} />
    </section>
  );
}
