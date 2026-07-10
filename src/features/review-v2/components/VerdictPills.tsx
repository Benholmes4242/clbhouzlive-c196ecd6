/**
 * VerdictPills — four exclusive-choice pills for the composer.
 */

import React from 'react';
import { VERDICTS, RV2, type VerdictSlug } from '../tokens';

interface Props {
  value: VerdictSlug | null;
  onChange: (slug: VerdictSlug) => void;
}

export function VerdictPills({ value, onChange }: Props) {
  return (
    <div
      role="radiogroup"
      aria-label="Verdict"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 8,
      }}
    >
      {VERDICTS.map((v) => {
        const active = value === v.slug;
        return (
          <button
            key={v.slug}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(v.slug)}
            style={{
              padding: '11px 12px',
              borderRadius: 12,
              border: `1px solid ${active ? RV2.amber : RV2.hairline}`,
              background: active ? RV2.amberSoft : '#FFFFFF',
              color: active ? RV2.amber : RV2.ink,
              fontSize: 13.5,
              fontWeight: active ? 700 : 600,
              letterSpacing: '-0.005em',
              cursor: 'pointer',
              transition: 'background 120ms, border-color 120ms, color 120ms',
              textAlign: 'center',
            }}
          >
            {v.label}
          </button>
        );
      })}
    </div>
  );
}
