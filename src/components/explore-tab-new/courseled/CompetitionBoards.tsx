import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Section, Rail, SeeAll } from '@/features/explore-magazine/Section';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { A, COMPETITION, SELF_ROW_TINT, FIGS, SANS } from './tokens';
import type { BoardFilters } from './boardFilters';
import { playDateAtLocalNoon } from './discoverWhen';
import { MemberAvatar } from './MemberAvatar';
import { ScoreWithToPar } from './ScoreWithToPar';
import { CompetitionTrophy } from './CompetitionMark';
import type { RoundPressTarget } from './StandoutRounds';
import { groupCompetitionCards, useCompetitionBoards, type CompetitionBoardRow, type CompetitionCard } from './hooks/useCompetitionBoards';

/** CB3 (supersedes CB2): sits directly below Standout rounds. Reads the page's
 * scope (never a copy), fixed 30-day window. Card and field sheet render the
 * SAME rows from one RPC result — no second query. Absent while unsettled and
 * when empty: an empty month is normal, not a failure.
 * CB3: the cards ride the page's shared Rail; the field line is gone — the
 * page's uncounted SeeAll (flush to the card's foot via marginTop auto) opens
 * the same full-field sheet the whole card opens.
 * CB6: the competition mark is a bare coloured word, never a pill (the rule is
 * recorded in BoardRows.tsx). The rail cards carry no mark at all — every card
 * under a "Competitions" heading is one, so the label would distinguish
 * nothing; only the sheet's subtitle keeps the word, in the token colour.
 * CB4: a row tap — podium or field — opens that player's scorecard for the
 * round through the page's one opener; the sheet now opens only from the CTA
 * and the card's title/subtitle. Net and gross carry their to-par exactly as
 * the standout rows render it, and the sheet's subtitle takes the same pill.
 * CB16: counts and positions describe members, not the complete competition
 * field. Only the sheet carries the scope explanation; the CTA reuses the
 * shared member-list label to avoid duplicate copy keys. */
const PODIUM = 3;

/** The subtitle's metadata, on card and sheet alike: the date and the field
 * size, on one nowrap line. */
function useSubtitleRest(card: CompetitionCard) {
  const { t, i18n } = useTranslation('courses');
  const d = playDateAtLocalNoon(card.comp_date);
  const date = d ? `${d.getDate()} ${d.toLocaleDateString(i18n?.language, { month: 'short' })}` : '';
  return t('amateur.competitions.subtitleRest', { count: card.members, date, defaultValue: '{{date}} · {{count}} members' });
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

function Card({ card, onOpen, onRowPress }: { card: CompetitionCard; onOpen: () => void; onRowPress: (row: RoundPressTarget) => void }) {
  const { t } = useTranslation('courses');
  const subtitle = useSubtitleRest(card);
  return (
    <div data-competition-card
      style={{ width: 276, flex: 'none', boxSizing: 'border-box', scrollSnapAlign: 'start', display: 'flex', flexDirection: 'column', border: `1px solid ${A.HAIRLINE}`, borderRadius: 14, padding: '12px 13px', textAlign: 'left' }}>
      {/* CB4.7 — the sheet opens from the title/subtitle and the CTA only;
          a podium row opens that player's scorecard instead. */}
      <button type="button" data-competition-open onClick={onOpen}
        style={{ display: 'block', width: '100%', padding: 0, border: 'none', background: 'transparent', fontFamily: SANS, textAlign: 'left', cursor: 'pointer' }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: A.INK, lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{card.course_name}</div>
        <div style={{ lineHeight: 1.25, marginTop: 3, fontSize: 10.5, fontWeight: 600, color: A.DIM, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subtitle}</div>
      </button>
      <Heads netW={44} grossW={44} style={{ marginTop: 10 }} />
      {card.rows.slice(0, PODIUM).map((r) => (
        <button key={`${r.pos}:${r.whs_score_id ?? r.user_id}`} type="button" data-competition-row onClick={() => onRowPress(r)}
          style={{ display: 'flex', alignItems: 'center', marginTop: 7, width: '100%', padding: 0, border: 'none', background: 'transparent', fontFamily: SANS, textAlign: 'left', cursor: 'pointer' }}>
          <span style={{ lineHeight: 1.25, width: 22, flex: 'none', fontSize: 10, fontWeight: 800, color: A.FAINT }}>{posText(r)}</span>
          <span style={{ lineHeight: 1.25, flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 600, color: A.BODY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.display_name ?? t('discover.aMember')}</span>
          <span style={{ width: 44, flex: 'none', textAlign: 'center', fontSize: 13 }}><ScoreWithToPar score={r.net_score} par={r.course_par} kind="net" fontSize={13} /></span>
          <span style={{ width: 44, flex: 'none', textAlign: 'center' }}><ScoreWithToPar score={r.gross_score} par={r.course_par} kind="gross" fontSize={11.5} /></span>
        </button>
      ))}
      <div style={{ marginTop: 'auto' }}>
        <SeeAll label={t('amateur.leaderboards.seeAllMembers', { defaultValue: 'See all members' })} onPress={onOpen} size={9.5} />
      </div>
    </div>
  );
}

function FieldSheet({ card, viewerId, onClose, onRowPress }: { card: CompetitionCard | null; viewerId: string | undefined; onClose: () => void; onRowPress: (row: RoundPressTarget) => void }) {
  const { t } = useTranslation('courses');
  return (
    <BottomSheet open={!!card} onClose={onClose} maxHeight="85dvh" ariaLabelledBy="competition-field-title">
      {card ? <FieldBody card={card} viewerId={viewerId} onRowPress={onRowPress} t={t} /> : null}
    </BottomSheet>
  );
}

function FieldBody({ card, viewerId, onRowPress, t }: { card: CompetitionCard; viewerId: string | undefined; onRowPress: (row: RoundPressTarget) => void; t: (k: string, o?: Record<string, unknown>) => string }) {
  const subtitle = useSubtitleRest(card);
  return (
    <div data-competition-field style={{ fontFamily: SANS, ...FIGS }}>
      <div style={{ padding: '14px 18px 0' }}>
        <h2 id="competition-field-title" style={{ margin: 0, fontSize: 16, fontWeight: 700, color: A.INK, lineHeight: 1.25 }}>{card.course_name}</h2>
        <div style={{ marginTop: 4, fontSize: 11.5, fontWeight: 600, color: A.DIM, lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {/* CB10 — the sentence keeps the FULL word at the subtitle's own size;
              the trophy rides before it. inline-flex (never flex) so the line
              still ellipsises; verticalAlign middle lifts the glyph off the
              bottom-margin-edge baseline an inline-flex box would otherwise take. */}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, verticalAlign: 'middle', color: COMPETITION }}>
            <CompetitionTrophy width={11} height={12} />
            {t('discover.filterBoard.competitionChip', { defaultValue: 'Competition' })}
          </span>
          {' · '}{subtitle}
        </div>
        <div style={{ marginTop: 4, fontSize: 11.5, color: A.DIM, lineHeight: 1.45 }}>
          {t('amateur.competitions.fieldLimit', { defaultValue: "Members who played this competition. Golfers not on clbhouz aren't shown." })}
        </div>
      </div>
      <Heads netW={48} grossW={46} style={{ margin: '14px 18px 0', paddingBottom: 7, borderBottom: `1px solid ${A.SOFT}` }} />
      {card.rows.map((r) => {
        const self = !!viewerId && r.user_id === viewerId;
        return (
          <button key={`${r.pos}:${r.whs_score_id ?? r.user_id}`} type="button" data-competition-field-row data-self={self || undefined} onClick={() => onRowPress(r)}
            style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '9px 18px', border: 'none', borderBottom: `1px solid ${A.SOFT}`, background: self ? SELF_ROW_TINT : 'transparent', fontFamily: SANS, textAlign: 'left', cursor: 'pointer' }}>
            <span style={{ lineHeight: 1.25, width: 30, flex: 'none', fontSize: 10.5, fontWeight: 800, color: A.FAINT }}>{posText(r)}</span>
            <span style={{ display: 'flex', flex: 'none', height: 28, alignItems: 'center', marginRight: 10 }}><MemberAvatar userId={r.user_id} name={r.display_name} photoUrl={r.profile_photo_url} size={28} /></span>
            <span style={{ lineHeight: 1.25, flex: 1, minWidth: 0, fontSize: 13, fontWeight: self ? 700 : 600, color: self ? A.INK : A.BODY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.display_name ?? t('discover.aMember')}</span>
            <span style={{ width: 48, flex: 'none', textAlign: 'center' }}><ScoreWithToPar score={r.net_score} par={r.course_par} kind="net" fontSize={14} /></span>
            <span style={{ width: 46, flex: 'none', textAlign: 'center' }}><ScoreWithToPar score={r.gross_score} par={r.course_par} kind="gross" fontSize={12} /></span>
          </button>
        );
      })}
    </div>
  );
}

export function CompetitionBoards({ viewerId, scope, enabled, onRowPress }: { viewerId: string | undefined; scope: BoardFilters['scope']; enabled: boolean; onRowPress: (row: RoundPressTarget) => void }) {
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
      eyebrow={t('amateur.competitions.eyebrow', { defaultValue: 'Tournament golf' })}
      title={t('amateur.competitions.title', { defaultValue: 'Competitions' })}
      meta={t('amateur.competitions.window', { defaultValue: 'Last 30 days' })}
    >
      <Rail>
        {cards.map((c) => <Card key={c.key} card={c} onOpen={() => setOpenKey(c.key)} onRowPress={onRowPress} />)}
      </Rail>
      <FieldSheet card={open} viewerId={viewerId} onClose={() => setOpenKey(null)} onRowPress={onRowPress} />
    </Section>
    </div>
  );
}
