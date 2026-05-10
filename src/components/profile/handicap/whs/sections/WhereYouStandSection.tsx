import React, { useEffect, useRef } from 'react';
import SectionHeader from './SectionHeader';
import { useHandicapPercentile } from '@/lib/whs/usePercentile';
import type {
  HandicapPercentileResult,
  HandicapPercentileBucket,
  HandicapBucket,
} from '@/lib/whs/types';
import { analyticsEvents } from '@/utils/analyticsEvents';

const AMBER     = '#F7931E';
const AMBER_14  = 'rgba(247,147,30,0.14)';
const INK       = '#0F172A';
const INK_70    = '#475569';
const INK_55    = 'rgba(15,23,42,0.55)';
const INK_40    = 'rgba(15,23,42,0.40)';
const INK_10    = 'rgba(15,23,42,0.10)';
const INK_06    = 'rgba(15,23,42,0.06)';
const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

const BUCKET_ORDER: HandicapBucket[] = [
  'sub_zero', '0_4', '5_9', '10_14', '15_19', '20_24', 'over_25',
];

const BUCKET_LABEL: Record<HandicapBucket, string> = {
  sub_zero: '<0',
  '0_4':    '0–4',
  '5_9':    '5–9',
  '10_14':  '10–14',
  '15_19':  '15–19',
  '20_24':  '20–24',
  over_25:  '25+',
};

type CopyBand = {
  headline: string;
  pillLabel: string;
  pillTone: 'positive' | 'neutral' | 'soft';
  subline: string;
  emphasis: 'celebrate' | 'standard' | 'soft' | 'distribution_only';
};

function getPercentileCopy(percentile_top: number): CopyBand {
  const headline = `Top ${percentile_top}%`;
  const subline = 'Out of all active golfers on clbhouz this season.';
  if (percentile_top <= 5) {
    return { headline, pillLabel: 'TOP TIER', pillTone: 'positive', subline, emphasis: 'celebrate' };
  }
  if (percentile_top <= 25) {
    return { headline, pillLabel: 'ABOVE MEDIAN', pillTone: 'positive', subline, emphasis: 'standard' };
  }
  if (percentile_top <= 50) {
    return { headline, pillLabel: 'ABOVE MEDIAN', pillTone: 'positive', subline, emphasis: 'soft' };
  }
  if (percentile_top <= 75) {
    return { headline, pillLabel: 'MID-PACK', pillTone: 'neutral', subline, emphasis: 'distribution_only' };
  }
  return { headline, pillLabel: 'BUILDING', pillTone: 'soft', subline, emphasis: 'distribution_only' };
}

interface Props {
  userId: string;
}


const DistributionChart: React.FC<{
  buckets: HandicapPercentileBucket[];
  userBucket: HandicapBucket;
  userHandicap: number;
}> = ({ buckets, userHandicap }) => {
  // Build a lookup so missing buckets render at 0% rather than collapsing.
  const byBucket = new Map<HandicapBucket, HandicapPercentileBucket>();
  buckets.forEach((b) => byBucket.set(b.bucket, b));

  const orderedBuckets: HandicapPercentileBucket[] = BUCKET_ORDER.map((key) =>
    byBucket.get(key) ?? { bucket: key, pct: 0, is_user_bucket: false },
  );

  const maxPct = Math.max(...orderedBuckets.map((b) => b.pct), 1);

  return (
    <div style={{ marginTop: 18, position: 'relative' }}>
      {/* Scratch-zone marker — soft tint + dashed top edge (no full frame) */}
      {/* Tint */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 22,
          bottom: 0,
          left: 0,
          width: 'calc(2 * ((100% - 36px) / 7) + 6px)',
          background: 'rgba(34,197,94,0.06)',
          borderRadius: 6,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      {/* Dashed top edge — sits at the top of the chart plot area, above the bars */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 14,
          left: 0,
          width: 'calc(2 * ((100% - 36px) / 7) + 6px)',
          height: 0,
          borderTop: '1px dashed #22C55E',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />
      {/* Tiny "SCRATCH" caps text above the dashed line */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: 4,
          fontSize: 8.5,
          fontWeight: 800,
          color: '#15803D',
          letterSpacing: '0.16em',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      >
        SCRATCH
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 6,
          height: 110,
          paddingTop: 22,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {(() => {
          let cum = 0;
          let medianBucketIdx = -1;
          for (let i = 0; i < orderedBuckets.length; i++) {
            cum += orderedBuckets[i].pct;
            if (cum >= 50 && medianBucketIdx === -1) {
              medianBucketIdx = i;
            }
          }
          return orderedBuckets.map((b, i) => {
            const isUser = b.is_user_bucket;
            const isMedian = i === medianBucketIdx && !isUser;
            const heightPct = (b.pct / (maxPct * 1.1)) * 100;
            const isEmpty = b.pct === 0;
            const barBg = isUser
              ? `linear-gradient(180deg, ${AMBER}, rgba(247,147,30,0.55))`
              : isMedian
                ? `linear-gradient(180deg, rgba(15,23,42,0.25), rgba(15,23,42,0.10))`
                : `linear-gradient(180deg, rgba(15,23,42,0.10), rgba(15,23,42,0.04))`;
            return (
              <div
                key={b.bucket}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  position: 'relative',
                  height: '100%',
                }}
              >
                {/* User-bucket identity carried entirely by amber gradient + glow shadow below */}
                <div
                  style={{
                    width: '100%',
                    height: isEmpty ? '3%' : `${Math.max(heightPct, 3)}%`,
                    background: barBg,
                    opacity: isEmpty && !isUser ? 0.5 : 1,
                    borderRadius: '6px 6px 0 0',
                    boxShadow: isUser ? '0 0 16px rgba(247,147,30,0.30)' : 'none',
                  }}
                />
              </div>
            );
          });
        })()}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
        {orderedBuckets.map((b) => (
          <div
            key={b.bucket}
            style={{
              flex: 1,
              textAlign: 'center',
              fontFamily: FONT_GEIST,
              fontSize: 10.5,
              fontWeight: b.is_user_bucket ? 700 : 500,
              color: b.is_user_bucket ? INK : INK_55,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {BUCKET_LABEL[b.bucket]}
          </div>
        ))}
      </div>
    </div>
  );
};

const AvailableCard: React.FC<{
  data: Extract<HandicapPercentileResult, { available: true }>;
}> = ({ data }) => {
  const copy = getPercentileCopy(data.percentile_top);

  return (
    <>
      {/* Hero: number + tone pill on one row */}
      <div
        style={{
          padding: '0 20px',
          display: 'flex',
          alignItems: 'baseline',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <h3
          style={{
            fontFamily: FONT_GEIST,
            margin: 0,
            fontSize: 44,
            fontWeight: 800,
            color: INK,
            letterSpacing: '-0.04em',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {copy.headline}
        </h3>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '5px 11px',
            borderRadius: 999,
            background:
              copy.pillTone === 'positive' ? 'rgba(34,197,94,0.12)'
              : copy.pillTone === 'neutral' ? AMBER_14
              : 'rgba(15,23,42,0.06)',
            color:
              copy.pillTone === 'positive' ? '#15803D'
              : copy.pillTone === 'neutral' ? '#854F0B'
              : INK_70,
            fontSize: 11.5,
            fontWeight: 800,
            letterSpacing: '0.04em',
            fontFamily: FONT_GEIST,
          }}
        >
          {copy.pillLabel}
        </span>
      </div>

      <p
        style={{
          fontFamily: FONT_GEIST,
          fontSize: 13,
          color: INK_55,
          padding: '6px 20px 0',
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        {copy.subline}
      </p>

      <div
        style={{
          margin: '14px 20px 0',
          background: '#FFFFFF',
          border: `0.5px solid ${INK_10}`,
          borderRadius: 14,
          padding: 14,
        }}
      >
        <DistributionChart
          buckets={data.buckets}
          userBucket={data.user_bucket}
          userHandicap={data.user_handicap}
        />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 14,
            paddingTop: 12,
            borderTop: `0.5px solid ${INK_06}`,
            fontFamily: FONT_GEIST,
            fontSize: 10.5,
            fontWeight: 600,
            color: INK_55,
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span
              style={{
                display: 'inline-block',
                width: 12,
                height: 0,
                borderTop: '1px dashed #22C55E',
              }}
            />
            <span>Scratch territory</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span
              style={{
                width: 10,
                height: 3,
                background: 'rgba(15,23,42,0.25)',
                borderRadius: 1,
              }}
            />
            <span>Median bucket</span>
          </span>
        </div>
      </div>
    </>
  );
};

const UnavailableCard: React.FC<{ reason: 'cohort_unavailable' }> = () => (
  <div
    style={{
      margin: '0 20px',
      padding: '20px',
      borderRadius: 14,
      background: 'rgba(15,23,42,0.04)',
      border: '0.5px solid rgba(15,23,42,0.10)',
      fontFamily: FONT_GEIST,
      textAlign: 'center',
    }}
  >
    <p style={{
      margin: 0,
      fontSize: 13,
      color: 'rgba(15,23,42,0.55)',
    }}>
      Comparison data is being prepared. Check back soon.
    </p>
  </div>
);

export const WhereYouStandSection: React.FC<Props> = ({ userId }) => {
  const { data, isLoading } = useHandicapPercentile(userId);

  const fired = useRef(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!data || fired.current) return;
    const node = sectionRef.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !fired.current) {
            fired.current = true;
            const d: any = data;
            analyticsEvents.track('where_you_stand_viewed', {
              user_id: userId,
              available: d.available,
              reason: d.available ? null : d.reason,
              percentile_top: d.available ? d.percentile_top : null,
              cohort_size: d.cohort_size ?? null,
            });
          }
        });
      },
      { threshold: 0.5 }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [data, userId]);

  if (isLoading) {
    return (
      <section style={{ marginTop: 28 }}>
        <SectionHeader eyebrow="WHERE YOU STAND" title="Among active golfers" />
        <div
          style={{
            margin: '0 20px',
            height: 240,
            borderRadius: 14,
            background: INK_06,
          }}
        />
      </section>
    );
  }

  if (!data) return null;
  const d: HandicapPercentileResult = data;
  if (d.available === false && d.reason !== 'cohort_unavailable') {
    return null;
  }

  return (
    <section ref={sectionRef} style={{ marginTop: 28 }}>
      <SectionHeader eyebrow="WHERE YOU STAND" title="Among active golfers" />
      {d.available === true ? (
        <AvailableCard data={d} />
      ) : (
        <UnavailableCard reason="cohort_unavailable" />
      )}
    </section>
  );
};

export default WhereYouStandSection;
