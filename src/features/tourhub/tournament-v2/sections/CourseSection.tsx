/**
 * CourseSection - "The Course" tournament section.
 * Renders HARDEST / EASIEST cards from get_tournament_hole_analysis, and
 * an "All 18 holes >" sheet that uses SharedHoleCard with countLabel="players".
 * Section self-hides when the RPC reports unavailable coverage.
 */
import React, { useMemo, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { SectionEyebrow } from './SectionEyebrow';
import {
  useTournamentHoleAnalysis,
  type TournamentHole,
} from '../data/useTournamentHoleAnalysis';
import {
  FONT, INK, INK_MUTE, INK_FAINT, SURFACE, HAIRLINE_INK_8, SLATE_50, AMBER,
  TOPAR_UNDER_LIGHT, TOPAR_OVER_LIGHT,
} from '../../_shared/tokens';
import { SharedHoleCard } from '@/features/courses/_shared/holes/SharedHoleCard';
import type { SharedHole } from '@/features/courses/_shared/holes/types';
import { formatNumber } from '@/i18n/format';

interface Props { tournamentId: string }

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
function avgColorFor(avg: number): string {
  if (avg > AVG_EPSILON) return TOPAR_OVER_LIGHT;
  if (avg < -AVG_EPSILON) return TOPAR_UNDER_LIGHT;
  return INK_MUTE;
}
function fmtAvg(v: number): string {
  if (Math.abs(v) < 0.005) return `\u00B10.00`;
  if (v > 0) return `+${v.toFixed(2)}`;
  return `\u2212${Math.abs(v).toFixed(2)}`;
}

export function CourseSection({ tournamentId }: Props) {
  const { data } = useTournamentHoleAnalysis(tournamentId);
  const [open, setOpen] = useState(false);

  const holes = data?.holes ?? [];
  const played = holes.filter((h) => Number.isFinite(h.avg_to_par));
  if (!data?.available || played.length === 0) return null;

  const sorted = [...played].sort((a, b) => b.avg_to_par - a.avg_to_par);
  const hardest = sorted[0];
  const easiest = sorted[sorted.length - 1];

  const Card = ({ label, h }: { label: string; h: TournamentHole }) => (
    <div
      style={{
        flex: 1, background: SURFACE, borderRadius: 12,
        border: `0.5px solid ${HAIRLINE_INK_8}`, padding: '12px 14px',
        fontFamily: FONT,
      }}
    >
      <div style={{ fontSize: 8.5, fontWeight: 800, color: INK_FAINT, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
        <span style={{ fontSize: 24, fontWeight: 200, color: INK, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
          {h.hole_no}
        </span>
        {h.par != null && (
          <span style={{ fontSize: 10, fontWeight: 700, color: INK_MUTE, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Par {h.par}
          </span>
        )}
      </div>
      <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 9, fontWeight: 800, color: INK_FAINT, letterSpacing: '0.10em', textTransform: 'uppercase' }}>
          Avg vs par
        </span>
        <span style={{ fontSize: 14, fontWeight: 800, color: avgColorFor(h.avg_to_par), fontVariantNumeric: 'tabular-nums' }}>
          {fmtAvg(h.avg_to_par)}
        </span>
      </div>
    </div>
  );

  return (
    <>
      <SectionEyebrow kicker="The Course" actionLabel="All 18 holes" onAction={() => setOpen(true)} />
      <div style={{ display: 'flex', gap: 12, padding: '0 16px 4px' }}>
        <Card label="Hardest" h={hardest} />
        <Card label="Easiest" h={easiest} />
      </div>
      <HolesSheet
        open={open}
        onClose={() => setOpen(false)}
        holes={holes}
        hardest={hardest}
        easiest={easiest}
        totalPlayers={data.total_players}
      />
    </>
  );
}

function HolesSheet({
  open,
  onClose,
  holes,
  hardest,
  easiest,
  totalPlayers,
}: {
  open: boolean;
  onClose: () => void;
  holes: TournamentHole[];
  hardest: TournamentHole;
  easiest: TournamentHole;
  totalPlayers: number;
}) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
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

  return (
    <BottomSheet open={open} onClose={onClose} variant="light" surfaceColor={SLATE_50} style={{ height: '75dvh', maxHeight: '75dvh' }}>
      <div style={{ background: SLATE_50, fontFamily: FONT, height: '75dvh', maxHeight: '75dvh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '4px 16px 8px' }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: AMBER, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            All 18 Holes
          </div>
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
                {formatNumber(totalPlayers)} player{totalPlayers === 1 ? '' : 's'}
              </span>
              {' \u00B7 field scoring'}
            </span>
          </div>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, paddingBottom: 16 }}>
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
        </div>
      </div>
    </BottomSheet>
  );
}

const FeatureMini: React.FC<{ tone: 'hard' | 'easy'; h: TournamentHole; maxAbs: number }> = ({ tone, h, maxAbs }) => {
  const tint = tone === 'hard' ? 'rgba(29,93,191,0.05)' : 'rgba(210,34,45,0.05)';
  const border = tone === 'hard' ? 'rgba(29,93,191,0.18)' : 'rgba(210,34,45,0.18)';
  const eyebrow = tone === 'hard' ? TOPAR_OVER_LIGHT : TOPAR_UNDER_LIGHT;
  const label = tone === 'hard' ? 'HARDEST' : 'EASIEST';
  const playsTo = (h.par + h.avg_to_par).toFixed(1);
  const magnitude = Math.min(1, Math.abs(h.avg_to_par) / Math.max(0.01, maxAbs)) * 50;
  const isOver = h.avg_to_par > AVG_EPSILON;
  const isUnder = h.avg_to_par < -AVG_EPSILON;
  return (
    <div
      style={{
        flex: 1,
        background: tint,
        border: `1px solid ${border}`,
        borderRadius: 14,
        padding: '12px 14px',
        fontFamily: FONT,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: eyebrow }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <div style={{ fontSize: 40, fontWeight: 200, color: INK, letterSpacing: '-0.02em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
          {h.hole_no}
        </div>
        <div style={{ fontSize: 11.5, fontWeight: 600, color: INK_MUTE, fontVariantNumeric: 'tabular-nums' }}>
          Plays to {playsTo}
        </div>
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, color: INK_MUTE, letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: -2, fontVariantNumeric: 'tabular-nums' }}>
        Par {h.par}
      </div>
      <div
        aria-hidden
        style={{ position: 'relative', width: '100%', height: 4, background: 'rgba(15,23,42,0.06)', borderRadius: 4, overflow: 'hidden' }}
      >
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, background: 'rgba(15,23,42,0.14)', transform: 'translateX(-0.5px)' }} />
        {isUnder && (
          <div style={{ position: 'absolute', top: 0, bottom: 0, right: '50%', width: `${magnitude}%`, background: TOPAR_UNDER_LIGHT }} />
        )}
        {isOver && (
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: `${magnitude}%`, background: TOPAR_OVER_LIGHT }} />
        )}
      </div>
    </div>
  );
};
