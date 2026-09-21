/**
 * MiniBoard - TD1 top-5 compressed board.
 * Grammar: POS | PLAYER + flag | THRU | TODAY | TOT
 * Row tap opens ScorecardSheet.
 */
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import CountryFlag from '@/components/ui/country-flag';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { todayFromEntry, type BoardEntry } from '../../leaderboard/BoardTable';
import { ScorecardSheet, type ScorecardSheetTarget } from '../../leaderboard/ScorecardSheet';
import {
  FONT, INK, INK_MUTE, INK_FAINT, HAIRLINE_INK_8, SURFACE,
  WHITE_ALPHA_65, WHITE_ALPHA_12, WHITE_ALPHA_06, AMBER,
} from '../../_shared/tokens';
import { PAGE_CANVAS } from '@/lib/tokens/surfaces';
import { fmtScore } from '../../utils/fmtScore';
import { getScoreColor } from '../../_shared/scoreColor';
import { ClbhouzPickMark } from '../../_shared/ClbhouzPickMark';
import { formatEarnings } from '../../_shared/formatEarnings';
import { resolveBoardEntity, teamNamesNeedInitials } from '../../_shared/boardEntity';

type Row = BoardEntry;

interface Props {
  tournamentId: string;
  entries: Row[];
  limit?: number;
  /** Active round from sr_tournaments.current_round - scopes TODAY and THRU. */
  currentRound?: number | null;
  /**
   * THE GROUND THE BOARD SITS ON. One component, two real grounds:
   *  - 'panel' (default): the tournament page (TournamentPage:233 live board and
   *    :255 final board). Its ground is the #15171F app canvas, so the board is
   *    a PANEL that must read as a step UP — SURFACE (#1B1E27).
   *  - 'heroBoard': the Tour Overview hybrid hero (HeroBoardBand). Its board
   *    resolves onto A.CANVAS and is continuous with the page around it.
   *  - 'light': legacy light chrome islands. No live callsite; retained because
   *    the light ramp has not been deleted.
   */
  theme?: 'panel' | 'heroBoard' | 'light';

  /**
   * Player ids that are Tournament Intelligence picks. DEFAULTS TO UNDEFINED so
   * the tournament-page consumers are pixel-identical — no fork.
   *
   * AMBER MEANS THE LIVE ROUND EVERYWHERE ELSE ON TOUR SURFACES. Here it is
   * deliberately a SECOND meaning, bounded to this one mark: it reads as the
   * clbhouz mark, not a status colour, because it is the logo. Do not "correct"
   * it to a neutral tone.
   */
  pickPlayerIds?: Set<string>;
  /** Row tap hook (analytics). Fires before the scorecard sheet opens. */
  onRowTap?: (playerId: string) => void;
  /** Overview-only lifecycle treatment. Tournament-page callers omit it. */
  phase?: 'live' | 'completed';
}

/**
 * Surface tokens per ground. INK has no named dark counterpart — plain white.
 *
 * 'panel' and 'heroBoard' share the ink ramp and differ ONLY in surface: the
 * panel rises above the app canvas while the hero board resolves into it. Same
 * component on two grounds — the ground is passed in, never guessed.
 */
const THEME_TOKENS = {
  light: { surface: SURFACE, ink: INK, mute: INK_MUTE, faint: INK_FAINT, hairline: HAIRLINE_INK_8, press: 'active:bg-black/[0.03]' },
  panel: { surface: SURFACE, ink: '#FFFFFF', mute: WHITE_ALPHA_65, faint: WHITE_ALPHA_65, hairline: WHITE_ALPHA_12, press: 'active:bg-white/[0.06]' },
  heroBoard: { surface: PAGE_CANVAS, ink: '#FFFFFF', mute: WHITE_ALPHA_65, faint: WHITE_ALPHA_65, hairline: WHITE_ALPHA_06, press: 'active:bg-white/[0.06]' },
} as const;


/**
 * Canonical scoring: fmtScore + getScoreColor(..., theme) - the same helpers
 * the schedule, board and college surfaces use. No local forks. The canonical
 * theme is 'dark' (the app's only surface); 'light' survives for the few light
 * chrome islands that have not been flipped, and is NOT the default.
 *
 * Placeholders: a missing figure renders as NOTHING. An em dash is a value in
 * a tabular column and reads as data the field does not have.
 */
const BLANK = '';
/**
 * THE PRIZE RULE — a property of the TOURNAMENT, never of the visible slice.
 * Render the PRIZE column when ANY row has a money value; hide it, header
 * included, when none do. Because the condition reads the whole field, the
 * column is STABLE: expanding, sorting or scrolling the board never flips it.
 *
 * Within a rendered column a row with no money shows an em dash — never a
 * blank, never a zero. A missed cut, a withdrawal, a DQ and a non-starter
 * earn nothing, and a dash is how every leaderboard in the sport states that.
 *
 * Two completed events on the same tour in the same season can legitimately
 * differ here (measured: ~40% of events have no prize data at all). That is
 * the data, not a UI inconsistency — do not "fix" it per event.
 */
export function shouldShowPrize(entries: Array<{ money?: number | null }>): boolean {
  return entries.some((row) => row.money != null);
}

function thruLabel(row: Row, today: number | null): string {
  const s = row.status?.toUpperCase();
  if (s === 'MC' || s === 'CUT') return 'MC';
  if (s === 'WD') return 'WD';
  // THRU must agree with TODAY: no round score for the active round means the
  // player has not started, so the stale top-level thru must not render.
  if (today == null) return BLANK;
  if (row.thru == null) return BLANK;
  return row.thru >= 18 ? 'F' : String(row.thru);
}

export function MiniBoard({ tournamentId, entries, limit = 5, currentRound, theme = 'panel', pickPlayerIds, onRowTap, phase = 'live' }: Props) {
  const { t } = useTranslation('tourhub');
  const [target, setTarget] = useState<ScorecardSheetTarget | null>(null);
  const rows = entries.slice(0, limit);
  const needsInitials = useMemo(() => teamNamesNeedInitials(entries), [entries]);
  const T = THEME_TOKENS[theme];
  /** getScoreColor knows two ramps only; both dark grounds take the dark ramp. */
  const scoreTheme = theme === 'light' ? 'light' : 'dark';
  // Dark grounds: an absent TODAY reads as an em dash (never a zero, never
  // the previous round). The light board keeps its blank-cell doctrine.
  const todayBlank = theme === 'light' ? BLANK : '\u2014';
  const showOverviewPosition = rows.some((row) => row.position != null || ['MC', 'CUT', 'WD'].includes(row.status?.toUpperCase() ?? ''));
  // PRIZE is decided over the WHOLE FIELD (entries), not the rendered slice,
  // so the column cannot appear or vanish as the board is expanded or scrolled.
  const showPrize = shouldShowPrize(entries);
  const showOverviewPrize = phase === 'completed' && showPrize;
  // The live hero board carries TODAY, not THRU: the current round is the story
  // and the swap is what keeps the name column wide enough for real names.
  // Gate shape matches the old THRU gate: render only when a visible row has one.
  const showOverviewToday = phase === 'live' && rows.some((row) => todayFromEntry(row as unknown as Parameters<typeof todayFromEntry>[0], currentRound) != null);
  const overviewGrid = phase === 'completed'
    ? [showOverviewPosition ? '44px' : null, 'minmax(0, 1fr)', '52px', showOverviewPrize ? '52px' : null].filter(Boolean).join(' ')
    : [showOverviewPosition ? '44px' : null, 'minmax(0, 1fr)', showOverviewToday ? '40px' : null, '52px'].filter(Boolean).join(' ');

  const overviewName = (fullName: string | undefined): string => fullName?.trim() || BLANK;

  if (theme === 'heroBoard') {
    return (
      <>
        <div style={{ background: T.surface, fontFamily: FONT }}>
          <div data-overview-board-header style={{ display: 'grid', gridTemplateColumns: overviewGrid, alignItems: 'center', minHeight: 32, padding: '4px 24px', fontSize: 9.5, fontWeight: 800, letterSpacing: '0.12em', color: T.faint, textTransform: 'uppercase' }}>
            {showOverviewPosition ? <div>{t('board.columns.pos')}</div> : null}
            <div>{t('board.columns.player')}</div>
            {phase === 'live' && showOverviewToday ? <div style={{ textAlign: 'right' }}>{t('board.columns.today')}</div> : null}
            <div style={{ textAlign: 'right' }}>{t('board.columns.tot')}</div>
            {showOverviewPrize ? <div style={{ textAlign: 'right' }}>{t('board.columns.prize', 'Prize')}</div> : null}
          </div>
          {rows.map((r) => {
            const entity = resolveBoardEntity(r, needsInitials);
            const posText = r.status === 'MC' || r.status === 'CUT' ? 'MC'
              : r.status === 'WD' ? 'WD'
              : r.position == null ? BLANK
              : `${r.position_tied ? 'T' : ''}${r.position}`;
            const today = todayFromEntry(r as unknown as Parameters<typeof todayFromEntry>[0], currentRound);
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => { if (!r.player?.id) return; onRowTap?.(r.player.id); setTarget({
                  playerId: r.player.id, playerName: entity.label, countryCode: r.player?.country_code ?? r.player?.country ?? null,
                  position: r.position ?? null, positionTied: r.position_tied ?? null, total: r.score ?? null, today, thru: r.thru ?? null, status: r.status ?? null,
                }); }}
                style={{ display: 'grid', gridTemplateColumns: overviewGrid, alignItems: 'center', width: '100%', minHeight: 44, padding: '8px 24px', border: 'none', background: 'transparent', color: T.ink, textAlign: 'left', fontFamily: FONT, cursor: 'pointer' }}
                className={`${T.press} transition-colors`}
              >
                {showOverviewPosition ? <div style={{ fontSize: 12, fontWeight: 700, color: T.mute, fontVariantNumeric: 'tabular-nums' }}>{posText}</div> : null}
                <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ minWidth: 0, whiteSpace: 'normal', lineHeight: 1.15, fontSize: 13, fontWeight: 600 }}>{overviewName(entity.label)}</span>
                  {pickPlayerIds && r.player?.id && pickPlayerIds.has(r.player.id) ? <ClbhouzPickMark size={10} label={t('overview.board.clbhouzPick')} /> : null}
                </div>
                {phase === 'live' && showOverviewToday ? <div style={{ textAlign: 'right', fontSize: 12, fontWeight: 600, color: getScoreColor(today, scoreTheme), fontVariantNumeric: 'tabular-nums' }}>{today == null ? todayBlank : fmtScore(today)}</div> : null}
                <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: getScoreColor(r.score, scoreTheme), fontVariantNumeric: 'tabular-nums' }}>{r.score == null ? BLANK : fmtScore(r.score)}</div>
                {showOverviewPrize ? <div style={{ textAlign: 'right', fontSize: 12, fontWeight: 600, color: r.money != null ? T.mute : T.faint, fontVariantNumeric: 'tabular-nums' }}>{r.money != null ? formatEarnings(r.money) : '—'}</div> : null}
              </button>
            );
          })}
        </div>
        <ScorecardSheet open={!!target} onClose={() => setTarget(null)} tournamentId={tournamentId} target={target} />
      </>
    );
  }



  return (
    <>
      <div style={{ background: T.surface, fontFamily: FONT }}>
        <div
          style={{
            display: 'flex', alignItems: 'center',
            padding: '8px 16px',
            borderBottom: `0.5px solid ${T.hairline}`,
            // AXIS 10: column headers (POS / PLAYER / THRU / TODAY / TOT).
            fontSize: 10, fontWeight: 700, letterSpacing: '0.10em',
            color: T.faint, textTransform: 'uppercase',
          }}
        >
          <div style={{ width: 34, flexShrink: 0 }}>{t('board.columns.pos')}</div>
          <div style={{ flex: 1, minWidth: 0 }}>{t('board.columns.player')}</div>
          <div style={{ width: 40, textAlign: 'right', flexShrink: 0 }}>{t('board.columns.thru')}</div>
          <div style={{ width: 46, textAlign: 'right', flexShrink: 0 }}>{t('board.columns.today')}</div>
          <div style={{ width: 46, textAlign: 'right', flexShrink: 0 }}>{t('board.columns.tot')}</div>
          {showPrize ? <div style={{ width: 52, textAlign: 'right', flexShrink: 0 }}>{t('board.columns.prize', 'Prize')}</div> : null}


        </div>
        {rows.map((r) => {
          const entity = resolveBoardEntity(r, needsInitials);
          const posText = r.status === 'MC' || r.status === 'CUT' ? 'MC'
            : r.status === 'WD' ? 'WD'
            : r.position == null ? BLANK
            : `${r.position_tied ? 'T' : ''}${r.position}`;
          const cc = r.player?.country_code ?? r.player?.country ?? null;
          
          const today = todayFromEntry(r as unknown as Parameters<typeof todayFromEntry>[0], currentRound);
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => { if (!r.player?.id) return; onRowTap?.(r.player.id); setTarget({
                playerId: r.player.id,
                playerName: entity.label,
                countryCode: cc,
                position: r.position ?? null,
                positionTied: r.position_tied ?? null,
                total: r.score ?? null,
                today,
                thru: r.thru ?? null,
                status: r.status ?? null,
              }); }}
              style={{
                display: 'flex', alignItems: 'center', width: '100%',
                padding: '10px 16px',
                borderBottom: `0.5px solid ${T.hairline}`,
                background: r.position === 1 ? 'rgba(251,188,46,0.05)' : 'transparent', border: 'none',
                borderLeft: 'none', borderRight: 'none', borderTop: 'none',
                textAlign: 'left', cursor: 'pointer', fontFamily: FONT,
              }}
              className={`${T.press} transition-colors`}
            >
              <div style={{ width: 34, flexShrink: 0, fontSize: 12.5, fontWeight: 700, color: T.ink, fontVariantNumeric: 'tabular-nums lining-nums' }}>
                {posText}
              </div>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 8 }}>
                {cc ? <CountryFlag country={cc} size="sm" /> : null}
                <span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.15, color: T.ink, whiteSpace: 'normal' }}>
                  {entity.label}
                </span>
                {pickPlayerIds && r.player?.id && pickPlayerIds.has(r.player.id) && (
                  <ClbhouzPickMark size={11} label={t('overview.board.clbhouzPick')} />
                )}
              </div>
              <div style={{ width: 40, textAlign: 'right', flexShrink: 0, fontSize: 12, fontWeight: 600, color: T.mute, fontVariantNumeric: 'tabular-nums lining-nums' }}>
                {thruLabel(r, today)}
              </div>
              <div style={{ width: 46, textAlign: 'right', flexShrink: 0, fontSize: 12, fontWeight: 700, color: getScoreColor(today, scoreTheme), fontVariantNumeric: 'tabular-nums lining-nums' }}>
                {today == null ? todayBlank : fmtScore(today)}
              </div>
              <div style={{ width: 46, textAlign: 'right', flexShrink: 0, fontSize: 13, fontWeight: 700, color: getScoreColor(r.score, scoreTheme), fontVariantNumeric: 'tabular-nums lining-nums' }}>
                {r.score == null ? BLANK : fmtScore(r.score)}
              </div>
              {/* No money earned is a VALUE: an em dash in the faint slot, never
                  a blank, never a zero. Column presence is a tournament-level
                  decision (showPrize) so it cannot flicker per row. */}
              {showPrize ? (
                <div style={{ width: 52, textAlign: 'right', flexShrink: 0, fontSize: 12, fontWeight: 600, color: r.money != null ? T.mute : T.faint, fontVariantNumeric: 'tabular-nums lining-nums' }}>
                  {r.money != null ? formatEarnings(r.money) : '—'}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
      <ScorecardSheet
        open={!!target}
        onClose={() => setTarget(null)}
        tournamentId={tournamentId}
        target={target}
      />
    </>
  );
}
