import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import type { StandoutRound } from '@/components/explore-tab-new/courseled/hooks/useStandoutRounds';
import type { useRoundHoleShapes } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { InlineProMemberName } from '@/features/pro-verification/InlineProMemberName';
import { ScoreFigureRow, type ScoreFigureCell } from '@/components/shared/ScoreFigureRow';
import {
  LATELY_UNDER_RED, boldParts, fillTemplate, latelyNines, latelyTileLine,
  playedOffLabel, signedWhole, stablefordPoints,
} from '@/components/courses/course-detail/about/latelyRules';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { formatDayMonthShortGB } from '@/i18n/format';
import { getInitialsFromName } from '@/lib/avatarFallback';

import './lately-tile.css';

/**
 * ROUND CARD — the course page's Lately here tile (CS1), rebuilt in the
 * scorecard tile's grammar (COURSE_PAGE_ROUND_TILES): player row, the shared
 * ScoreFigureRow, the "against their average" line and two glass nines.
 * Consumers: CourseLatelySection and StandoutRoundsSection (opt-in header,
 * line and points props). RoundTileParts / RoundTileMarks
 * are left for their other users. Geometry and paint live in lately-tile.css;
 * latelyNines uses BoardRound's shared holeMarkGrade so tile/feed grades agree.
 */

/** CS1: the course page's own-round amber, name and edge only. */
export const OWN_ROUND_AMBER = '#F7931E';
export const OWN_ROUND_BORDER = 'rgba(247,147,30,0.35)';

const SCORE_RULES = `
@container lately-tile (max-width: 250px) {
  [data-lately-score-row] [data-score-breakdown] { column-gap: 6px !important; }
  [data-lately-score-row] [data-score-label] { font-size: 8.5px !important; letter-spacing: 0.05em !important; }
  [data-lately-score-row] [data-score-divider] { padding-right: 11px !important; margin-right: 11px !important; }
  [data-lately-score-row] [data-score-divider] [data-score-figure] { font-size: 24px !important; }
}`;

export function RoundCard({
  round,
  shapes,
  locale,
  onOpenRound,
  onOpenMember,
  inCircle = false,
  own = false,
  header,
  line: lineOverride,
  points: pointsOverride,
}: {
  round: StandoutRound;
  shapes: ReturnType<typeof useRoundHoleShapes>;
  locale: string;
  onOpenRound?: (scoreId: string, ownerUserId: string | null) => void;
  onOpenMember?: (userId: string) => void;
  /** Retained for call-site compatibility; the tile is always "here". */
  here?: boolean;
  inCircle?: boolean;
  own?: boolean;
  /** Optional first child before the who row; adds lately-tile--photo (Standout rounds). */
  header?: ReactNode;
  /** Optional <b>-marked line replacing latelyTileLine. */
  line?: string;
  /** When defined, the POINTS cell shows this value instead of the computed points. */
  points?: number | null;
}) {
  const { t } = useTranslation('courses');
  const shape = round.whs_score_id ? shapes?.get(round.whs_score_id) ?? null : null;
  const name = round.display_name || t('discover.aMember', 'A member');
  /* Day before month ("18 Nov"), the shared en-GB formatter. */
  const date = round.play_date ? formatDayMonthShortGB(`${round.play_date.slice(0, 10)}T12:00:00`) : '';
  const meta = own
    ? `${t('courseDetail.lately.tile.you', 'You')} · ${date}`
    : inCircle
      ? `${t('courseDetail.lately.tile.circle', 'Circle')} · ${date}`
      : date;

  const par = round.course_par;
  const gross = round.gross_score;
  const lead: ScoreFigureCell | null = gross == null ? null : {
    key: 'gross',
    value: String(gross),
    label: par != null ? `${t('courseDetail.lately.tile.par', 'PAR')} ${par}` : t('courseDetail.lately.tile.gross', 'GROSS'),
  };
  const cells: ScoreFigureCell[] = [];
  if (gross != null && par != null) {
    const toPar = gross - par;
    cells.push({ key: 'topar', value: signedWhole(toPar), label: t('courseDetail.lately.tile.toPar', 'TO PAR'), color: toPar < 0 ? LATELY_UNDER_RED : undefined });
  }
  if (round.net_score != null) {
    cells.push({ key: 'net', value: String(round.net_score), label: t('courseDetail.lately.tile.net', 'NET') });
    const points = pointsOverride !== undefined ? pointsOverride : stablefordPoints(shape, round.course_handicap);
    if (points != null) cells.push({ key: 'points', value: String(points), label: t('courseDetail.lately.tile.points', 'POINTS') });
  } else {
    const off = playedOffLabel(round.course_handicap);
    if (off != null) cells.push({ key: 'playedoff', value: off, label: t('courseDetail.lately.tile.playedOff', 'PLAYED OFF') });
  }

  const line = lineOverride !== undefined ? null : latelyTileLine(round, own, locale);
  const lineText = lineOverride !== undefined ? lineOverride : line
    ? fillTemplate(
        t(line.key, { ...line.values, possessive: own ? t('courseDetail.lately.tile.your', 'your') : t('courseDetail.lately.tile.their', 'their'), defaultValue: line.defaultValue }) as string,
        { ...line.values, possessive: own ? t('courseDetail.lately.tile.your', 'your') : t('courseDetail.lately.tile.their', 'their') },
      )
    : '';
  const nines = latelyNines(shape);

  const open = () => {
    if (!round.whs_score_id) return;
    analyticsEvents.track('rounds_shelf_card_tapped', { kind: 'round' });
    onOpenRound?.(round.whs_score_id, round.user_id);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      data-rounds-shelf-card="round"
      data-own-round={own ? 'true' : undefined}
      className={header ? 'lately-tile lately-tile--photo' : 'lately-tile'}
      onClick={open}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        open();
      }}
      style={{ border: `1px solid ${own ? OWN_ROUND_BORDER : 'rgba(255,255,255,0.08)'}` }}
    >
      {header}
      <button
        type="button"
        className="lately-tile-who"
        data-lately-who
        aria-label={name}
        onClick={(event) => { event.stopPropagation(); if (round.user_id) onOpenMember?.(round.user_id); }}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <SquircleAvatar size={36} src={round.profile_photo_url} alt="" fallback={getInitialsFromName(name)} userId={round.user_id ?? undefined} hairlineRing />
        <span className="lately-tile-identity">
          <span data-round-card-name className="lately-tile-name" style={own ? { color: OWN_ROUND_AMBER } : undefined}>
            <InlineProMemberName userId={round.user_id}>{name}</InlineProMemberName>
          </span>
          <span data-round-card-meta className="lately-tile-meta">{meta}</span>
        </span>
      </button>
      <div data-lately-score-row>
        <ScoreFigureRow
          name="lately-score"
          lead={lead}
          cells={cells}
          dividerColor="rgba(255,255,255,0.14)"
          cellWeight={700}
          dividerSpace={14}
          leadAlign="center"
          rules={SCORE_RULES}
          style={{ marginTop: 14 }}
        />
      </div>
      <div data-lately-line className="lately-tile-line">
        {boldParts(lineText).map((p, i) => (p.bold ? <b key={i}>{p.text}</b> : <span key={i}>{p.text}</span>))}
      </div>
      {nines ? (
        <div data-lately-nines className="lately-tile-nines">
          {nines.map((nine) => (
            <div key={nine.label} data-lately-nine={nine.label} className="lately-nine">
              {nine.cells.map((c) => <span key={`n${c.hole}`} className="lately-nine-n">{c.hole}</span>)}
              <span className="lately-nine-n lately-nine-t">{nine.label}</span>
              {nine.cells.map((c) => (
                <span key={`s${c.hole}`} className="lately-nine-s">
                  <i data-mark={c.mark}>{c.mark === 'empty' ? '' : c.strokes ?? ''}</i>
                </span>
              ))}
              <span data-lately-nine-total className="lately-nine-s lately-nine-st">{nine.total ?? ''}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
