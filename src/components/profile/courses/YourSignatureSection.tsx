import React, { useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { CategoryScores } from '@/components/courses/course-detail/CategoryScores';
import { buildSignature, signatureSentence, type SignatureRow } from './yourSignature';

export const YourSignatureSection: React.FC<{ rows: SignatureRow[]; isOwnProfile?: boolean; ownerFirstName?: string | null }> = ({ rows, isOwnProfile = true, ownerFirstName = null }) => {
  const { t } = useTranslation('common');
  const voice = isOwnProfile ? 'Own' : ownerFirstName ? 'Friend' : 'Other';
  const model = useMemo(() => buildSignature(rows), [rows]);
  if (!model) return null;
  const { categories } = model;
  const sentence = signatureSentence(model);
  const mean = (label: string) => categories.find((c) => c.label === label)?.mean ?? null;

  return (
    <section data-testid="your-signature" style={{ padding: '0 20px' }}>
      <SectionHeader tone="amber" kicker={t(`profile.courses.signature.kicker${voice}`, { name: ownerFirstName, defaultValue: isOwnProfile ? 'HOW YOU RATE' : ownerFirstName ? 'HOW {{name}} RATES' : 'HOW THEY RATE' })} title={t(`profile.courses.signature.title${voice}`, { name: ownerFirstName, defaultValue: isOwnProfile ? 'What you actually reward' : ownerFirstName ? 'What {{name}} actually rewards' : 'What they actually reward' })} />
      {/*
        Compared ONLY with the mean of this member's own category averages. There is no
        per-member population average for the four categories anywhere in the
        schema — course_rating_aggregates averages per COURSE, not across
        members — so any comparison with other golfers would be invented.
      */}
      <p data-testid="signature-sentence" style={{ fontSize: 12.5, lineHeight: 1.55, color: A.MUTE, margin: '8px 0 0' }}>
        {sentence.kind === 'even' ? (
          t(`profile.courses.signature.even${voice}`, { name: ownerFirstName, defaultValue: isOwnProfile ? 'You rate the four evenly — none sits more than 0.2 from your average across them.' : ownerFirstName ? '{{name}} rates the four evenly — none sits more than 0.2 from their average across them.' : 'They rate the four evenly — none sits more than 0.2 from their average across them.' })
        ) : (
          <Trans
            t={t}
            i18nKey={`profile.courses.signature.voter${voice}${sentence.low ? '' : 'HighOnly'}`}
            values={{ name: ownerFirstName, high: sentence.high, highGap: sentence.highGap, low: sentence.low, lowGap: sentence.lowGap }}
            components={{ bold: <b style={{ color: A.INK, fontWeight: 700 }} /> }}
            defaults={`${isOwnProfile ? 'You are a <bold>{{high}}</bold> voter — you mark it {{highGap}} above your' : ownerFirstName ? '{{name}} is a <bold>{{high}}</bold> voter — marking it {{highGap}} above their' : 'They are a <bold>{{high}}</bold> voter — marking it {{highGap}} above their'} average across the four${sentence.low ? ', and {{low}} {{lowGap}} below.' : '.'}`}
          />
        )}
      </p>
      {/* The four AVERAGES in the shared category block; it owns the score tone rule. */}
      <CategoryScores marginTop={14} scores={{ design: mean('Design'), condition: mean('Condition'), clubhouse: mean('Clubhouse'), facilities: mean('Facilities') }} />
    </section>
  );
};
