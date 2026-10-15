import React, { useMemo } from 'react';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { A, SUB_SCORE_GREEN_MIN } from '@/features/courses/components/holes/analytical/tokens';
import { MEDAL_GOLD } from '@/lib/tokens/medals';
import { buildSignature, type SignatureRow } from './yourSignature';
import { ChaseBar } from './TheChaseSection';

const NUMERIC: React.CSSProperties = { fontVariantNumeric: 'tabular-nums' };

const diff = (cat: number, overall: number) => Math.abs(cat - overall).toFixed(1);

export const YourSignatureSection: React.FC<{ rows: SignatureRow[] }> = ({ rows }) => {
  const model = useMemo(() => buildSignature(rows), [rows]);
  if (!model) return null;
  const { categories, overall, high, low } = model;

  return (
    <section data-testid="your-signature" style={{ padding: '0 20px' }}>
      <SectionHeader kicker="YOUR SIGNATURE" title="What you actually reward" />
      {/*
        Compared ONLY with this member's own overall average. There is no
        per-member population average for the four categories anywhere in the
        schema — course_rating_aggregates averages per COURSE, not across
        members — so any comparison with other golfers would be invented.
      */}
      <p data-testid="signature-sentence" style={{ fontSize: 12.5, lineHeight: 1.55, color: A.MUTE, margin: '8px 0 0' }}>
        You are a <b style={{ color: A.INK, fontWeight: 700 }}>{high.label.toLowerCase()}</b> voter — you mark it{' '}
        {diff(high.mean, overall)} above your overall average
        {categories.length > 1 ? `, and ${low.label.toLowerCase()} ${diff(low.mean, overall)} below.` : '.'}
      </p>
      {categories.map((c) => (
        <div key={c.label} data-testid="signature-row" style={{ marginTop: 9, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 66, flexShrink: 0, fontSize: 11, fontWeight: 700, color: A.BODY }}>{c.label}</span>
          <ChaseBar ratio={c.mean / 10} fill={c.mean >= SUB_SCORE_GREEN_MIN ? A.GREEN : MEDAL_GOLD} />
          <span style={{ width: 62, flexShrink: 0, textAlign: 'right', fontSize: 11, fontWeight: 700, color: A.BODY, ...NUMERIC }}>
            {c.mean.toFixed(1)}
          </span>
        </div>
      ))}
    </section>
  );
};
