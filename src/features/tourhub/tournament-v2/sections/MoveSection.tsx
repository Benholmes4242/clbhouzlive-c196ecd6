import { useTranslation } from 'react-i18next';
import type { EventState } from '../../components/overview-v3/useTournamentPulse';
import type { TournamentContest } from '../data/tournamentContest';
import { initialSurname } from '../../components/overview-v3/liveStateRules';
import { SectionEyebrow } from './SectionEyebrow';
import { fmtScore } from '../../utils/fmtScore';
import { getScoreColor } from '../../_shared/scoreColor';
import { FONT, INK, INK_FAINT, HAIRLINE_INK_8 } from '../../_shared/tokens';
import { resolveBoardEntity, teamNamesNeedInitials } from '../../_shared/boardEntity';
import { PAGE_CANVAS } from '@/lib/tokens/surfaces';

interface Props {
  contest: TournamentContest;
  state: EventState;
  tourCode: string;
  /** The round the figure belongs to. Names the label once the event
   * is over — there is no "today" after the last putt. Optional, so
   * a caller without it keeps today's wording. */
  currentRound?: number | null;
}

export function MoveSection({ contest, state, tourCode, currentRound }: Props) {
  const { t, i18n } = useTranslation('tourhub');
  const cjk = /^(ja|ko)/.test(i18n.language);
  const row = contest.mover;
  if (state === 'upcoming' || !row || contest.moverToday == null) return null;
  const name = resolveBoardEntity(row, teamNamesNeedInitials(contest.pack.map((item) => item.entry))).lines.join(' / ');
  const thru = row.thru != null && row.thru >= 18 ? 'F' : row.thru;
  const position = row.position == null ? '' : `${row.position_tied ? 'T' : ''}${row.position}`;
  const total = row.score == null ? '' : fmtScore(row.score);
  /* TODAY only while there is a today. Afterwards the figure is round
     N's, so it takes round N's name — the same swap the final board
     makes. No new locale key: R-labels are template literals across the
     tour boards and are not translated in any locale. */
  const figureLabel = state !== 'live' && currentRound != null
    ? `R${currentRound}`
    : t('tournament.move.today');
  return (
    <section style={{ fontFamily: FONT }}>
      <SectionEyebrow kicker={t(state === 'live' ? 'tournament.move.liveEyebrow' : 'tournament.move.completedEyebrow')} />
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', alignItems: 'center', gap: 12, padding: '14px 16px', background: PAGE_CANVAS, borderBottom: `0.5px solid ${HAIRLINE_INK_8}` }}>
        <div style={{ minWidth: 0 }}>
          <div data-movement-name style={{ fontSize: 15, fontWeight: 700, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.player ? initialSurname(name) : name}</div>
          <div style={{ marginTop: 3, fontSize: 12, color: INK_FAINT, fontVariantNumeric: 'tabular-nums lining-nums' }}>{t('tournament.move.subline', { thru, position, total })}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: getScoreColor(contest.moverToday, 'dark'), fontVariantNumeric: 'tabular-nums lining-nums', lineHeight: 1 }}>{fmtScore(contest.moverToday)}</div>
          <div style={{ marginTop: 4, fontSize: 9.5, fontWeight: 700, letterSpacing: cjk ? 0 : '0.12em', textTransform: cjk ? 'none' : 'uppercase', color: INK_FAINT }}>{figureLabel}</div>
        </div>
      </div>
    </section>
  );
}
