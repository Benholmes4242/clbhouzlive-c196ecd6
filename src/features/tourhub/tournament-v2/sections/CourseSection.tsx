/**
 * CourseSection - "The Course" tournament section.
 * Renders HARDEST / EASIEST cards from get_tournament_hole_analysis, and
 * an "All 18 holes >" sheet that uses SharedHoleCard with countLabel="players".
 * Section self-hides when the RPC reports unavailable coverage.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck } from 'lucide-react';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { SectionEyebrow } from './SectionEyebrow';
import {
  useTournamentHoleAnalysis,
  type TournamentHole,
} from '../data/useTournamentHoleAnalysis';
import { FONT, INK_MUTE, INK_FAINT, AMBER } from '../../_shared/tokens';
import {
  A, CAPTION, KICKER, LABEL, NUM, Panel, toParParts,
} from '@/features/courses/components/holes/analytical/tokens';
import { SharedHoleCard } from '@/features/courses/_shared/holes/SharedHoleCard';
import type { SharedHole } from '@/features/courses/_shared/holes/types';
import { formatNumber } from '@/i18n/format';
import { ScopeSegment, type ScopeSegmentOption } from '@/components/shared/ScopeSegment';


interface Props { tournamentId: string }

type RoundKey = 'all' | '1' | '2' | '3' | '4';

function toShared(h: TournamentHole): SharedHole {
  return {
    hole_no: h.hole_no,
    par: h.par,
    yards: h.yards,
    stroke_index: h.stroke_index, // null in tournaments -> SI hidden
    rounds: h.rounds,
    avg_to_par: h.avg_to_par,
    avg_gross: h.avg_gross,
    dist: h.dist,
  };
}

const AVG_EPSILON = 0.05;

export function CourseSection({ tournamentId }: Props) {
  const { t } = useTranslation(['tourhub', 'courses']);
  // Mini cards always represent the full tournament (all rounds combined).
  const { data } = useTournamentHoleAnalysis(tournamentId, null);
  const [open, setOpen] = useState(false);

  const holes = data?.holes ?? [];
  const played = holes.filter((h) => Number.isFinite(h.avg_to_par));
  if (!data?.available || played.length === 0) return null;

  const sorted = [...played].sort((a, b) => b.avg_to_par - a.avg_to_par);
  const hardest = sorted[0];
  const easiest = sorted[sorted.length - 1];

  return (
    <>
      <SectionEyebrow kicker={t('tournament.course.title', { ns: 'tourhub' })} actionLabel={t('tournament.course.allHolesAction', { ns: 'tourhub' })} onAction={() => setOpen(true)} />
      <FeaturePair hardest={hardest} easiest={easiest} />

      <HolesSheet
        open={open}
        onClose={() => setOpen(false)}
        tournamentId={tournamentId}
        roundsPresent={data.rounds_present ?? []}
      />
    </>
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

  const played = holes.filter((h) => Number.isFinite(h.avg_to_par));
  const sorted = [...played].sort((a, b) => b.avg_to_par - a.avg_to_par);
  const hardest = sorted[0];
  const easiest = sorted[sorted.length - 1];

  const toggle = (n: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });

  const maxAbs = useMemo(
    () => Math.max(0.01, ...holes.map((h) => Math.abs(h.avg_to_par))),
    [holes],
  );

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

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      variant="light"
      surfaceColor={A.PANEL}
      ariaLabelledBy="tournament-holes-sheet-title"
      style={{ height: '75dvh', maxHeight: '75dvh' }}
    >
      <div style={{ background: A.PANEL, fontFamily: FONT, height: '75dvh', maxHeight: '75dvh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '0 16px 8px' }}>
          <div style={KICKER}>{t('tournament.course.title', { ns: 'tourhub' })}</div>
          <h2
            id="tournament-holes-sheet-title"
            style={{ margin: '3px 0 0', fontSize: 17, fontWeight: 800, color: A.INK, letterSpacing: '-0.01em' }}
          >
            {t('tournament.course.allHolesTitle', { ns: 'tourhub' })}
          </h2>

          {/* Amber credibility pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 8,
              padding: '7px 12px',
              borderRadius: 999,
              background: 'rgba(247,147,30,0.08)',
              border: '1px solid rgba(247,147,30,0.18)',
              fontSize: 11.5,
              fontWeight: 600,
              color: '#B8720E',
            }}
          >
            <ShieldCheck size={13} strokeWidth={2.2} />
            <span>
              <span style={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                {t('holes.players', {
                  ns: 'courses',
                  count: totalPlayers,
                  formattedCount: formatNumber(totalPlayers),
                })}
              </span>
              {t('tournament.course.fieldScoringSuffix', { ns: 'tourhub' })}
            </span>

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

        <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, paddingBottom: 16 }}>
          {isLoading || !hardest || !easiest ? (
            <div style={{ padding: '24px 16px', fontSize: 12.5, fontWeight: 600, color: INK_FAINT }}>
              {t('tournament.course.roundEmpty', { ns: 'tourhub', defaultValue: 'No scoring data for this round yet.' })}
            </div>
          ) : (
            <>
              {/* HARDEST / EASIEST feature cards */}
              {hardest.hole_no !== easiest.hole_no && (
                <div style={{ padding: '4px 16px 4px', display: 'flex', gap: 12 }}>
                  <FeatureMini tone="hard" h={hardest} maxAbs={maxAbs} />
                  <FeatureMini tone="easy" h={easiest} maxAbs={maxAbs} />
                </div>
              )}
              {holes.map((h) => (
                <SharedHoleCard
                  key={h.hole_no}
                  hole={toShared(h)}
                  maxAbs={maxAbs}
                  countLabel="players"
                  expanded={expanded.has(h.hole_no)}
                  onToggle={() => toggle(h.hole_no)}
                  tag={
                    h.hole_no === hardest.hole_no
                      ? 'hardest'
                      : h.hole_no === easiest.hole_no
                      ? 'easiest'
                      : null
                  }
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
 * FeaturePair - HARDEST / EASIEST in ONE analytical Panel.
 *
 * Correctness: the figure is the hole's scoring average RELATIVE TO PAR
 * (canonical toParParts), never the gross average - a par 3 that plays to
 * 3.4 is "+0.4", and that is the only number that compares across holes.
 * Difficulty colour follows the canonical grammar: over par reads RED,
 * under par reads GREEN.
 */
const FeatureHalf: React.FC<{ tone: string; label: string; h: TournamentHole }> = ({ tone, label, h }) => {
  const { t } = useTranslation(['tourhub', 'courses']);
  const parts = toParParts(h.avg_to_par, 1);
  return (
    <div style={{ minWidth: 0, flex: 1 }}>
      <div style={{ ...LABEL, color: tone }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
        <span style={{ ...NUM, fontSize: 28, color: A.INK, lineHeight: 1 }}>{h.hole_no}</span>
        {parts && (
          <span style={{ ...NUM, fontSize: 15, color: parts.tone, lineHeight: 1 }}>{parts.text}</span>
        )}
      </div>
      <div style={{ ...CAPTION, marginTop: 6 }}>
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
    <div style={{ padding: '0 16px 4px' }}>
      <Panel>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <FeatureHalf tone={A.OVER} label={t('holes.hardest', { ns: 'courses' })} h={hardest} />
          <div style={{ width: 1, alignSelf: 'stretch', background: A.BORDER }} aria-hidden="true" />
          <FeatureHalf tone={A.UNDER} label={t('holes.easiest', { ns: 'courses' })} h={easiest} />
        </div>
      </Panel>
    </div>
  );
};

