import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { resolvePlayerAvatarCandidates } from '@/features/tourhub/_shared/resolvePlayerAvatar';
import type { ProProfile, ProBandBase } from './_shared/proBenchmark';


const EXPLAINER: Record<ProBandBase, string> = {
  lowest_gross:
    "Projected from {first}'s current tour scoring average, measured against the difficulty of the courses they play. We take that edge and apply it to this course's Course Rating, then adjust for relative length — a course playing shorter than tour distance (≈7,200 yds) adds a fractional stroke of scoring advantage, capped to keep the estimate realistic. The result is their expected single-round gross here.",
  most_birdies:
    "Built from {first}'s tour birdie rate per round, then scaled by how much easier this course rates than the courses they typically face — derived from the gap between tour Course Rating and this course's, plus a length adjustment. That per-round figure is multiplied across the number of rounds you've logged here, giving their projected birdie total over the same sample.",
  most_eagles:
    "Based on {first}'s tour eagle rate per round, amplified by this course's relative ease versus tour setups — a function of the Course Rating differential and playing length. Scaled across your round count at this course, it estimates how many eagles they'd be expected to make over the same number of plays.",
};

interface Props {
  pro: ProProfile;
  value: string;
  sub: string;
  base: ProBandBase;
}

export const ProBenchmarkBand: React.FC<Props> = ({ pro, value, sub, base }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const [explainerOpen, setExplainerOpen] = useState(false);
  const headshotUrl = getPlayerHeadshotUrl(pro.full_name, pro.tour_code);
  const first = pro.full_name.split(' ')[0];

  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          gap: 10,
          alignItems: 'center',
          padding: '10px 13px',
          background: 'var(--hcp-tour-dim)',
          border: '1px dashed var(--hcp-tour-border)',
          borderRadius: 12,
        }}
      >
        {/* Headshot squircle with initials placeholder fallback */}
        <div style={{ width: 36, height: 36, position: 'relative', flexShrink: 0 }} aria-hidden>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, #1e3a8a, #2563EB)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '0.02em',
              ...squircleMaskStyle,
            }}
          >
            {pro.initials}
          </div>
          {!imgFailed && (
            <img
              src={headshotUrl}
              alt=""
              onError={() => setImgFailed(true)}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                ...squircleMaskStyle,
              }}
            />
          )}
        </div>

        {/* Name + sub */}
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 800,
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
            fontWeight: 800,
            color: 'var(--hcp-tour-text)',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.02em',
            whiteSpace: 'nowrap',
          }}
        >
          {value}
        </span>
      </div>

      {explainerOpen && (
        <div style={{
          marginTop: 10,
          padding: '10px 12px',
          background: 'var(--hcp-tint-2)',
          borderRadius: 10,
          fontSize: 11,
          lineHeight: 1.5,
          color: 'var(--hcp-t-70)',
        }}>
          {EXPLAINER[base].replace('{first}', first)}
        </div>
      )}
    </div>
  );
};

export default ProBenchmarkBand;
