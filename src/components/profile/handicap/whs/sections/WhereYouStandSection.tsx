import React, { useEffect, useRef } from 'react';
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
  display: string;
  caption: string;
  emphasis: 'celebrate' | 'standard' | 'soft' | 'distribution_only';
};

function getPercentileCopy(percentile_top: number): CopyBand {
  if (percentile_top <= 5) {
    return {
      display: `Top ${percentile_top}%`,
      caption: `Among the very best on Clbhouz`,
      emphasis: 'celebrate',
    };
  }
  if (percentile_top <= 25) {
    return {
      display: `Top ${percentile_top}%`,
      caption: `In the top tier on Clbhouz`,
      emphasis: 'standard',
    };
  }
  if (percentile_top <= 50) {
    return {
      display: `Above the median`,
      caption: `Better than half of Clbhouz members`,
      emphasis: 'soft',
    };
  }
  if (percentile_top <= 75) {
    return {
      display: `Middle of the pack`,
      caption: `See where you sit on Clbhouz`,
      emphasis: 'distribution_only',
    };
  }
  return {
    display: `Where you sit`,
    caption: `Among Clbhouz members`,
    emphasis: 'distribution_only',
  };
}

interface Props {
  userId: string;
}

const Eyebrow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 20px', marginBottom: 10 }}>
    <span style={{ width: 6, height: 6, borderRadius: 3, background: AMBER }} />
    <span
      style={{
        fontFamily: FONT_GEIST,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.14em',
        color: INK_55,
        textTransform: 'uppercase',
      }}
    >
      {children}
    </span>
  </div>
);

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
  const handicapStr = userHandicap.toFixed(1).replace('-', '\u2212');

  return (
    <div style={{ marginTop: 18 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 6,
          height: 110,
          paddingTop: 22,
        }}
      >
        {orderedBuckets.map((b) => {
          const isUser = b.is_user_bucket;
          const heightPct = (b.pct / (maxPct * 1.1)) * 100;
          const isEmpty = b.pct === 0;
          const barBg = isUser
            ? `linear-gradient(180deg, ${AMBER}, rgba(247,147,30,0.55))`
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
              {isUser && (
                <div
                  style={{
                    position: 'absolute',
                    top: -22,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      fontFamily: FONT_GEIST,
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: INK,
                      background: AMBER_14,
                      padding: '2px 6px',
                      borderRadius: 6,
                      whiteSpace: 'nowrap',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    You · {handicapStr}
                  </div>
                  <div style={{ width: 2, height: 6, background: AMBER }} />
                </div>
              )}
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
        })}
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
  const showBigPct = copy.emphasis === 'celebrate' || copy.emphasis === 'standard';

  return (
    <>
      <h3
        style={{
          fontFamily: FONT_GEIST,
          fontSize: 22,
          fontWeight: 700,
          color: INK,
          padding: '0 20px',
          margin: 0,
          letterSpacing: '-0.01em',
        }}
      >
        {copy.display}
      </h3>
      <p
        style={{
          fontFamily: FONT_GEIST,
          fontSize: 13,
          color: INK_55,
          padding: '4px 20px 0',
          margin: 0,
          lineHeight: 1.4,
        }}
      >
        {copy.caption}
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
        {showBigPct && (
          <>
            <div
              style={{
                fontFamily: FONT_GEIST,
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: '0.14em',
                color: INK_55,
                textTransform: 'uppercase',
              }}
            >
              YOU RANK
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
              <span
                style={{
                  fontFamily: FONT_GEIST,
                  fontSize: 40,
                  fontWeight: 800,
                  color: AMBER,
                  letterSpacing: '-0.02em',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {data.percentile_top}%
              </span>
              <span
                style={{
                  fontFamily: FONT_GEIST,
                  fontSize: 13,
                  color: INK_70,
                }}
              >
                of Clbhouz members
              </span>
            </div>
          </>
        )}

        {copy.emphasis === 'soft' && (
          <p
            style={{
              fontFamily: FONT_GEIST,
              fontSize: 14,
              fontWeight: 600,
              color: INK,
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            You're better than {100 - data.percentile_top}% of Clbhouz members.
          </p>
        )}

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
          }}
        >
          <span
            style={{
              fontFamily: FONT_GEIST,
              fontSize: 12,
              fontWeight: 600,
              color: INK_70,
            }}
          >
            All Clbhouz members
          </span>
          <span
            style={{
              fontFamily: FONT_GEIST,
              fontSize: 12,
              fontWeight: 700,
              color: INK,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {showBigPct ? `Top ${data.percentile_top}%` : copy.display}
          </span>
        </div>
      </div>

      <p
        style={{
          fontFamily: FONT_GEIST,
          fontSize: 11.5,
          color: INK_40,
          padding: '8px 20px 0',
          margin: 0,
          lineHeight: 1.45,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        Comparison among {data.cohort_size.toLocaleString()} active WHS indexes
        refreshed nightly. Bucketed for privacy — exact ranks are never shown.
      </p>
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
        <Eyebrow>WHERE YOU STAND</Eyebrow>
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
      <Eyebrow>WHERE YOU STAND</Eyebrow>
      {d.available === true ? (
        <AvailableCard data={d} />
      ) : (
        <UnavailableCard reason="cohort_unavailable" />
      )}
    </section>
  );
};

export default WhereYouStandSection;
