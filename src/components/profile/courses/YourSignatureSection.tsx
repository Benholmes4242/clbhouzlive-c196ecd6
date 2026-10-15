import React, { useMemo } from 'react';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { CategoryScores } from '@/components/courses/course-detail/CategoryScores';
import { buildSignature, signatureSentence, type SignatureRow } from './yourSignature';

export const YourSignatureSection: React.FC<{ rows: SignatureRow[] }> = ({ rows }) => {
  const model = useMemo(() => buildSignature(rows), [rows]);
  if (!model) return null;
  const { categories } = model;
  const sentence = signatureSentence(model);
  const mean = (label: string) => categories.find((c) => c.label === label)?.mean ?? null;

  return (
    <section data-testid="your-signature" style={{ padding: '0 20px' }}>
      <SectionHeader tone="amber" kicker="HOW YOU RATE" title="What you actually reward" />
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
      {/* The four AVERAGES in the shared category block; it owns the score tone rule. */}
      <CategoryScores marginTop={14} scores={{ design: mean('Design'), condition: mean('Condition'), clubhouse: mean('Clubhouse'), facilities: mean('Facilities') }} />
    </section>
  );
};
