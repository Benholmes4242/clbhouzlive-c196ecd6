import React, { useMemo } from 'react';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { A, SUB_SCORE_GREEN_MIN } from '@/features/courses/components/holes/analytical/tokens';
import { MEDAL_GOLD } from '@/lib/tokens/medals';
import { buildSignature, signatureSentence, type SignatureRow } from './yourSignature';
import { ChaseBar } from './TheChaseSection';

const NUMERIC: React.CSSProperties = { fontVariantNumeric: 'tabular-nums' };

export const YourSignatureSection: React.FC<{ rows: SignatureRow[] }> = ({ rows }) => {
  const model = useMemo(() => buildSignature(rows), [rows]);
  if (!model) return null;
  const { categories } = model;
  const sentence = signatureSentence(model);

  return (
    <section data-testid="your-signature" style={{ padding: '0 20px' }}>
      <SectionHeader kicker="HOW YOU RATE" title="What you actually reward" />
      {/*
        Compared ONLY with the mean of this member's own category averages. There is no
        per-member population average for the four categories anywhere in the
        schema — course_rating_aggregates averages per COURSE, not across
        members — so any comparison with other golfers would be invented.
      */}
      <p data-testid="signature-sentence" style={{ fontSize: 12.5, lineHeight: 1.55, color: A.MUTE, margin: '8px 0 0' }}>
        {sentence.kind === 'even' ? (
          'You rate the four evenly — none sits more than 0.2 from your average across them.'
        ) : (
          <>
            You are a <b style={{ color: A.INK, fontWeight: 700 }}>{sentence.high}</b> voter — you mark it{' '}
            {sentence.highGap} above your average across the four
            {sentence.low ? `, and ${sentence.low} ${sentence.lowGap} below.` : '.'}
          </>
        )}
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
