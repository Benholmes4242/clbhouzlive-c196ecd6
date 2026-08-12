/**
 * CourseSection - "The Course" tournament section.
 *
 * One Panel that states its sample, names the hardest and easiest holes with
 * their to-par figures, and previews the FOUR MOST NOTABLE holes (two playing
 * hardest, two playing easiest) using the analytical TournamentHoleRow - the
 * course page's row family minus the member marker and the SI column. "See all 18 holes" opens the 75dvh sheet.
 * Section self-hides when the RPC reports unavailable coverage.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { BottomSheet } from '@/components/ui/BottomSheet';
import {
  useTournamentHoleAnalysis,
  type TournamentHole,
} from '../data/useTournamentHoleAnalysis';
import { FONT } from '../../_shared/tokens';
import {
  A, CAPTION, KICKER, LABEL, NUM, Panel, toParParts,
} from '@/features/courses/components/holes/analytical/tokens';
import {
  TournamentHoleRow,
  TourHoleRampLegend,
  TOUR_PREVIEW_COUNT,
  buildTourHoleScale,
} from './TournamentHoleRow';
import { formatNumber } from '@/i18n/format';
import { ScopeSegment, type ScopeSegmentOption } from '@/components/shared/ScopeSegment';
import { analyticsEvents } from '@/utils/analyticsEvents';


interface Props { tournamentId: string }

type RoundKey = 'all' | '1' | '2' | '3' | '4';

export function CourseSection({ tournamentId }: Props) {
  const { t } = useTranslation(['tourhub', 'courses']);
  // Preview always represents the full tournament (all rounds combined).
  const { data } = useTournamentHoleAnalysis(tournamentId, null);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const holes = data?.holes ?? [];
  const played = holes.filter((h) => Number.isFinite(h.avg_to_par));
  if (!data?.available || played.length === 0) return null;

  const sorted = [...played].sort((a, b) => b.avg_to_par - a.avg_to_par);
  const hardest = sorted[0];
  const easiest = sorted[sorted.length - 1];
  const totalPlayers = data.total_players ?? 0;

  // The marker domain spans ALL EIGHTEEN played holes, so a tick further right
  // always means a harder hole. Never per visible row.
  const scale = buildTourHoleScale(played);

  /**
   * The four most notable holes: two playing hardest, two playing easiest,
   * hardest first. Holes 1-4 is an arbitrary window - nothing about how a
   * course is playing lives in its opening four. Mid-round, preview whatever
   * has data.
   */
  const preview = (() => {
    if (sorted.length <= TOUR_PREVIEW_COUNT) return sorted;
    return [sorted[0], sorted[1], sorted[sorted.length - 2], sorted[sorted.length - 1]];
  })();

  const togglePreview = (holeNo: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(holeNo)) next.delete(holeNo);
      else {
        next.add(holeNo);
        void analyticsEvents.track('tour_tournament_hole_expanded', {
          tournament_id: tournamentId,
          hole_no: holeNo,
          round: null,
          from: 'preview',
        });
      }
      return next;
    });
  };

  const openSheet = () => {
    setOpen(true);
    void analyticsEvents.track('tour_tournament_holes_opened', { tournament_id: tournamentId });
  };

  return (
    <div style={{ padding: '0 16px 4px', marginTop: 16 }}>
      <Panel
        kicker={t('tournament.course.title', { ns: 'tourhub' })}
        aside={t('tournament.course.fromPlayers', {
          ns: 'tourhub',
          count: totalPlayers,
          formattedCount: formatNumber(totalPlayers),
        })}
        footer={t('tournament.course.seeAllHoles', { ns: 'tourhub', defaultValue: 'See all 18 holes' })}
        onOpen={openSheet}
      >
        {hardest.hole_no !== easiest.hole_no && (
          <FeaturePair hardest={hardest} easiest={easiest} />
        )}
        <TourHoleRampLegend />
        {preview.map((h, i) => (
          <TournamentHoleRow
            key={h.hole_no}
            row={h}
            scale={scale}
            totalHoles={played.length}
            open={expanded.has(h.hole_no)}
            onToggle={() => togglePreview(h.hole_no)}
            last={i === preview.length - 1}
          />
        ))}
      </Panel>

      <HolesSheet
        open={open}
        onClose={() => setOpen(false)}
        tournamentId={tournamentId}
        roundsPresent={data.rounds_present ?? []}
      />
    </div>
  );
}

function HolesSheet({
  open,
  onClose,
  tournamentId,
  roundsPresent,
}: {
  open: boolean;
  onClose: () => void;
  tournamentId: string;
  roundsPresent: number[];
}) {
  const { t } = useTranslation(['tourhub', 'courses']);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  // Default: highest round present (fallback: all rounds).
  const highest = roundsPresent.length ? Math.max(...roundsPresent) : null;
  const initial: RoundKey = highest ? (String(highest) as RoundKey) : 'all';
  const [round, setRound] = useState<RoundKey>(initial);

  // Re-seed selection each time the sheet opens so it lands on the latest round.
  useEffect(() => {
    if (open) setRound(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, highest]);

  const roundParam = round === 'all' ? null : Number(round);
  const { data, isLoading } = useTournamentHoleAnalysis(tournamentId, roundParam);
  const holes = data?.holes ?? [];
  const totalPlayers = data?.total_players ?? 0;

  // Hole order in the sheet - the sheet is the place for sequence. Holes with
  // no finite average are omitted, never drawn as zero.
  const played = [...holes]
    .filter((h) => Number.isFinite(h.avg_to_par))
    .sort((a, b) => a.hole_no - b.hole_no);
  const sheetScale = buildTourHoleScale(played);
  const sorted = [...played].sort((a, b) => b.avg_to_par - a.avg_to_par);
  const hardest = sorted[0];
  const easiest = sorted[sorted.length - 1];

  const toggle = (holeNo: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(holeNo)) next.delete(holeNo);
      else {
        next.add(holeNo);
        void analyticsEvents.track('tour_tournament_hole_expanded', {
          tournament_id: tournamentId,
          hole_no: holeNo,
          round: roundParam,
          from: 'sheet',
        });
      }
      return next;
    });

  const roundOptions: ReadonlyArray<ScopeSegmentOption<RoundKey>> = useMemo(() => {
    const present = new Set(roundsPresent);
    return [
      { value: 'all' as RoundKey, label: t('tournament.course.roundAll', { ns: 'tourhub', defaultValue: 'All' }) },
      ...(['1', '2', '3', '4'] as RoundKey[]).map((r) => ({
        value: r,
        label: t('tournament.allTeeTimes.roundShort', { ns: 'tourhub', round: r, defaultValue: `R${r}` }),
        disabled: !present.has(Number(r)),
      })),
    ];
  }, [t, roundsPresent]);

  const subLine =
    round === 'all'
      ? t('tournament.course.sheetSubAll', {
          ns: 'tourhub',
          count: totalPlayers,
          formattedCount: formatNumber(totalPlayers),
          defaultValue: 'From {{count}} players . all rounds',
        })
      : t('tournament.course.sheetSubRound', {
          ns: 'tourhub',
          count: totalPlayers,
          formattedCount: formatNumber(totalPlayers),
          round,
          defaultValue: 'From {{count}} players . round {{round}}',
        });

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      variant="light"
      ariaLabelledBy="tournament-holes-sheet-title"
      style={{ height: '75dvh', maxHeight: '75dvh' }}
    >
      {/* Canonical sheet surface: --bg-page #F8FAFC. Panels inside stay A.PANEL. */}
      <div style={{ background: '#F8FAFC', fontFamily: FONT, height: '75dvh', maxHeight: '75dvh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '0 16px 10px' }}>
          <div style={KICKER}>{t('tournament.course.title', { ns: 'tourhub' })}</div>
          <h2
            id="tournament-holes-sheet-title"
            style={{ margin: '3px 0 6px', fontSize: 17, fontWeight: 700, color: A.INK, letterSpacing: '-0.01em' }}
          >
            {t('tournament.course.sheetTitle', { ns: 'tourhub', defaultValue: 'How the field scores' })}
          </h2>
          <div style={LABEL}>
            {subLine}
            {' \u00B7 '}
            {t('courses:courseDetail.holes.tapHint')}
          </div>

          <div style={{ marginTop: 10 }}>
            <ScopeSegment
              value={round}
              onChange={(v) => setRound(v as RoundKey)}
              options={roundOptions}
              ariaLabel={t('tournament.allTeeTimes.roundScopeAria', { ns: 'tourhub', defaultValue: 'Round' })}
            />
          </div>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, padding: '0 16px 28px' }}>
          {isLoading ? null : !hardest || !easiest ? (
            <div style={{ ...CAPTION, padding: '24px 16px', textAlign: 'center' }}>
              {t('tournament.course.roundEmptyBody', {
                ns: 'tourhub',
                defaultValue: 'No scoring data for this round yet.',
              })}
            </div>
          ) : (
            <>
              {hardest.hole_no !== easiest.hole_no && (
                <FeaturePair hardest={hardest} easiest={easiest} />
              )}

              <TourHoleRampLegend />
              {played.map((h, i) => (
                <TournamentHoleRow
                  key={h.hole_no}
                  row={h}
                  scale={sheetScale}
                  totalHoles={played.length}
                  open={expanded.has(h.hole_no)}
                  onToggle={() => toggle(h.hole_no)}
                  last={i === played.length - 1}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}


/**
 * FeaturePair - HARDEST / EASIEST as a bare flex row the parent Panel places.
 *
 * Correctness: the figure is the hole's scoring average RELATIVE TO PAR
 * (canonical toParParts), never the gross average - a par 3 that plays to
 * 3.4 is "+0.4", and that is the only number that compares across holes.
 * Difficulty takes NEUTRAL INK. Hardest and easiest describe COURSE
 * DIFFICULTY, not anybody's score, so the member green/red convention does not
 * apply here and amber (the viewing member) has no meaning on a tour surface.
 * Emphasis comes from position and weight, not hue.
 */
const FeatureHalf: React.FC<{ label: string; h: TournamentHole }> = ({ label, h }) => {
  const { t } = useTranslation(['tourhub', 'courses']);
  const parts = toParParts(h.avg_to_par, 1);
  return (
    <div style={{ minWidth: 0, flex: 1 }}>
      <div style={{ ...LABEL }}>{label}</div>
      <div style={{ ...NUM, fontSize: 17, color: A.INK, marginTop: 6, lineHeight: 1.1 }}>
        {t('tournament.course.holeN', { ns: 'tourhub', n: h.hole_no, defaultValue: 'Hole {{n}}' })}
      </div>
      {parts && (
        <div style={{ ...NUM, fontSize: 22, color: A.INK, marginTop: 4, lineHeight: 1.1 }}>
          {parts.text}
        </div>
      )}
      <div style={{ ...LABEL, marginTop: 6 }}>
        {t('board.meta.par', { ns: 'tourhub', par: h.par })}
        {h.yards != null
          ? ` \u00B7 ${t('courses:courseDetail.holes.yards')} ${formatNumber(h.yards)}`
          : ''}
      </div>
    </div>
  );
};

const FeaturePair: React.FC<{ hardest: TournamentHole; easiest: TournamentHole }> = ({ hardest, easiest }) => {
  const { t } = useTranslation(['tourhub', 'courses']);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 18 }}>
      <FeatureHalf label={t('holes.hardest', { ns: 'courses' })} h={hardest} />
      <div style={{ width: 1, alignSelf: 'stretch', background: A.BORDER }} aria-hidden="true" />
      <FeatureHalf label={t('holes.easiest', { ns: 'courses' })} h={easiest} />
    </div>
  );
};
