import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { resolvePlayerAvatarCandidates } from '@/features/tourhub/_shared/resolvePlayerAvatar';
import { tourYards } from './_shared/proBenchmark';
import type { ProProfile, ProBandBase } from './_shared/proBenchmark';


const formatYards = (y: number): string => y.toLocaleString('en-US');

/**
 * ASCII-only, per-pro explainer copy. The tour-distance figure is
 * interpolated from tourYards(pro.tour_code) so LPGA pros correctly
 * say approx 6,500 yards while others say approx 7,200 yards.
 */
function buildExplainer(base: ProBandBase, pro: ProProfile): string {
  const first = pro.full_name.split(' ')[0];
  const yds = formatYards(tourYards(pro.tour_code));
  switch (base) {
    case 'lowest_gross':
      return `Projected from ${first}'s current tour scoring average, measured against the difficulty of the courses they play. We take that edge and apply it to this course's Course Rating, then adjust for relative length. A course playing shorter than tour distance (approx ${yds} yds) adds a fractional stroke of scoring advantage, capped to keep the estimate realistic. The result is their expected single-round gross here.`;
    case 'most_birdies':
      return `Built from ${first}'s tour birdie rate per round, then scaled by how much easier this course rates than the courses they typically face, derived from the gap between tour Course Rating and this course's, plus a length adjustment against approx ${yds} yds. That per-round figure is multiplied across the number of rounds you've logged here, giving their projected birdie total over the same sample.`;
    case 'most_eagles':
      return `Based on ${first}'s tour eagle rate per round, amplified by this course's relative ease versus tour setups, a function of the Course Rating differential and playing length against approx ${yds} yds. Scaled across your round count at this course, it estimates how many eagles they'd be expected to make over the same number of plays.`;
  }
}

interface Props {
  pro: ProProfile;
  value: string;
  sub: string;
  base: ProBandBase;
}

export const ProBenchmarkBand: React.FC<Props> = ({ pro, value, sub, base }) => {
  const [explainerOpen, setExplainerOpen] = useState(false);
  const avatarCandidates = resolvePlayerAvatarCandidates({
    name: pro.full_name,
    photoUrl: (pro as { photo_url?: string | null }).photo_url ?? null,
    tourSlug: pro.tour_code,
  });

  return (
    <div style={{ marginTop: 12 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          gap: 12,
          alignItems: 'center',
          padding: '12px',
          background: 'var(--hcp-tour-dim)',
          border: '1px dashed var(--hcp-tour-border)',
          borderRadius: 12,
        }}
      >
        {/* Canonical headshot squircle (photo → multi-folder walk → initials) */}
        <SquircleAvatar
          size={36}
          srcCandidates={avatarCandidates}
          alt={pro.full_name}
          fallback={pro.initials}
          hairlineRing
        />


        {/* Name + sub */}
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                color: 'var(--hcp-t-100)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                letterSpacing: '-0.005em',
              }}
            >
              {pro.full_name}
            </span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setExplainerOpen((o) => !o); }}
              aria-label="How this is calculated"
              style={{
                flexShrink: 0,
                width: 18,
                height: 18,
                borderRadius: 999,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--hcp-tour-tag-bg)',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <Info size={11} color="var(--hcp-tour-text)" strokeWidth={2.5} />
            </button>
          </div>
          <span
            style={{
              fontSize: 10,
              color: 'var(--hcp-t-60)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {sub}
          </span>
        </div>

        {/* Value */}
        <span
          style={{
            fontSize: 19,
            fontWeight: 700,
            color: 'var(--hcp-tour-text)',
            fontVariantNumeric: 'tabular-nums lining-nums',
            letterSpacing: '-0.02em',
            whiteSpace: 'nowrap',
          }}
        >
          {value}
        </span>
      </div>

      {explainerOpen && (
        <div style={{
          marginTop: 12,
          padding: '12px',
          background: 'var(--hcp-tint-2)',
          borderRadius: 10,
          fontSize: 11,
          lineHeight: 1.5,
          color: 'var(--hcp-t-70)',
        }}>
          {buildExplainer(base, pro)}
        </div>
      )}
    </div>
  );
};

export default ProBenchmarkBand;
