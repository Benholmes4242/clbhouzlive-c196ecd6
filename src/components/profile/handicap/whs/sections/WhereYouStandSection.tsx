import React, { useEffect, useRef } from 'react';
import { Users, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHandicapPercentile } from '@/lib/whs/usePercentile';
import type {
  HandicapPercentileResult,
  HandicapPercentileBucket,
  HandicapBucket,
} from '@/lib/whs/types';
import { analyticsEvents } from '@/utils/analyticsEvents';

const AMBER     = '#F7931E';
const AMBER_06  = 'rgba(247,147,30,0.06)';
const AMBER_14  = 'rgba(247,147,30,0.14)';
const INK       = '#0F172A';
const INK_70    = '#475569';
const INK_55    = 'rgba(15,23,42,0.55)';
const INK_40    = 'rgba(15,23,42,0.40)';
const INK_10    = 'rgba(15,23,42,0.10)';
const INK_06    = 'rgba(15,23,42,0.06)';
const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

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

function getPercentileCopy(percentile_top: number, country: string, gender: 'male' | 'female'): CopyBand {
  const countryLabel = country === 'United Kingdom' ? 'the UK' : country;
  const cohortLabel = `${gender} golfers`;

  if (percentile_top <= 5) {
    return {
      display: `Top ${percentile_top}%`,
      caption: `Among the very best ${cohortLabel} in ${countryLabel}`,
      emphasis: 'celebrate',
    };
  }
  if (percentile_top <= 25) {
    return {
      display: `Top ${percentile_top}%`,
      caption: `In the top tier of ${cohortLabel} in ${countryLabel}`,
      emphasis: 'standard',
    };
  }
  if (percentile_top <= 50) {
    return {
      display: `Above the median`,
      caption: `Better than half of ${cohortLabel} in ${countryLabel}`,
      emphasis: 'soft',
    };
  }
  if (percentile_top <= 75) {
    return {
      display: `Middle of the pack`,
      caption: `See where you sit among ${cohortLabel} in ${countryLabel}`,
      emphasis: 'distribution_only',
    };
  }
  return {
    display: `Where you sit`,
    caption: `Among ${cohortLabel} in ${countryLabel}`,
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
  const maxPct = Math.max(...buckets.map((b) => b.pct), 1);
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
        {buckets.map((b) => {
          const isUser = b.is_user_bucket;
          const heightPct = (b.pct / (maxPct * 1.1)) * 100;
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
                  <span
                    style={{
                      position: 'absolute',
                      left: '50%',
                      bottom: -4,
                      transform: 'translateX(-50%)',
                      width: 0,
                      height: 0,
                      borderLeft: '4px solid transparent',
                      borderRight: '4px solid transparent',
                      borderTop: `4px solid ${AMBER_14}`,
                    }}
                  />
                </div>
              )}
              <div
                style={{
                  width: '100%',
                  height: `${Math.max(heightPct, 3)}%`,
                  background: isUser ? AMBER : INK_10,
                  borderRadius: 4,
                }}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
        {buckets.map((b) => (
          <div
            key={b.bucket}
            style={{
              flex: 1,
              textAlign: 'center',
              fontFamily: FONT_GEIST,
              fontSize: 10.5,
              fontWeight: 600,
              color: b.is_user_bucket ? INK : INK_40,
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
  const copy = getPercentileCopy(data.percentile_top, data.country, data.gender);
  const cohortLabel =
    data.country === 'United Kingdom'
      ? `UK ${data.gender}`
      : `${data.country} ${data.gender}`;

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
                of {cohortLabel} golfers
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
            You're better than {100 - data.percentile_top}% of {cohortLabel} golfers.
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
            {cohortLabel}
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

const UnavailableCard: React.FC<{
  reason: 'missing_country' | 'missing_gender' | 'cohort_too_small';
}> = ({ reason }) => {
  const navigate = useNavigate();

  const config = {
    missing_country: {
      title: 'Add your country',
      message: 'Set your country in Settings to see how you compare against other golfers.',
      cta: 'Go to Settings' as string | null,
      action: () => navigate('/settings'),
    },
    missing_gender: {
      title: 'Add your gender',
      message: 'Set your gender in Settings to unlock peer comparison.',
      cta: 'Go to Settings' as string | null,
      action: () => navigate('/settings'),
    },
    cohort_too_small: {
      title: 'Not enough data yet',
      message:
        'There aren\u2019t enough golfers in your country and gender cohort to show a meaningful comparison. We\u2019ll surface this once the cohort grows.',
      cta: null as string | null,
      action: null as null | (() => void),
    },
  }[reason];

  return (
    <div
      style={{
        margin: '0 20px',
        background: '#FFFFFF',
        border: `0.5px solid ${INK_10}`,
        borderRadius: 14,
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 10,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: AMBER_06,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Users size={18} color={AMBER} />
      </div>
      <div>
        <div
          style={{
            fontFamily: FONT_GEIST,
            fontSize: 15,
            fontWeight: 700,
            color: INK,
          }}
        >
          {config.title}
        </div>
        <p
          style={{
            fontFamily: FONT_GEIST,
            fontSize: 13,
            color: INK_70,
            margin: '4px 0 0',
            lineHeight: 1.4,
          }}
        >
          {config.message}
        </p>
      </div>
      {config.cta && config.action && (
        <button
          onClick={config.action}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: 'none',
            padding: 0,
            color: AMBER,
            fontFamily: FONT_GEIST,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {config.cta}
          <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
};

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
            analyticsEvents.track('where_you_stand_viewed', {
              user_id: userId,
              available: data.available,
              reason: data.available ? null : data.reason,
              percentile_top: data.available ? data.percentile_top : null,
              cohort_size: data.available
                ? data.cohort_size
                : data.cohort_size ?? null,
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
  if (!data.available && (data.reason === 'missing_handicap' || data.reason === 'unauthenticated')) {
    return null;
  }

  return (
    <section ref={sectionRef} style={{ marginTop: 28 }}>
      <Eyebrow>WHERE YOU STAND</Eyebrow>
      {data.available ? (
        <AvailableCard data={data} />
      ) : (
        <UnavailableCard
          reason={data.reason as 'missing_country' | 'missing_gender' | 'cohort_too_small'}
        />
      )}
    </section>
  );
};

export default WhereYouStandSection;
