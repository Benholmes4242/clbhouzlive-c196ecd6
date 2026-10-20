import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Section, Rail, SeeAll } from '@/features/explore-magazine/Section';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { A, COMPETITION, SELF_ROW_TINT, FIGS, SANS } from './tokens';
import type { BoardFilters } from './boardFilters';
import { playDateAtLocalNoon } from './discoverWhen';
import { MemberAvatar } from './MemberAvatar';
import { groupCompetitionCards, useCompetitionBoards, type CompetitionBoardRow, type CompetitionCard } from './hooks/useCompetitionBoards';

/** CB3 (supersedes CB2): sits directly below Standout rounds. Reads the page's
 * scope (never a copy), fixed 30-day window. Card and field sheet render the
 * SAME rows from one RPC result — no second query. Absent while unsettled and
 * when empty: an empty month is normal, not a failure.
 * CB3: the cards ride the page's shared Rail; the subtitle's first word is the
 * teal COMPETITION pill the standout rows carry; the field line is gone — the
 * page's uncounted SeeAll (flush to the card's foot via marginTop auto) opens
 * the same full-field sheet the whole card opens. */
const PODIUM = 3;

/** The sheet's subtitle — unchanged by CB3, which re-worded the card only. */
function useSubtitle(card: CompetitionCard) {
  const { t, i18n } = useTranslation('courses');
  const d = playDateAtLocalNoon(card.comp_date);
  const date = d ? `${d.getDate()} ${d.toLocaleDateString(i18n?.language, { month: 'short' })}` : '';
  return t('amateur.competitions.subtitle', { count: card.members, date, defaultValue: 'Competition · {{date}} · {{count}} players' });
}

/** The card's subtitle: the pill says "Competition", so the words after it
 * carry only the date and the field size, on one nowrap line. */
function useCardSubtitle(card: CompetitionCard) {
  const { t, i18n } = useTranslation('courses');
  const d = playDateAtLocalNoon(card.comp_date);
  const date = d ? `${d.getDate()} ${d.toLocaleDateString(i18n?.language, { month: 'short' })}` : '';
  return t('amateur.competitions.subtitleRest', { count: card.members, date, defaultValue: '{{date}} · {{count}} players' });
}

/** A TIE STATES ITSELF: T4, never a silent second 4 (BoardRows.tsx). */
const posText = (r: CompetitionBoardRow) => (r.is_tie ? `T${r.pos}` : String(r.pos));

function Heads({ netW, grossW, style }: { netW: number; grossW: number; style: React.CSSProperties }) {
  const { t } = useTranslation('courses');
  return (
    <div style={{ display: 'flex', alignItems: 'center', lineHeight: 1.25, fontSize: 8, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: A.FAINT, ...style }}>
      <span style={{ flex: 1 }} />
      <span style={{ width: netW, textAlign: 'center' }}>{t('discover.filterBoard.col.net', { defaultValue: 'Net' })}</span>
      <span style={{ width: grossW, textAlign: 'center' }}>{t('discover.filterBoard.col.gross', { defaultValue: 'Gross' })}</span>
    </div>
  );
}

function Card({ card, onOpen }: { card: CompetitionCard; onOpen: () => void }) {
  const { t } = useTranslation('courses');
  const subtitle = useCardSubtitle(card);
  return (
    <div data-competition-card role="button" tabIndex={0} onClick={onOpen}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } }}
      style={{ width: 244, flex: 'none', boxSizing: 'border-box', scrollSnapAlign: 'start', display: 'flex', flexDirection: 'column', border: `1px solid ${A.HAIRLINE}`, borderRadius: 14, padding: '12px 13px', cursor: 'pointer', textAlign: 'left' }}>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: A.INK, lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{card.course_name}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, lineHeight: 1.25, marginTop: 3, fontSize: 10.5, fontWeight: 600, color: A.DIM }}>
        <span data-competition-pill style={{ fontSize: 7.5, lineHeight: 1, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', borderRadius: 999, padding: '3px 6px', flexShrink: 0, whiteSpace: 'nowrap', color: COMPETITION, border: `1px solid color-mix(in srgb, ${COMPETITION} 38%, transparent)`, background: `color-mix(in srgb, ${COMPETITION} 13%, transparent)` }}>{t('discover.filterBoard.competitionChip', { defaultValue: 'Competition' })}</span>
        <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subtitle}</span>
      </div>
      <Heads netW={46} grossW={44} style={{ marginTop: 10 }} />
      {card.rows.slice(0, PODIUM).map((r) => (
        <div key={`${r.pos}:${r.whs_score_id ?? r.user_id}`} data-competition-row style={{ display: 'flex', alignItems: 'center', marginTop: 7 }}>
          <span style={{ lineHeight: 1.25, width: 26, fontSize: 10, fontWeight: 800, color: A.FAINT }}>{posText(r)}</span>
          <span style={{ lineHeight: 1.25, flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 600, color: A.BODY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.display_name ?? t('discover.aMember')}</span>
          <span className="tabular-nums" style={{ lineHeight: 1.25, width: 46, textAlign: 'center', fontSize: 13, fontWeight: 700, color: A.INK }}>{r.net_score ?? '—'}</span>
          <span className="tabular-nums" style={{ lineHeight: 1.25, width: 44, textAlign: 'center', fontSize: 11.5, fontWeight: 700, color: A.FAINT }}>{r.gross_score ?? '—'}</span>
        </div>
      ))}
      <div style={{ marginTop: 'auto' }}>
        <SeeAll label={t('amateur.competitions.seeAllPlayers', { defaultValue: 'See all players' })} onPress={onOpen} />
      </div>
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
    <div data-competition-field style={{ fontFamily: SANS, ...FIGS }}>
      <div style={{ padding: '14px 18px 0' }}>
        <h2 id="competition-field-title" style={{ margin: 0, fontSize: 16, fontWeight: 700, color: A.INK, lineHeight: 1.25 }}>{card.course_name}</h2>
        <div style={{ marginTop: 4, fontSize: 11.5, fontWeight: 600, color: A.DIM, lineHeight: 1.25 }}>{subtitle}</div>
      </div>
      <Heads netW={48} grossW={46} style={{ margin: '14px 18px 0', paddingBottom: 7, borderBottom: `1px solid ${A.SOFT}` }} />
      {card.rows.map((r) => {
        const self = !!viewerId && r.user_id === viewerId;
        return (
          <div key={`${r.pos}:${r.whs_score_id ?? r.user_id}`} data-competition-field-row data-self={self || undefined}
            style={{ display: 'flex', alignItems: 'center', padding: '9px 18px', borderBottom: `1px solid ${A.SOFT}`, background: self ? SELF_ROW_TINT : 'transparent' }}>
            <span style={{ lineHeight: 1.25, width: 30, fontSize: 10.5, fontWeight: 800, color: A.FAINT }}>{posText(r)}</span>
            <span style={{ display: 'flex', flex: 'none', height: 28, alignItems: 'center', marginRight: 10 }}><MemberAvatar userId={r.user_id} name={r.display_name} photoUrl={null} size={28} /></span>
            <span style={{ lineHeight: 1.25, flex: 1, minWidth: 0, fontSize: 13, fontWeight: self ? 700 : 600, color: self ? A.INK : A.BODY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.display_name ?? t('discover.aMember')}</span>
            <span className="tabular-nums" style={{ lineHeight: 1.25, width: 48, textAlign: 'center', fontSize: 14, fontWeight: 700, color: A.INK }}>{r.net_score ?? '—'}</span>
            <span className="tabular-nums" style={{ lineHeight: 1.25, width: 46, textAlign: 'center', fontSize: 12, fontWeight: 700, color: A.FAINT }}>{r.gross_score ?? '—'}</span>
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
    <div data-competitions-section style={{ ...FIGS }}>
    <Section
      contest
      eyebrow={t('amateur.competitions.eyebrow', { defaultValue: 'The contest' })}
      title={t('amateur.competitions.title', { defaultValue: 'Competitions' })}
      meta={t('amateur.competitions.window', { defaultValue: 'Last 30 days' })}
    >
      <Rail>
        {cards.map((c) => <Card key={c.key} card={c} onOpen={() => setOpenKey(c.key)} />)}
      </Rail>
      <FieldSheet card={open} viewerId={viewerId} onClose={() => setOpenKey(null)} />
    </Section>
    </div>
  );
}
